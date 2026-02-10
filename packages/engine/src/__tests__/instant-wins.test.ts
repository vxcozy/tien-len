import { describe, it, expect } from 'vitest';
import { checkInstantWin } from '../instant-wins';
import type { Card, GameSettings } from '@tienlen/shared';
import { DEFAULT_GAME_SETTINGS } from '@tienlen/shared';

function card(rank: string, suit: string): Card {
  const s: Record<string, string> = { spades: 's', clubs: 'c', diamonds: 'd', hearts: 'h' };
  return { rank: rank as Card['rank'], suit: suit as Card['suit'], id: `${rank}${s[suit]}` };
}

const allEnabled = DEFAULT_GAME_SETTINGS;
const allDisabled: GameSettings = {
  ...DEFAULT_GAME_SETTINGS,
  instantWins: {
    dragon: false,
    fourTwos: false,
    sixPairs: false,
    fiveConsecutivePairs: false,
    threeConsecutiveTriples: false,
    twoPlusBombs: false,
  },
};

describe('checkInstantWin', () => {
  describe('dragon', () => {
    it('detects a dragon (3 through A, 12 unique ranks)', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('4', 'clubs'), card('5', 'diamonds'),
        card('6', 'hearts'), card('7', 'spades'), card('8', 'clubs'),
        card('9', 'diamonds'), card('10', 'hearts'), card('J', 'spades'),
        card('Q', 'clubs'), card('K', 'diamonds'), card('A', 'hearts'),
        card('2', 'spades'),
      ];
      expect(checkInstantWin(hand, allEnabled)).toBe('dragon');
    });

    it('detects a dragon with duplicate rank (13th card can be anything)', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('4', 'clubs'), card('5', 'diamonds'),
        card('6', 'hearts'), card('7', 'spades'), card('8', 'clubs'),
        card('9', 'diamonds'), card('10', 'hearts'), card('J', 'spades'),
        card('Q', 'clubs'), card('K', 'diamonds'), card('A', 'hearts'),
        card('3', 'clubs'), // duplicate 3 instead of 2
      ];
      expect(checkInstantWin(hand, allEnabled)).toBe('dragon');
    });

    it('rejects non-dragon hand (missing a rank between 3-A)', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('3', 'clubs'), card('5', 'diamonds'),
        card('6', 'hearts'), card('7', 'spades'), card('8', 'clubs'),
        card('9', 'diamonds'), card('10', 'hearts'), card('J', 'spades'),
        card('Q', 'clubs'), card('K', 'diamonds'), card('A', 'hearts'),
        card('2', 'spades'),
      ];
      // Missing 4, has two 3s
      expect(checkInstantWin(hand, allEnabled)).not.toBe('dragon');
    });

    it('respects disabled setting', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('4', 'clubs'), card('5', 'diamonds'),
        card('6', 'hearts'), card('7', 'spades'), card('8', 'clubs'),
        card('9', 'diamonds'), card('10', 'hearts'), card('J', 'spades'),
        card('Q', 'clubs'), card('K', 'diamonds'), card('A', 'hearts'),
        card('2', 'spades'),
      ];
      expect(checkInstantWin(hand, allDisabled)).toBeNull();
    });
  });

  describe('four 2s', () => {
    it('detects four 2s in hand', () => {
      const hand: Card[] = [
        card('2', 'spades'), card('2', 'clubs'), card('2', 'diamonds'), card('2', 'hearts'),
        card('3', 'spades'), card('4', 'clubs'), card('5', 'diamonds'),
        card('6', 'hearts'), card('7', 'spades'), card('8', 'clubs'),
        card('9', 'diamonds'), card('10', 'hearts'), card('J', 'spades'),
      ];
      // Dragon takes priority, but this hand is missing Q, K, A so not a dragon
      expect(checkInstantWin(hand, { ...allEnabled, instantWins: { ...allEnabled.instantWins, dragon: false } })).toBe('fourTwos');
    });
  });

  describe('six pairs', () => {
    it('detects six pairs', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
        card('6', 'spades'), card('6', 'clubs'),
        card('7', 'spades'), card('7', 'clubs'),
        card('8', 'spades'), card('8', 'clubs'),
        card('9', 'hearts'),
      ];
      expect(checkInstantWin(hand, { ...allEnabled, instantWins: { ...allEnabled.instantWins, dragon: false, fourTwos: false } })).toBe('sixPairs');
    });

    it('rejects five non-consecutive pairs', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('3', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
        card('7', 'spades'), card('7', 'clubs'),
        card('9', 'spades'), card('9', 'clubs'),
        card('J', 'spades'), card('J', 'clubs'),
        card('K', 'spades'), card('A', 'clubs'),
        card('10', 'hearts'),
      ];
      expect(checkInstantWin(hand, allEnabled)).toBeNull();
    });
  });

  describe('five consecutive pairs', () => {
    it('detects five consecutive pairs', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
        card('6', 'spades'), card('6', 'clubs'),
        card('7', 'spades'), card('7', 'clubs'),
        card('8', 'hearts'), card('9', 'hearts'), card('10', 'hearts'),
      ];
      const settings: GameSettings = {
        ...allEnabled,
        instantWins: { ...allEnabled.instantWins, dragon: false, fourTwos: false, sixPairs: false },
      };
      expect(checkInstantWin(hand, settings)).toBe('fiveConsecutivePairs');
    });

    it('rejects four consecutive pairs (need 5)', () => {
      const hand: Card[] = [
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
        card('6', 'spades'), card('6', 'clubs'),
        card('8', 'hearts'), card('9', 'hearts'), card('10', 'hearts'),
        card('J', 'hearts'), card('Q', 'hearts'),
      ];
      const settings: GameSettings = {
        ...allEnabled,
        instantWins: { ...allEnabled.instantWins, dragon: false, fourTwos: false, sixPairs: false },
      };
      expect(checkInstantWin(hand, settings)).not.toBe('fiveConsecutivePairs');
    });
  });

  describe('three consecutive triples', () => {
    it('detects three consecutive triples', () => {
      const hand: Card[] = [
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'),
        card('6', 'spades'), card('6', 'clubs'), card('6', 'diamonds'),
        card('7', 'spades'), card('7', 'clubs'), card('7', 'diamonds'),
        card('8', 'hearts'), card('9', 'hearts'), card('10', 'hearts'), card('J', 'hearts'),
      ];
      const settings: GameSettings = {
        ...allEnabled,
        instantWins: {
          ...allEnabled.instantWins,
          dragon: false, fourTwos: false, sixPairs: false, fiveConsecutivePairs: false,
        },
      };
      expect(checkInstantWin(hand, settings)).toBe('threeConsecutiveTriples');
    });

    it('rejects two consecutive triples', () => {
      const hand: Card[] = [
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'),
        card('6', 'spades'), card('6', 'clubs'), card('6', 'diamonds'),
        card('8', 'spades'), card('9', 'clubs'), card('10', 'diamonds'),
        card('J', 'hearts'), card('Q', 'hearts'), card('K', 'hearts'), card('A', 'hearts'),
      ];
      const settings: GameSettings = {
        ...allEnabled,
        instantWins: {
          ...allEnabled.instantWins,
          dragon: false, fourTwos: false, sixPairs: false, fiveConsecutivePairs: false,
        },
      };
      expect(checkInstantWin(hand, settings)).not.toBe('threeConsecutiveTriples');
    });
  });

  describe('two or more bombs', () => {
    it('detects two quads as two bombs', () => {
      const hand: Card[] = [
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
        card('8', 'spades'), card('8', 'clubs'), card('8', 'diamonds'), card('8', 'hearts'),
        card('3', 'hearts'), card('4', 'hearts'), card('9', 'hearts'), card('10', 'hearts'), card('J', 'hearts'),
      ];
      const settings: GameSettings = {
        ...allEnabled,
        instantWins: {
          ...allEnabled.instantWins,
          dragon: false, fourTwos: false, sixPairs: false,
          fiveConsecutivePairs: false, threeConsecutiveTriples: false,
        },
      };
      expect(checkInstantWin(hand, settings)).toBe('twoPlusBombs');
    });

    it('detects one quad + one 3-pair run as two bombs', () => {
      const hand: Card[] = [
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
        card('8', 'spades'), card('8', 'clubs'),
        card('9', 'spades'), card('9', 'clubs'),
        card('10', 'spades'), card('10', 'clubs'),
        card('3', 'hearts'), card('4', 'hearts'), card('J', 'hearts'),
      ];
      const settings: GameSettings = {
        ...allEnabled,
        instantWins: {
          ...allEnabled.instantWins,
          dragon: false, fourTwos: false, sixPairs: false,
          fiveConsecutivePairs: false, threeConsecutiveTriples: false,
        },
      };
      expect(checkInstantWin(hand, settings)).toBe('twoPlusBombs');
    });

    it('rejects single bomb', () => {
      const hand: Card[] = [
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
        card('3', 'hearts'), card('4', 'hearts'), card('6', 'hearts'),
        card('7', 'hearts'), card('8', 'hearts'), card('9', 'hearts'),
        card('10', 'hearts'), card('J', 'hearts'), card('Q', 'hearts'),
      ];
      const settings: GameSettings = {
        ...allEnabled,
        instantWins: {
          ...allEnabled.instantWins,
          dragon: false, fourTwos: false, sixPairs: false,
          fiveConsecutivePairs: false, threeConsecutiveTriples: false,
        },
      };
      expect(checkInstantWin(hand, settings)).not.toBe('twoPlusBombs');
    });
  });
});
