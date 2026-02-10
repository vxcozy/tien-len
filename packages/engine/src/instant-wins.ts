import type { Card, Rank, InstantWinType, GameSettings } from '@tienlen/shared';
import { RANK_ORDER, SEQUENCE_RANKS } from '@tienlen/shared';
import { detectCombination } from './combination';

/**
 * Check if a hand qualifies for an instant win.
 * Must be checked immediately after dealing, before any cards are played.
 */
export function checkInstantWin(
  hand: Card[],
  settings: GameSettings,
): InstantWinType | null {
  if (settings.instantWins.dragon && isDragon(hand)) return 'dragon';
  if (settings.instantWins.fourTwos && hasFourTwos(hand)) return 'fourTwos';
  if (settings.instantWins.sixPairs && hasSixPairs(hand)) return 'sixPairs';
  if (settings.instantWins.fiveConsecutivePairs && hasFiveConsecutivePairs(hand)) return 'fiveConsecutivePairs';
  if (settings.instantWins.threeConsecutiveTriples && hasThreeConsecutiveTriples(hand)) return 'threeConsecutiveTriples';
  if (settings.instantWins.twoPlusBombs && hasTwoPlusBombs(hand)) return 'twoPlusBombs';
  return null;
}

/**
 * Dragon: A run from 3 through A (12 unique ranks, no 2 required).
 * The hand has 13 cards; must contain at least one of each rank 3-A.
 * The 13th card can be anything (duplicate or 2).
 */
function isDragon(hand: Card[]): boolean {
  if (hand.length !== 13) return false;

  const dragonRanks: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const rankSet = new Set(hand.map(c => c.rank));

  return dragonRanks.every(r => rankSet.has(r));
}

/**
 * Four 2s: Holding all four 2s in hand.
 */
function hasFourTwos(hand: Card[]): boolean {
  const twos = hand.filter(c => c.rank === '2');
  return twos.length === 4;
}

/**
 * Six Pairs: Having 6 or more pairs in a 13-card hand.
 */
function hasSixPairs(hand: Card[]): boolean {
  const rankCounts = getRankCounts(hand);

  let pairCount = 0;
  for (const count of rankCounts.values()) {
    pairCount += Math.floor(count / 2);
  }

  return pairCount >= 6;
}

/**
 * Five Consecutive Pairs: 5 consecutive ranks, each with at least 2 cards.
 */
function hasFiveConsecutivePairs(hand: Card[]): boolean {
  return hasConsecutiveGroups(hand, 5, 2);
}

/**
 * Three Consecutive Triples: 3 consecutive ranks, each with at least 3 cards.
 */
function hasThreeConsecutiveTriples(hand: Card[]): boolean {
  return hasConsecutiveGroups(hand, 3, 3);
}

/**
 * Two or more bombs in hand.
 * A bomb is a quad (4 of same rank) or 3+ consecutive pairs.
 */
function hasTwoPlusBombs(hand: Card[]): boolean {
  const rankCounts = getRankCounts(hand);
  let bombCount = 0;

  // Count quads
  for (const count of rankCounts.values()) {
    if (count >= 4) bombCount++;
  }

  // Count consecutive pair runs (3+ pairs in a row, no 2s)
  // Use SEQUENCE_RANKS (3-A, no 2) in order
  const pairRanks: number[] = [];
  for (const rank of SEQUENCE_RANKS) {
    if ((rankCounts.get(rank) ?? 0) >= 2) {
      pairRanks.push(RANK_ORDER[rank]);
    }
  }

  // Find maximal runs of 3+ consecutive pair-rank values
  // Each maximal run of 3+ counts as exactly one bomb
  if (pairRanks.length >= 3) {
    pairRanks.sort((a, b) => a - b);
    let runLength = 1;
    for (let i = 1; i <= pairRanks.length; i++) {
      if (i < pairRanks.length && pairRanks[i] === pairRanks[i - 1] + 1) {
        runLength++;
      } else {
        if (runLength >= 3) bombCount++;
        runLength = 1;
      }
    }
  }

  return bombCount >= 2;
}

/** Count cards per rank */
function getRankCounts(hand: Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of hand) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return counts;
}

/**
 * Check if hand contains `needed` consecutive ranks (no 2s),
 * each with at least `minPerRank` cards.
 */
function hasConsecutiveGroups(hand: Card[], needed: number, minPerRank: number): boolean {
  const rankCounts = getRankCounts(hand);

  // Check consecutive ranks using SEQUENCE_RANKS (3 through A, no 2)
  let consecutive = 0;
  for (const rank of SEQUENCE_RANKS) {
    if ((rankCounts.get(rank) ?? 0) >= minPerRank) {
      consecutive++;
      if (consecutive >= needed) return true;
    } else {
      consecutive = 0;
    }
  }

  return false;
}
