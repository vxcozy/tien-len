import type { Card, Combination, CombinationType } from '@tienlen/shared';
import { RANK_ORDER } from '@tienlen/shared';
import { cardValue } from './card-utils';

/**
 * Detect what combination a set of cards forms.
 * Returns null if the cards don't form a valid combination.
 */
export function detectCombination(cards: Card[]): Combination | null {
  if (cards.length === 0) return null;

  const sorted = [...cards].sort((a, b) => cardValue(a) - cardValue(b));
  const n = sorted.length;
  const highCard = sorted[n - 1];

  // Single
  if (n === 1) {
    return { type: 'single', cards: sorted, highCard };
  }

  // Check if all same rank
  const allSameRank = sorted.every(c => c.rank === sorted[0].rank);

  if (allSameRank) {
    if (n === 2) return { type: 'pair', cards: sorted, highCard };
    if (n === 3) return { type: 'triple', cards: sorted, highCard };
    if (n === 4) return { type: 'quad', cards: sorted, highCard };
    return null; // 5+ of same rank is impossible
  }

  // Check sequence (3+ consecutive ranks, no 2s)
  if (n >= 3) {
    const seq = isSequence(sorted);
    if (seq) {
      return { type: 'sequence', cards: sorted, highCard, length: n };
    }
  }

  // Check three-pair bomb (exactly 6 cards = 3 consecutive pairs, no 2s)
  if (n === 6) {
    if (isConsecutivePairs(sorted)) {
      return { type: 'threePairBomb', cards: sorted, highCard, length: 3 };
    }
  }

  // Check four-pair bomb (exactly 8 cards = 4 consecutive pairs, no 2s)
  if (n === 8) {
    if (isConsecutivePairs(sorted)) {
      return { type: 'fourPairBomb', cards: sorted, highCard, length: 4 };
    }
  }

  return null;
}

/** Check if sorted cards form a sequence of consecutive ranks (no 2s) */
function isSequence(sorted: Card[]): boolean {
  // 2s cannot appear in sequences
  if (sorted.some(c => c.rank === '2')) return false;

  for (let i = 1; i < sorted.length; i++) {
    const prevRankVal = RANK_ORDER[sorted[i - 1].rank];
    const currRankVal = RANK_ORDER[sorted[i].rank];
    if (currRankVal !== prevRankVal + 1) return false;
  }
  return true;
}

/** Check if sorted cards form consecutive pairs (no 2s) */
function isConsecutivePairs(sorted: Card[]): boolean {
  // 2s cannot appear
  if (sorted.some(c => c.rank === '2')) return false;

  // Must be even number of cards
  if (sorted.length % 2 !== 0) return false;

  // Group into pairs
  for (let i = 0; i < sorted.length; i += 2) {
    // Each pair must be same rank
    if (sorted[i].rank !== sorted[i + 1].rank) return false;

    // Consecutive pairs must have consecutive ranks
    if (i >= 2) {
      const prevRankVal = RANK_ORDER[sorted[i - 2].rank];
      const currRankVal = RANK_ORDER[sorted[i].rank];
      if (currRankVal !== prevRankVal + 1) return false;
    }
  }

  return true;
}

/** Get a human-readable label for a combination */
export function combinationLabel(combo: Combination): string {
  switch (combo.type) {
    case 'single':
      return `${combo.highCard.rank} of ${combo.highCard.suit}`;
    case 'pair':
      return `Pair of ${combo.cards[0].rank}s`;
    case 'triple':
      return `Triple ${combo.cards[0].rank}s`;
    case 'quad':
      return `Four ${combo.cards[0].rank}s`;
    case 'sequence':
      return `Straight ${combo.cards[0].rank}-${combo.highCard.rank}`;
    case 'threePairBomb':
      return `3-Pair Bomb ${combo.cards[0].rank}-${combo.highCard.rank}`;
    case 'fourPairBomb':
      return `4-Pair Bomb ${combo.cards[0].rank}-${combo.highCard.rank}`;
  }
}
