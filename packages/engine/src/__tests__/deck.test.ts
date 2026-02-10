import { describe, it, expect } from 'vitest';
import { createDeck, shuffle, deal } from '../deck';

describe('createDeck', () => {
  it('creates 52 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  it('has no duplicate IDs', () => {
    const deck = createDeck();
    const ids = deck.map(c => c.id);
    expect(new Set(ids).size).toBe(52);
  });

  it('has 4 suits with 13 cards each', () => {
    const deck = createDeck();
    const suits = ['spades', 'clubs', 'diamonds', 'hearts'] as const;
    for (const suit of suits) {
      expect(deck.filter(c => c.suit === suit)).toHaveLength(13);
    }
  });

  it('has 13 ranks with 4 cards each', () => {
    const deck = createDeck();
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    for (const rank of ranks) {
      expect(deck.filter(c => c.rank === rank)).toHaveLength(4);
    }
  });
});

describe('shuffle', () => {
  it('returns all 52 cards', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(52);
    expect(new Set(shuffled.map(c => c.id)).size).toBe(52);
  });

  it('does not modify the original deck', () => {
    const deck = createDeck();
    const original = [...deck];
    shuffle(deck);
    expect(deck).toEqual(original);
  });

  it('produces a different order (probabilistic)', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    // It's astronomically unlikely that a shuffle produces the same order
    const sameOrder = deck.every((c, i) => c.id === shuffled[i].id);
    expect(sameOrder).toBe(false);
  });
});

describe('deal', () => {
  it('deals 13 cards each to 4 players', () => {
    const deck = shuffle(createDeck());
    const { hands, undealt } = deal(deck, 4);
    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(13);
    }
    expect(undealt).toHaveLength(0);
  });

  it('deals evenly to 3 players with 1 undealt', () => {
    const deck = shuffle(createDeck());
    const { hands, undealt } = deal(deck, 3);
    expect(hands).toHaveLength(3);
    for (const hand of hands) {
      expect(hand).toHaveLength(17);
    }
    expect(undealt).toHaveLength(1);
  });

  it('deals evenly to 2 players', () => {
    const deck = shuffle(createDeck());
    const { hands, undealt } = deal(deck, 2);
    expect(hands).toHaveLength(2);
    for (const hand of hands) {
      expect(hand).toHaveLength(26);
    }
    expect(undealt).toHaveLength(0);
  });

  it('preserves all cards across hands', () => {
    const deck = shuffle(createDeck());
    const { hands, undealt } = deal(deck, 4);
    const allCards = [...hands.flat(), ...undealt];
    expect(new Set(allCards.map(c => c.id)).size).toBe(52);
  });
});
