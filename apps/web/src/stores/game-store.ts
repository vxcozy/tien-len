'use client';

import { create } from 'zustand';
import { TienLenGame, SimpleAI, sortHand, detectCombination, isValidPlay } from '@tienlen/engine';
import type { Card, ClientGameState, GameEvent, Combination } from '@tienlen/shared';

interface GameStore {
  game: TienLenGame | null;
  clientState: ClientGameState | null;
  selectedCardIds: Set<string>;
  mode: 'idle' | 'singleplayer' | 'multiplayer';

  // Actions
  startSinglePlayer: (playerCount?: number) => void;
  selectCard: (cardId: string) => void;
  deselectCard: (cardId: string) => void;
  toggleCard: (cardId: string) => void;
  clearSelection: () => void;
  playSelected: () => void;
  pass: () => void;
  sortMyHand: () => void;

  // Derived
  getSelectedCombination: () => Combination | null;
  canPlaySelection: () => boolean;
  canPass: () => boolean;
  isMyTurn: () => boolean;
}

const AI_NAMES = ['Minh', 'Linh', 'Duc', 'Hoa', 'Tuan', 'Mai', 'Nam'];

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  clientState: null,
  selectedCardIds: new Set(),
  mode: 'idle',

  startSinglePlayer: (playerCount = 4) => {
    const playerIds = ['human', ...Array.from({ length: playerCount - 1 }, (_, i) => `ai${i}`)];
    const shuffledNames = [...AI_NAMES].sort(() => Math.random() - 0.5);
    const playerNames = new Map<string, string>([
      ['human', 'You'],
      ...playerIds.slice(1).map((id, i) => [id, shuffledNames[i]] as [string, string]),
    ]);

    const game = new TienLenGame(playerIds, playerNames, {
      instantWins: {
        dragon: false, fourTwos: false, sixPairs: false,
        fiveConsecutivePairs: false, threeConsecutiveTriples: false, twoPlusBombs: false,
      },
    }, true);

    game.start();

    set({
      game,
      clientState: game.getStateForPlayer('human'),
      selectedCardIds: new Set(),
      mode: 'singleplayer',
    });

    // If it's not the human's turn, trigger AI
    const state = get();
    if (state.game && !state.isMyTurn()) {
      setTimeout(() => processAITurns(get, set), 800);
    }
  },

  selectCard: (cardId) => {
    set(state => {
      const newSet = new Set(state.selectedCardIds);
      newSet.add(cardId);
      return { selectedCardIds: newSet };
    });
  },

  deselectCard: (cardId) => {
    set(state => {
      const newSet = new Set(state.selectedCardIds);
      newSet.delete(cardId);
      return { selectedCardIds: newSet };
    });
  },

  toggleCard: (cardId) => {
    const { selectedCardIds } = get();
    if (selectedCardIds.has(cardId)) {
      get().deselectCard(cardId);
    } else {
      get().selectCard(cardId);
    }
  },

  clearSelection: () => set({ selectedCardIds: new Set() }),

  playSelected: () => {
    const { game, selectedCardIds } = get();
    if (!game) return;

    const cardIds = [...selectedCardIds];
    if (cardIds.length === 0) return;

    try {
      game.playCards('human', cardIds);
      set({
        clientState: game.getStateForPlayer('human'),
        selectedCardIds: new Set(),
      });

      // Process AI turns after a delay
      if (game.getPhase() === 'playing') {
        setTimeout(() => processAITurns(get, set), 800);
      }
    } catch (e) {
      // Invalid play - don't clear selection
      console.warn('Invalid play:', e);
    }
  },

  pass: () => {
    const { game } = get();
    if (!game) return;

    try {
      game.pass('human');
      set({
        clientState: game.getStateForPlayer('human'),
        selectedCardIds: new Set(),
      });

      // Process AI turns
      if (game.getPhase() === 'playing') {
        setTimeout(() => processAITurns(get, set), 800);
      }
    } catch (e) {
      console.warn('Cannot pass:', e);
    }
  },

  sortMyHand: () => {
    // Hand is already sorted from the engine; this is a no-op for now
    // Could toggle sort order in future
  },

  getSelectedCombination: () => {
    const { clientState, selectedCardIds } = get();
    if (!clientState) return null;
    const cards = clientState.myHand.filter(c => selectedCardIds.has(c.id));
    if (cards.length === 0) return null;
    return detectCombination(cards);
  },

  canPlaySelection: () => {
    const { clientState, selectedCardIds } = get();
    if (!clientState || selectedCardIds.size === 0) return false;
    if (!get().isMyTurn()) return false;

    const cards = clientState.myHand.filter(c => selectedCardIds.has(c.id));
    const result = isValidPlay(cards, clientState.currentCombination);
    return result.valid;
  },

  canPass: () => {
    const { clientState } = get();
    if (!clientState) return false;
    if (!get().isMyTurn()) return false;
    // Can't pass when leading (no current combination)
    return clientState.currentCombination !== null;
  },

  isMyTurn: () => {
    const { clientState } = get();
    if (!clientState) return false;
    const currentPlayer = clientState.players[clientState.currentPlayerIndex];
    return currentPlayer?.id === 'human';
  },
}));

/** Process AI turns sequentially with delays */
function processAITurns(
  get: () => GameStore,
  set: (partial: Partial<GameStore>) => void,
) {
  const { game } = get();
  if (!game || game.getPhase() !== 'playing') return;

  const currentId = game.getCurrentPlayerId();
  if (currentId === 'human') {
    // Human's turn - stop processing
    set({ clientState: game.getStateForPlayer('human') });
    return;
  }

  // AI's turn
  const ai = new SimpleAI();
  const aiState = game.getStateForPlayer(currentId);

  const isFirstPlay = aiState.isFirstTurnOfGame;
  const play = ai.selectPlay(aiState.myHand, aiState.currentCombination, isFirstPlay);

  try {
    if (play === null) {
      if (aiState.currentCombination === null) {
        // Must play something when leading
        game.playCards(currentId, [aiState.myHand[0].id]);
      } else {
        game.pass(currentId);
      }
    } else {
      game.playCards(currentId, play);
    }
  } catch {
    // Fallback: pass or play lowest card
    try {
      if (aiState.currentCombination !== null) {
        game.pass(currentId);
      } else {
        game.playCards(currentId, [aiState.myHand[0].id]);
      }
    } catch {
      // Last resort
    }
  }

  // Update client state
  set({ clientState: game.getStateForPlayer('human') });

  // Continue processing if not human's turn and game not over
  if (game.getPhase() === 'playing' && game.getCurrentPlayerId() !== 'human') {
    const delay = 500 + Math.random() * 700;
    setTimeout(() => processAITurns(get, set), delay);
  }
}
