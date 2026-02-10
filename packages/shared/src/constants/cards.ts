import type { Rank, Suit } from '../types/card';

export const RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const SUITS: Suit[] = ['spades', 'clubs', 'diamonds', 'hearts'];

/** Rank order: 3 is lowest (0), 2 is highest (12) */
export const RANK_ORDER: Record<Rank, number> = {
  '3': 0, '4': 1, '5': 2, '6': 3, '7': 4, '8': 5,
  '9': 6, '10': 7, 'J': 8, 'Q': 9, 'K': 10, 'A': 11, '2': 12,
};

/** Suit order: Spades (lowest) to Hearts (highest) */
export const SUIT_ORDER: Record<Suit, number> = {
  spades: 0, clubs: 1, diamonds: 2, hearts: 3,
};

/** Suit short codes for card IDs */
export const SUIT_SHORT: Record<Suit, string> = {
  spades: 's', clubs: 'c', diamonds: 'd', hearts: 'h',
};

/** Ranks that can appear in sequences (everything except 2) */
export const SEQUENCE_RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
