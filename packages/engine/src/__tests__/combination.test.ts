import { describe, it, expect } from 'vitest';
import { detectCombination } from '../combination';
import type { Card } from '@tienlen/shared';

function card(rank: string, suit: string): Card {
  const suitShort: Record<string, string> = { spades: 's', clubs: 'c', diamonds: 'd', hearts: 'h' };
  return { rank: rank as Card['rank'], suit: suit as Card['suit'], id: `${rank}${suitShort[suit]}` };
}

describe('detectCombination', () => {
  it('returns null for empty array', () => {
    expect(detectCombination([])).toBeNull();
  });

  describe('singles', () => {
    it('detects a single', () => {
      const combo = detectCombination([card('5', 'hearts')]);
      expect(combo).not.toBeNull();
      expect(combo!.type).toBe('single');
      expect(combo!.highCard.rank).toBe('5');
    });

    it('detects 2 of hearts as highest single', () => {
      const combo = detectCombination([card('2', 'hearts')]);
      expect(combo!.type).toBe('single');
      expect(combo!.highCard.rank).toBe('2');
      expect(combo!.highCard.suit).toBe('hearts');
    });
  });

  describe('pairs', () => {
    it('detects a pair', () => {
      const combo = detectCombination([card('7', 'spades'), card('7', 'hearts')]);
      expect(combo).not.toBeNull();
      expect(combo!.type).toBe('pair');
      expect(combo!.highCard.suit).toBe('hearts');
    });

    it('rejects two different ranks', () => {
      const combo = detectCombination([card('7', 'spades'), card('8', 'hearts')]);
      expect(combo).toBeNull();
    });
  });

  describe('triples', () => {
    it('detects a triple', () => {
      const combo = detectCombination([
        card('K', 'spades'), card('K', 'clubs'), card('K', 'hearts'),
      ]);
      expect(combo!.type).toBe('triple');
    });
  });

  describe('quads', () => {
    it('detects a quad', () => {
      const combo = detectCombination([
        card('A', 'spades'), card('A', 'clubs'), card('A', 'diamonds'), card('A', 'hearts'),
      ]);
      expect(combo!.type).toBe('quad');
    });
  });

  describe('sequences', () => {
    it('detects a 3-card sequence', () => {
      const combo = detectCombination([
        card('3', 'spades'), card('4', 'clubs'), card('5', 'hearts'),
      ]);
      expect(combo!.type).toBe('sequence');
      expect(combo!.length).toBe(3);
      expect(combo!.highCard.rank).toBe('5');
    });

    it('detects a 5-card sequence', () => {
      const combo = detectCombination([
        card('8', 'spades'), card('9', 'clubs'), card('10', 'diamonds'),
        card('J', 'hearts'), card('Q', 'spades'),
      ]);
      expect(combo!.type).toBe('sequence');
      expect(combo!.length).toBe(5);
    });

    it('detects highest possible sequence (Q-K-A)', () => {
      const combo = detectCombination([
        card('Q', 'spades'), card('K', 'clubs'), card('A', 'hearts'),
      ]);
      expect(combo!.type).toBe('sequence');
      expect(combo!.highCard.rank).toBe('A');
    });

    it('rejects sequence containing 2', () => {
      const combo = detectCombination([
        card('Q', 'spades'), card('K', 'clubs'), card('A', 'hearts'), card('2', 'diamonds'),
      ]);
      expect(combo).toBeNull();
    });

    it('rejects non-consecutive cards', () => {
      const combo = detectCombination([
        card('3', 'spades'), card('5', 'clubs'), card('7', 'hearts'),
      ]);
      expect(combo).toBeNull();
    });

    it('rejects 2-card sequence (too short)', () => {
      const combo = detectCombination([
        card('3', 'spades'), card('4', 'clubs'),
      ]);
      // Should be null because 2 cards of different rank is neither a pair nor a valid sequence
      expect(combo).toBeNull();
    });
  });

  describe('three-pair bomb', () => {
    it('detects a 3-pair bomb (3 consecutive pairs)', () => {
      const combo = detectCombination([
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
      ]);
      expect(combo!.type).toBe('threePairBomb');
      expect(combo!.length).toBe(3);
    });

    it('rejects 3-pair bomb with 2s', () => {
      const combo = detectCombination([
        card('K', 'spades'), card('K', 'clubs'),
        card('A', 'spades'), card('A', 'clubs'),
        card('2', 'spades'), card('2', 'clubs'),
      ]);
      expect(combo).toBeNull();
    });

    it('rejects non-consecutive pairs', () => {
      const combo = detectCombination([
        card('3', 'spades'), card('3', 'clubs'),
        card('5', 'spades'), card('5', 'clubs'),
        card('7', 'spades'), card('7', 'clubs'),
      ]);
      expect(combo).toBeNull();
    });
  });

  describe('four-pair bomb', () => {
    it('detects a 4-pair bomb (4 consecutive pairs)', () => {
      const combo = detectCombination([
        card('6', 'spades'), card('6', 'hearts'),
        card('7', 'spades'), card('7', 'hearts'),
        card('8', 'spades'), card('8', 'hearts'),
        card('9', 'spades'), card('9', 'hearts'),
      ]);
      expect(combo!.type).toBe('fourPairBomb');
      expect(combo!.length).toBe(4);
    });

    it('rejects 4-pair bomb with 2s', () => {
      const combo = detectCombination([
        card('Q', 'spades'), card('Q', 'clubs'),
        card('K', 'spades'), card('K', 'clubs'),
        card('A', 'spades'), card('A', 'clubs'),
        card('2', 'spades'), card('2', 'clubs'),
      ]);
      expect(combo).toBeNull();
    });
  });

  describe('invalid combinations', () => {
    it('rejects odd number of cards that are not a sequence', () => {
      // 5 cards cannot form a double sequence
      const combo = detectCombination([
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
        card('5', 'spades'),
      ]);
      expect(combo).toBeNull();
    });

    it('rejects 2 consecutive pairs (need at least 3 for bomb)', () => {
      // 2 pairs = 4 cards, but need minimum 3 pairs for a bomb
      const combo = detectCombination([
        card('3', 'spades'), card('3', 'clubs'),
        card('4', 'spades'), card('4', 'clubs'),
      ]);
      expect(combo).toBeNull();
    });
  });
});
