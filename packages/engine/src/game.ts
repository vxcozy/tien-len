import type {
  Card,
  GamePhase,
  GameEvent,
  GameSettings,
  ClientGameState,
  InternalGameState,
  PlayerState,
  TurnHistoryEntry,
  Combination,
  InstantWinType,
} from '@tienlen/shared';
import { DEFAULT_GAME_SETTINGS } from '@tienlen/shared';
import { createDeck, shuffle, deal } from './deck';
import { sortHand, findCardsInHand, removeCardsFromHand, findThreeOfSpades } from './card-utils';
import { detectCombination } from './combination';
import { canBeat, isValidFirstPlay } from './validator';
import { checkInstantWin } from './instant-wins';

export class TienLenGame {
  private state: InternalGameState;

  constructor(
    playerIds: string[],
    playerNames: Map<string, string>,
    settings: Partial<GameSettings> = {},
    isFirstGame = true,
  ) {
    const mergedSettings: GameSettings = { ...DEFAULT_GAME_SETTINGS, ...settings };

    this.state = {
      phase: 'waiting',
      playerIds: [...playerIds],
      playerNames: new Map(playerNames),
      hands: new Map(),
      currentPlayerIndex: 0,
      currentCombination: null,
      lastPlayedBy: null,
      passedPlayerIds: new Set(),
      isFirstGame,
      isFirstTurnOfGame: true,
      turnHistory: [],
      finishOrder: [],
      activePlayers: [...playerIds],
      settings: mergedSettings,
      cardsPlayedByPlayer: new Map(),
      lockedPlayerIds: new Set(),
    };

    // Initialize cards-played counters
    for (const id of playerIds) {
      this.state.cardsPlayedByPlayer.set(id, 0);
    }
  }

  /** Start the game: shuffle, deal, check instant wins, determine first player */
  start(): GameEvent[] {
    const events: GameEvent[] = [];
    const deck = shuffle(createDeck());
    const { hands } = deal(deck, this.state.playerIds.length);

    // Assign and sort hands
    for (let i = 0; i < this.state.playerIds.length; i++) {
      this.state.hands.set(this.state.playerIds[i], sortHand(hands[i]));
    }

    this.state.phase = 'dealing';
    events.push({ type: 'cards_dealt' });

    // Check instant wins
    for (const playerId of this.state.playerIds) {
      const hand = this.state.hands.get(playerId)!;
      const instantWin = checkInstantWin(hand, this.state.settings);
      if (instantWin) {
        events.push({
          type: 'instant_win',
          playerId,
          data: { winType: instantWin, cards: hand },
        });
        // Instant win: this player wins immediately
        this.state.finishOrder.push(playerId);
        this.state.hands.set(playerId, []);
        this.state.activePlayers = this.state.activePlayers.filter(id => id !== playerId);

        if (this.state.activePlayers.length <= 1) {
          // If only 0-1 players remain, game is over
          for (const remaining of this.state.activePlayers) {
            this.state.finishOrder.push(remaining);
          }
          this.state.phase = 'gameEnd';
          events.push({ type: 'game_over', data: { finishOrder: this.state.finishOrder } });
          return events;
        }
      }
    }

    // Determine first player
    if (this.state.isFirstGame) {
      const threeOfSpadesHolder = findThreeOfSpades(
        this.state.playerIds.map(id => this.state.hands.get(id)!),
      );
      if (threeOfSpadesHolder >= 0) {
        this.state.currentPlayerIndex = threeOfSpadesHolder;
        this.state.isFirstTurnOfGame = true;
      } else {
        // With fewer than 4 players, 3♠ might not be dealt to anyone
        // Pick a random starting player and skip 3♠ requirement
        this.state.currentPlayerIndex = Math.floor(Math.random() * this.state.activePlayers.length);
        this.state.isFirstTurnOfGame = false;
      }
    } else {
      // Winner of previous game leads (caller should set this via constructor)
      this.state.currentPlayerIndex = 0;
      this.state.isFirstTurnOfGame = false;
    }

    this.state.phase = 'playing';

    events.push({
      type: 'game_started',
      data: { firstPlayerId: this.getCurrentPlayerId() },
    });

    events.push({
      type: 'turn_changed',
      playerId: this.getCurrentPlayerId(),
    });

    return events;
  }

  /** Play cards from the current player's hand */
  playCards(playerId: string, cardIds: string[]): GameEvent[] {
    const events: GameEvent[] = [];

    // Validate it's this player's turn
    if (playerId !== this.getCurrentPlayerId()) {
      throw new Error('Not your turn');
    }

    if (this.state.phase !== 'playing') {
      throw new Error('Game is not in playing phase');
    }

    // Validate cards exist in hand
    const hand = this.state.hands.get(playerId);
    if (!hand) throw new Error('Player not found');

    const cards = findCardsInHand(hand, cardIds);
    if (!cards) throw new Error('Cards not found in hand');

    // Detect combination
    const combination = detectCombination(cards);
    if (!combination) throw new Error('Invalid card combination');

    // Validate first play of first game includes 3 of spades
    if (this.state.isFirstTurnOfGame && !isValidFirstPlay(cards, this.state.isFirstGame)) {
      throw new Error('First play of the game must include the 3 of Spades');
    }

    // Validate it beats the current combination
    if (!canBeat(combination, this.state.currentCombination)) {
      throw new Error('This combination does not beat the current play');
    }

    // Execute the play
    const newHand = removeCardsFromHand(hand, cardIds);
    this.state.hands.set(playerId, newHand);
    this.state.currentCombination = combination;
    this.state.lastPlayedBy = playerId;
    // NOTE: Do NOT clear passedPlayerIds here - passing locks you out of the round
    this.state.isFirstTurnOfGame = false;

    // Track cards played by this player
    const prevCount = this.state.cardsPlayedByPlayer.get(playerId) ?? 0;
    this.state.cardsPlayedByPlayer.set(playerId, prevCount + cards.length);

    const historyEntry: TurnHistoryEntry = {
      playerId,
      playerName: this.state.playerNames.get(playerId) ?? playerId,
      action: 'play',
      combination,
      timestamp: Date.now(),
    };
    this.state.turnHistory.push(historyEntry);

    events.push({
      type: 'cards_played',
      playerId,
      data: { cards, combination, handSize: newHand.length },
    });

    // Check if player finished
    if (newHand.length === 0) {
      this.state.finishOrder.push(playerId);
      this.state.activePlayers = this.state.activePlayers.filter(id => id !== playerId);

      // Check for locked players: any active player who has played 0 cards
      this.detectLockedPlayers();

      events.push({
        type: 'player_finished',
        playerId,
        data: { position: this.state.finishOrder.length },
      });

      // Check if game is over (1 or fewer active players)
      if (this.state.activePlayers.length <= 1) {
        for (const remaining of this.state.activePlayers) {
          this.state.finishOrder.push(remaining);
        }
        this.state.phase = 'gameEnd';
        events.push({ type: 'game_over', data: { finishOrder: [...this.state.finishOrder] } });
        return events;
      }
    }

    // Advance to next player
    this.advanceToNextPlayer();
    this.checkRoundEnd(events);

    events.push({
      type: 'turn_changed',
      playerId: this.getCurrentPlayerId(),
    });

    return events;
  }

  /** Current player passes */
  pass(playerId: string): GameEvent[] {
    const events: GameEvent[] = [];

    if (playerId !== this.getCurrentPlayerId()) {
      throw new Error('Not your turn');
    }

    if (this.state.phase !== 'playing') {
      throw new Error('Game is not in playing phase');
    }

    // Cannot pass if you're leading (no combination on table)
    if (this.state.currentCombination === null) {
      throw new Error('Cannot pass when leading');
    }

    this.state.passedPlayerIds.add(playerId);

    const historyEntry: TurnHistoryEntry = {
      playerId,
      playerName: this.state.playerNames.get(playerId) ?? playerId,
      action: 'pass',
      timestamp: Date.now(),
    };
    this.state.turnHistory.push(historyEntry);

    events.push({ type: 'player_passed', playerId });

    // Advance to next player
    this.advanceToNextPlayer();
    this.checkRoundEnd(events);

    events.push({
      type: 'turn_changed',
      playerId: this.getCurrentPlayerId(),
    });

    return events;
  }

  /** Get game state redacted for a specific player */
  getStateForPlayer(playerId: string): ClientGameState {
    const players: PlayerState[] = this.state.playerIds.map(id => ({
      id,
      name: this.state.playerNames.get(id) ?? id,
      handSize: this.state.hands.get(id)?.length ?? 0,
      isActive: this.state.activePlayers.includes(id),
      hasPassed: this.state.passedPlayerIds.has(id),
      finishPosition: this.getFinishPosition(id),
      isLocked: this.state.lockedPlayerIds.has(id),
    }));

    return {
      phase: this.state.phase,
      players,
      myHand: sortHand(this.state.hands.get(playerId) ?? []),
      myPlayerId: playerId,
      currentPlayerIndex: this.state.currentPlayerIndex,
      currentCombination: this.state.currentCombination,
      lastPlayedBy: this.state.lastPlayedBy,
      passedPlayerIds: [...this.state.passedPlayerIds],
      isFirstGame: this.state.isFirstGame,
      isFirstTurnOfGame: this.state.isFirstTurnOfGame,
      turnHistory: this.state.turnHistory.slice(-20), // Last 20 entries
      finishOrder: [...this.state.finishOrder],
      settings: this.state.settings,
      lockedPlayerIds: [...this.state.lockedPlayerIds],
    };
  }

  /** Get full internal state (server-only) */
  getFullState(): InternalGameState {
    return this.state;
  }

  /** Get the current player's ID */
  getCurrentPlayerId(): string {
    return this.state.activePlayers[this.state.currentPlayerIndex % this.state.activePlayers.length];
  }

  /** Get the game phase */
  getPhase(): GamePhase {
    return this.state.phase;
  }

  /** Get finish order */
  getFinishOrder(): string[] {
    return [...this.state.finishOrder];
  }

  /** Get active player IDs */
  getActivePlayers(): string[] {
    return [...this.state.activePlayers];
  }

  /** Check if it's a specific player's turn */
  isPlayerTurn(playerId: string): boolean {
    return this.getCurrentPlayerId() === playerId;
  }

  /** Check if the current player must play (leading the round) */
  isLeading(): boolean {
    return this.state.currentCombination === null;
  }

  // --- Private methods ---

  private advanceToNextPlayer(): void {
    if (this.state.activePlayers.length === 0) return;

    let next = (this.state.currentPlayerIndex + 1) % this.state.activePlayers.length;
    let attempts = 0;

    // Skip passed players
    while (
      this.state.passedPlayerIds.has(this.state.activePlayers[next]) &&
      attempts < this.state.activePlayers.length
    ) {
      next = (next + 1) % this.state.activePlayers.length;
      attempts++;
    }

    this.state.currentPlayerIndex = next;
  }

  private checkRoundEnd(events: GameEvent[]): void {
    // Round ends when all active players except the last to play have passed
    const activeNotPassed = this.state.activePlayers.filter(
      id => !this.state.passedPlayerIds.has(id),
    );

    if (activeNotPassed.length <= 1 && this.state.lastPlayedBy !== null) {
      // Round won by last player who played
      events.push({
        type: 'round_won',
        playerId: this.state.lastPlayedBy,
      });

      // Reset for new round
      this.state.currentCombination = null;
      this.state.passedPlayerIds.clear();
      this.state.lastPlayedBy = null;

      // The winner of the round leads next
      const winnerIndex = this.state.activePlayers.indexOf(activeNotPassed[0] ?? this.state.activePlayers[0]);
      if (winnerIndex >= 0) {
        this.state.currentPlayerIndex = winnerIndex;
      }
    }
  }

  /** Detect players who are "locked" - haven't played any cards when someone finishes */
  private detectLockedPlayers(): void {
    for (const id of this.state.activePlayers) {
      const cardsPlayed = this.state.cardsPlayedByPlayer.get(id) ?? 0;
      if (cardsPlayed === 0) {
        this.state.lockedPlayerIds.add(id);
      }
    }
  }

  private getFinishPosition(playerId: string): number | null {
    const index = this.state.finishOrder.indexOf(playerId);
    return index >= 0 ? index + 1 : null;
  }
}
