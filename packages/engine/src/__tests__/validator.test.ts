import { describe, it, expect } from 'vitest';
import { canBeat, isValidPlay, isValidFirstPlay } from '../validator';
import { detectCombination } from '../combination';
import type { Card, Combination } from '@tienlen/shared';

function card(rank: string, suit: string): Card {
  const s: Record<string, string> = { spades: 's', clubs: 'c', diamonds: 'd', hearts: 'h' };
  return { rank: rank as Card['rank'], suit: suit as Card['suit'], id: `${rank}${s[suit]}` };
}

function combo(cards: Card[]): Combination {
  return detectCombination(cards)!;
}

describe('canBeat', () => {
  describe('leading (empty table)', () => {
    it('any non-bomb combination beats empty table', () => {
      expect(canBeat(combo([card('3', 'spades')]), null)).toBe(true);
      expect(canBeat(combo([card('5', 'hearts'), card('5', 'spades')]), null)).toBe(true);
    });

    it('bombs cannot lead', () => {
      const threePairBomb = combo([
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
      ]);
      expect(canBeat(threePairBomb, null)).toBe(false);

      const fourPairBomb = combo([
        card('6', 'spades'), card('6', 'clubs'),
        card('7', 'spades'), card('7', 'clubs'),
        card('8', 'spades'), card('8', 'clubs'),
        card('9', 'spades'), card('9', 'clubs'),
      ]);
      expect(canBeat(fourPairBomb, null)).toBe(false);
    });
  });

  describe('singles', () => {
    it('higher rank beats lower rank', () => {
      const on = combo([card('5', 'hearts')]);
      const played = combo([card('6', 'spades')]);
      expect(canBeat(played, on)).toBe(true);
    });

    it('same rank, higher suit beats', () => {
      const on = combo([card('5', 'spades')]);
      const played = combo([card('5', 'hearts')]);
      expect(canBeat(played, on)).toBe(true);
    });

    it('lower rank does not beat', () => {
      const on = combo([card('8', 'spades')]);
      const played = combo([card('5', 'hearts')]);
      expect(canBeat(played, on)).toBe(false);
    });

    it('2 beats all non-2 singles', () => {
      const on = combo([card('A', 'hearts')]);
      const played = combo([card('2', 'spades')]);
      expect(canBeat(played, on)).toBe(true);
    });
  });

  describe('pairs', () => {
    it('higher pair beats lower pair', () => {
      const on = combo([card('7', 'spades'), card('7', 'clubs')]);
      const played = combo([card('9', 'spades'), card('9', 'clubs')]);
      expect(canBeat(played, on)).toBe(true);
    });

    it('pair cannot beat a single', () => {
      const on = combo([card('5', 'hearts')]);
      const played = combo([card('3', 'spades'), card('3', 'clubs')]);
      expect(canBeat(played, on)).toBe(false);
    });
  });

  describe('sequences', () => {
    it('higher sequence of same length beats', () => {
      const on = combo([card('3', 'spades'), card('4', 'clubs'), card('5', 'hearts')]);
      const played = combo([card('6', 'spades'), card('7', 'clubs'), card('8', 'hearts')]);
      expect(canBeat(played, on)).toBe(true);
    });

    it('different length sequence does not beat', () => {
      const on = combo([card('3', 'spades'), card('4', 'clubs'), card('5', 'hearts')]);
      const played = combo([
        card('6', 'spades'), card('7', 'clubs'), card('8', 'hearts'), card('9', 'diamonds'),
      ]);
      expect(canBeat(played, on)).toBe(false);
    });
  });

  describe('bombs', () => {
    it('quad beats a single 2', () => {
      const on = combo([card('2', 'hearts')]);
      const played = combo([
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
      ]);
      expect(canBeat(played, on)).toBe(true);
    });

    it('quad does NOT beat a pair of 2s', () => {
      const on = combo([card('2', 'spades'), card('2', 'hearts')]);
      const played = combo([
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
      ]);
      expect(canBeat(played, on)).toBe(false);
    });

    it('3-pair bomb beats a single 2', () => {
      const on = combo([card('2', 'hearts')]);
      const played = combo([
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
      ]);
      expect(canBeat(played, on)).toBe(true);
    });

    it('4-pair bomb beats a pair of 2s', () => {
      const on = combo([card('2', 'spades'), card('2', 'hearts')]);
      const played = combo([
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
        card('6', 'spades'), card('6', 'clubs'),
      ]);
      expect(canBeat(played, on)).toBe(true);
    });

    it('3-pair bomb does NOT beat a pair of 2s', () => {
      const on = combo([card('2', 'spades'), card('2', 'hearts')]);
      const played = combo([
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
      ]);
      expect(canBeat(played, on)).toBe(false);
    });

    it('quad does NOT beat a non-2 single', () => {
      const on = combo([card('A', 'hearts')]);
      const played = combo([
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
      ]);
      expect(canBeat(played, on)).toBe(false);
    });

    it('quad does NOT beat a non-2 pair', () => {
      const on = combo([card('A', 'hearts'), card('A', 'spades')]);
      const played = combo([
        card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
      ]);
      expect(canBeat(played, on)).toBe(false);
    });

    describe('bomb vs bomb (same type)', () => {
      it('higher quad beats lower quad', () => {
        const on = combo([
          card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
        ]);
        const played = combo([
          card('8', 'spades'), card('8', 'clubs'), card('8', 'diamonds'), card('8', 'hearts'),
        ]);
        expect(canBeat(played, on)).toBe(true);
      });

      it('lower quad does not beat higher quad', () => {
        const on = combo([
          card('8', 'spades'), card('8', 'clubs'), card('8', 'diamonds'), card('8', 'hearts'),
        ]);
        const played = combo([
          card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('5', 'hearts'),
        ]);
        expect(canBeat(played, on)).toBe(false);
      });

      it('higher 3-pair bomb beats lower 3-pair bomb', () => {
        const on = combo([
          card('3', 'spades'), card('3', 'clubs'),
          card('4', 'spades'), card('4', 'clubs'),
          card('5', 'spades'), card('5', 'clubs'),
        ]);
        const played = combo([
          card('7', 'spades'), card('7', 'clubs'),
          card('8', 'spades'), card('8', 'clubs'),
          card('9', 'spades'), card('9', 'clubs'),
        ]);
        expect(canBeat(played, on)).toBe(true);
      });

      it('higher 4-pair bomb beats lower 4-pair bomb', () => {
        const on = combo([
          card('3', 'spades'), card('3', 'clubs'),
          card('4', 'spades'), card('4', 'clubs'),
          card('5', 'spades'), card('5', 'clubs'),
          card('6', 'spades'), card('6', 'clubs'),
        ]);
        const played = combo([
          card('7', 'spades'), card('7', 'clubs'),
          card('8', 'spades'), card('8', 'clubs'),
          card('9', 'spades'), card('9', 'clubs'),
          card('10', 'spades'), card('10', 'clubs'),
        ]);
        expect(canBeat(played, on)).toBe(true);
      });
    });
  });
});

describe('isValidPlay', () => {
  it('valid single against empty table', () => {
    const result = isValidPlay([card('3', 'spades')], null);
    expect(result.valid).toBe(true);
  });

  it('invalid combination rejected', () => {
    const result = isValidPlay([card('3', 'spades'), card('5', 'hearts')], null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid');
  });
});

describe('isValidFirstPlay', () => {
  it('requires 3 of spades in first game', () => {
    expect(isValidFirstPlay([card('3', 'spades')], true)).toBe(true);
    expect(isValidFirstPlay([card('3', 'hearts')], true)).toBe(false);
    expect(isValidFirstPlay([card('5', 'spades')], true)).toBe(false);
  });

  it('no requirement in subsequent games', () => {
    expect(isValidFirstPlay([card('5', 'hearts')], false)).toBe(true);
  });

  it('3 of spades in a sequence is valid', () => {
    expect(isValidFirstPlay(
      [card('3', 'spades'), card('4', 'clubs'), card('5', 'hearts')],
      true,
    )).toBe(true);
  });
});
