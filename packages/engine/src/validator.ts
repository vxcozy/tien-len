import type { Card, Combination } from '@tienlen/shared';
import { cardValue } from './card-utils';
import { detectCombination } from './combination';

/** Bomb types that can only be played against 2s or other bombs */
const BOMB_TYPES = new Set(['quad', 'threePairBomb', 'fourPairBomb']);

/**
 * Check if a played combination beats the current combination on the table.
 * Returns true if the play is valid (beats the table or table is empty).
 */
export function canBeat(played: Combination, onTable: Combination | null): boolean {
  // If table is empty, any valid non-bomb combination can lead
  if (onTable === null) {
    // Bombs cannot lead - they can only be played against 2s or other bombs
    if (played.type === 'threePairBomb' || played.type === 'fourPairBomb') {
      return false;
    }
    return true;
  }

  // Check bomb scenarios (special plays that beat 2s, or bomb vs bomb)
  const bombResult = checkBomb(played, onTable);
  if (bombResult !== null) return bombResult;

  // Bombs cannot be played as normal combos
  if (played.type === 'threePairBomb' || played.type === 'fourPairBomb') {
    return false;
  }

  // Normal play: must be same type
  if (played.type !== onTable.type) return false;

  // For sequences: must be same length
  if (played.type === 'sequence' && played.length !== onTable.length) {
    return false;
  }

  // Higher high card wins
  return cardValue(played.highCard) > cardValue(onTable.highCard);
}

/**
 * Check if the play is a valid bomb against 2s, or bomb vs bomb.
 * Returns true if valid, false if invalid bomb attempt, null if not a bomb scenario.
 */
function checkBomb(played: Combination, onTable: Combination): boolean | null {
  const tableHasTwo = onTable.highCard.rank === '2';

  // --- Bomb vs bomb (same type) ---
  if (played.type === 'quad' && onTable.type === 'quad') {
    return cardValue(played.highCard) > cardValue(onTable.highCard);
  }
  if (played.type === 'threePairBomb' && onTable.type === 'threePairBomb') {
    return cardValue(played.highCard) > cardValue(onTable.highCard);
  }
  if (played.type === 'fourPairBomb' && onTable.type === 'fourPairBomb') {
    return cardValue(played.highCard) > cardValue(onTable.highCard);
  }

  // --- Bombs against 2s ---
  if (!tableHasTwo) return null;

  // Quad beats a single 2 only
  if (played.type === 'quad' && onTable.type === 'single') {
    return true;
  }

  // Three-pair bomb beats a single 2
  if (played.type === 'threePairBomb' && onTable.type === 'single') {
    return true;
  }

  // Four-pair bomb beats a pair of 2s
  if (played.type === 'fourPairBomb' && onTable.type === 'pair') {
    return true;
  }

  return null;
}

/**
 * Validate a play is legal given the current game context.
 */
export function isValidPlay(
  cards: Card[],
  onTable: Combination | null,
): { valid: boolean; combination?: Combination; error?: string } {
  const combination = detectCombination(cards);
  if (!combination) {
    return { valid: false, error: 'Invalid card combination' };
  }

  if (!canBeat(combination, onTable)) {
    return { valid: false, error: 'This combination does not beat the current play' };
  }

  return { valid: true, combination };
}

/**
 * Validate the first play of a game includes the 3 of Spades.
 */
export function isValidFirstPlay(cards: Card[], isFirstGame: boolean): boolean {
  if (!isFirstGame) return true;
  return cards.some(c => c.rank === '3' && c.suit === 'spades');
}
