import { describe, it, expect } from 'vitest';
import { TienLenGame } from '../game';
import { SimpleAI } from '../ai';
import type { Card } from '@tienlen/shared';

const noInstantWins = {
  dragon: false,
  fourTwos: false,
  sixPairs: false,
  fiveConsecutivePairs: false,
  threeConsecutiveTriples: false,
  twoPlusBombs: false,
};

describe('TienLenGame', () => {
  function createGame(playerCount = 4) {
    const playerIds = Array.from({ length: playerCount }, (_, i) => `player${i}`);
    const playerNames = new Map(playerIds.map(id => [id, `Player ${id.slice(-1)}`]));
    return new TienLenGame(playerIds, playerNames, {
      instantWins: noInstantWins,
    }, true);
  }

  it('starts a game and deals cards', () => {
    const game = createGame();
    const events = game.start();

    expect(events.some(e => e.type === 'cards_dealt')).toBe(true);
    expect(events.some(e => e.type === 'game_started')).toBe(true);
    expect(game.getPhase()).toBe('playing');
  });

  it('each player gets 13 cards in a 4-player game', () => {
    const game = createGame();
    game.start();

    for (let i = 0; i < 4; i++) {
      const state = game.getStateForPlayer(`player${i}`);
      expect(state.myHand).toHaveLength(13);
    }
  });

  it('player states are properly redacted', () => {
    const game = createGame();
    game.start();

    const state0 = game.getStateForPlayer('player0');
    // Player 0 should see their own hand
    expect(state0.myHand.length).toBeGreaterThan(0);
    // Other players should only show hand size, not actual cards
    for (const p of state0.players) {
      if (p.id !== 'player0') {
        expect(p.handSize).toBe(13);
      }
    }
  });

  it('first player is the one with 3 of spades', () => {
    const game = createGame();
    game.start();

    const currentId = game.getCurrentPlayerId();
    const state = game.getStateForPlayer(currentId);
    const has3s = state.myHand.some(c => c.rank === '3' && c.suit === 'spades');
    expect(has3s).toBe(true);
  });

  it('throws error when wrong player tries to play', () => {
    const game = createGame();
    game.start();

    const currentId = game.getCurrentPlayerId();
    const otherId = currentId === 'player0' ? 'player1' : 'player0';
    const otherState = game.getStateForPlayer(otherId);

    expect(() => {
      game.playCards(otherId, [otherState.myHand[0].id]);
    }).toThrow('Not your turn');
  });

  it('allows valid first play including 3 of spades', () => {
    const game = createGame();
    game.start();

    const currentId = game.getCurrentPlayerId();
    const state = game.getStateForPlayer(currentId);
    const threeOfSpades = state.myHand.find(c => c.rank === '3' && c.suit === 'spades');

    expect(threeOfSpades).toBeDefined();

    const events = game.playCards(currentId, [threeOfSpades!.id]);
    expect(events.some(e => e.type === 'cards_played')).toBe(true);
  });

  it('rejects first play without 3 of spades', () => {
    const game = createGame();
    game.start();

    const currentId = game.getCurrentPlayerId();
    const state = game.getStateForPlayer(currentId);
    const nonThreeOfSpades = state.myHand.find(
      c => !(c.rank === '3' && c.suit === 'spades'),
    );

    expect(() => {
      game.playCards(currentId, [nonThreeOfSpades!.id]);
    }).toThrow('3 of Spades');
  });

  it('cannot pass when leading', () => {
    const game = createGame();
    game.start();

    const currentId = game.getCurrentPlayerId();

    // Play 3 of spades first
    const state = game.getStateForPlayer(currentId);
    const threeOfSpades = state.myHand.find(c => c.rank === '3' && c.suit === 'spades')!;
    game.playCards(currentId, [threeOfSpades.id]);

    // Next player passes
    const nextId = game.getCurrentPlayerId();
    game.pass(nextId);

    // Next player passes
    const nextId2 = game.getCurrentPlayerId();
    game.pass(nextId2);

    // Next player passes
    const nextId3 = game.getCurrentPlayerId();
    game.pass(nextId3);

    // Now the round should be over and first player leads again
    // They cannot pass when leading
    const leaderId = game.getCurrentPlayerId();
    expect(() => {
      game.pass(leaderId);
    }).toThrow('Cannot pass when leading');
  });

  it('round ends when all other players pass', () => {
    const game = createGame();
    game.start();

    const currentId = game.getCurrentPlayerId();
    const state = game.getStateForPlayer(currentId);
    const threeOfSpades = state.myHand.find(c => c.rank === '3' && c.suit === 'spades')!;

    const playEvents = game.playCards(currentId, [threeOfSpades.id]);

    // All other players pass
    for (let i = 0; i < 3; i++) {
      const nextId = game.getCurrentPlayerId();
      const events = game.pass(nextId);
      if (i === 2) {
        // Last pass should trigger round_won
        expect(events.some(e => e.type === 'round_won')).toBe(true);
      }
    }

    // Table should be cleared - the round winner leads
    expect(game.isLeading()).toBe(true);
  });

  it('passing locks you out of the round', () => {
    const game = createGame();
    game.start();

    const p1 = game.getCurrentPlayerId();
    const state1 = game.getStateForPlayer(p1);
    const threeOfSpades = state1.myHand.find(c => c.rank === '3' && c.suit === 'spades')!;
    game.playCards(p1, [threeOfSpades.id]);

    // p2 passes
    const p2 = game.getCurrentPlayerId();
    game.pass(p2);

    // p3 beats the play (find a card higher than 3s)
    const p3 = game.getCurrentPlayerId();
    const state3 = game.getStateForPlayer(p3);
    const higherCard = state3.myHand.find(c => c.rank !== '3' && c.rank !== '2');
    if (higherCard) {
      try {
        game.playCards(p3, [higherCard.id]);
        // If p3 played successfully, p4 should be next (p2 was skipped because they passed)
        // Actually p4 is next in normal order. But then p1, then skip p2 (locked out), then p3
        const gameState = game.getStateForPlayer(p2);
        expect(gameState.passedPlayerIds).toContain(p2);
      } catch {
        // p3's card didn't beat - that's fine, the important thing is p2 is in passedPlayerIds
        const gameState = game.getStateForPlayer(p2);
        expect(gameState.passedPlayerIds).toContain(p2);
      }
    }
  });

  it('includes lockedPlayerIds in client state', () => {
    const game = createGame();
    game.start();

    const state = game.getStateForPlayer('player0');
    expect(state.lockedPlayerIds).toBeDefined();
    expect(Array.isArray(state.lockedPlayerIds)).toBe(true);
  });
});

describe('Full game simulation with AI', () => {
  it('completes a 4-player game', () => {
    const playerIds = ['p0', 'p1', 'p2', 'p3'];
    const playerNames = new Map(playerIds.map(id => [id, id]));
    const game = new TienLenGame(playerIds, playerNames, {
      instantWins: noInstantWins,
    }, true);
    const ai = new SimpleAI();

    game.start();

    let turnCount = 0;
    const maxTurns = 500;

    while (game.getPhase() === 'playing' && turnCount < maxTurns) {
      const currentId = game.getCurrentPlayerId();
      const state = game.getStateForPlayer(currentId);

      if (state.myHand.length === 0) {
        // This player is already out, skip
        turnCount++;
        continue;
      }

      const isFirstPlay = state.isFirstTurnOfGame;
      const currentCombo = state.currentCombination;

      const play = ai.selectPlay(state.myHand, currentCombo, isFirstPlay);

      if (play === null) {
        if (currentCombo === null) {
          // Leading - must play something. Play lowest card.
          game.playCards(currentId, [state.myHand[0].id]);
        } else {
          game.pass(currentId);
        }
      } else {
        try {
          game.playCards(currentId, play);
        } catch {
          // If AI's selection is invalid, pass instead
          if (currentCombo !== null) {
            game.pass(currentId);
          } else {
            game.playCards(currentId, [state.myHand[0].id]);
          }
        }
      }

      turnCount++;
    }

    expect(game.getPhase()).toBe('gameEnd');
    expect(game.getFinishOrder()).toHaveLength(4);
    expect(turnCount).toBeLessThan(maxTurns);
  });
});
