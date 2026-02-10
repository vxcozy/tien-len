import type { Card, Combination, CombinationType } from '@tienlen/shared';
import { RANK_ORDER } from '@tienlen/shared';
import { sortHand, cardValue } from './card-utils';
import { detectCombination } from './combination';
import { canBeat } from './validator';

/**
 * Simple AI that plays the lowest valid combination.
 * Strategy: conserve strong cards, play weak cards first.
 */
export class SimpleAI {
  /**
   * Select cards to play.
   * Returns card IDs to play, or null to pass.
   */
  selectPlay(
    hand: Card[],
    currentCombo: Combination | null,
    isFirstPlay: boolean,
  ): string[] | null {
    const sorted = sortHand(hand);

    if (currentCombo === null) {
      // We're leading - play lowest combination
      return this.selectLead(sorted, isFirstPlay);
    }

    // Try to beat the current combination
    return this.selectBeat(sorted, currentCombo);
  }

  private selectLead(hand: Card[], mustIncludeThreeOfSpades: boolean): string[] {
    // If must include 3 of spades, find combos containing it
    if (mustIncludeThreeOfSpades) {
      const threeOfSpades = hand.find(c => c.rank === '3' && c.suit === 'spades');
      if (threeOfSpades) {
        // Try to play it in a combo first, otherwise as a single
        const combos = this.findAllCombinations(hand);
        for (const combo of combos) {
          if (combo.cards.some(c => c.id === threeOfSpades.id)) {
            return combo.cards.map(c => c.id);
          }
        }
        return [threeOfSpades.id];
      }
    }

    // Play lowest single (never lead with a bomb)
    return [hand[0].id];
  }

  private selectBeat(hand: Card[], onTable: Combination): string[] | null {
    const candidates = this.findBeatingCombinations(hand, onTable);
    if (candidates.length === 0) return null;

    // Play the lowest valid combination (conserve strong cards)
    return candidates[0].cards.map(c => c.id);
  }

  /** Find all valid combinations in a hand that beat the current table */
  private findBeatingCombinations(hand: Card[], onTable: Combination): Combination[] {
    const results: Combination[] = [];

    switch (onTable.type) {
      case 'single':
        // Find singles that beat the table
        for (const card of hand) {
          const combo = detectCombination([card])!;
          if (canBeat(combo, onTable)) {
            results.push(combo);
          }
        }
        // Also check bombs if table is a 2
        if (onTable.highCard.rank === '2') {
          results.push(...this.findBombs(hand, onTable));
        }
        break;

      case 'pair':
        results.push(...this.findMatchingCombos(hand, 'pair', 2, onTable));
        if (onTable.highCard.rank === '2') {
          results.push(...this.findBombs(hand, onTable));
        }
        break;

      case 'triple':
        results.push(...this.findMatchingCombos(hand, 'triple', 3, onTable));
        break;

      case 'quad':
        // Quad vs quad
        results.push(...this.findMatchingCombos(hand, 'quad', 4, onTable));
        break;

      case 'sequence':
        results.push(...this.findSequences(hand, onTable.length!, onTable));
        break;

      case 'threePairBomb':
        // Only same-type bomb can beat: find 3-pair bombs with higher high card
        results.push(...this.findConsecutivePairBombs(hand, 3, onTable));
        break;

      case 'fourPairBomb':
        // Only same-type bomb can beat: find 4-pair bombs with higher high card
        results.push(...this.findConsecutivePairBombs(hand, 4, onTable));
        break;
    }

    // Sort by strength (weakest first - play weakest beating combo)
    results.sort((a, b) => cardValue(a.highCard) - cardValue(b.highCard));

    return results;
  }

  private findMatchingCombos(
    hand: Card[],
    type: CombinationType,
    count: number,
    onTable: Combination,
  ): Combination[] {
    const results: Combination[] = [];
    const byRank = this.groupByRank(hand);

    for (const [rank, cards] of byRank) {
      if (cards.length >= count) {
        const combo = detectCombination(cards.slice(0, count));
        if (combo && canBeat(combo, onTable)) {
          results.push(combo);
        }
      }
    }

    return results;
  }

  private findSequences(hand: Card[], length: number, onTable: Combination): Combination[] {
    const results: Combination[] = [];
    const nonTwos = hand.filter(c => c.rank !== '2');
    const sorted = sortHand(nonTwos);

    // Try all possible starting positions
    for (let i = 0; i <= sorted.length - length; i++) {
      const slice = sorted.slice(i, i + length);
      const combo = detectCombination(slice);
      if (combo && combo.type === 'sequence' && canBeat(combo, onTable)) {
        results.push(combo);
      }
    }

    return results;
  }

  /** Find consecutive-pair bombs of a specific pair count */
  private findConsecutivePairBombs(hand: Card[], pairCount: number, onTable: Combination): Combination[] {
    const results: Combination[] = [];
    const byRank = this.groupByRank(hand);
    const ranksWithPairs: string[] = [];

    for (const [rank, cards] of byRank) {
      if (cards.length >= 2 && rank !== '2') {
        ranksWithPairs.push(rank);
      }
    }

    // Sort ranks by order
    ranksWithPairs.sort((a, b) => RANK_ORDER[a as keyof typeof RANK_ORDER] - RANK_ORDER[b as keyof typeof RANK_ORDER]);

    // Try all consecutive pair sequences of the required length
    for (let i = 0; i <= ranksWithPairs.length - pairCount; i++) {
      const ranks = ranksWithPairs.slice(i, i + pairCount);
      // Check if ranks are consecutive
      let consecutive = true;
      for (let j = 1; j < ranks.length; j++) {
        if (RANK_ORDER[ranks[j] as keyof typeof RANK_ORDER] !== RANK_ORDER[ranks[j-1] as keyof typeof RANK_ORDER] + 1) {
          consecutive = false;
          break;
        }
      }
      if (!consecutive) continue;

      const cards: Card[] = [];
      for (const rank of ranks) {
        const rankCards = byRank.get(rank)!;
        cards.push(rankCards[0], rankCards[1]);
      }

      const combo = detectCombination(cards);
      if (combo && canBeat(combo, onTable)) {
        results.push(combo);
      }
    }

    return results;
  }

  private findBombs(hand: Card[], onTable: Combination): Combination[] {
    const results: Combination[] = [];

    // Find quads (beats single 2)
    if (onTable.type === 'single') {
      const byRank = this.groupByRank(hand);
      for (const [, cards] of byRank) {
        if (cards.length === 4) {
          const combo = detectCombination(cards)!;
          if (canBeat(combo, onTable)) {
            results.push(combo);
          }
        }
      }
    }

    // Find 3-pair bombs (beats single 2)
    if (onTable.type === 'single') {
      results.push(...this.findConsecutivePairBombs(hand, 3, onTable));
    }

    // Find 4-pair bombs (beats pair of 2s)
    if (onTable.type === 'pair') {
      results.push(...this.findConsecutivePairBombs(hand, 4, onTable));
    }

    return results;
  }

  /** Find all non-bomb combinations in a hand (for leading) */
  private findAllCombinations(hand: Card[]): Combination[] {
    const results: Combination[] = [];
    const byRank = this.groupByRank(hand);

    // Singles
    for (const card of hand) {
      results.push(detectCombination([card])!);
    }

    // Pairs, triples (skip quads when leading since they're bombs in context)
    for (const [, cards] of byRank) {
      if (cards.length >= 2) results.push(detectCombination(cards.slice(0, 2))!);
      if (cards.length >= 3) results.push(detectCombination(cards.slice(0, 3))!);
    }

    return results;
  }

  private groupByRank(hand: Card[]): Map<string, Card[]> {
    const byRank = new Map<string, Card[]>();
    for (const card of hand) {
      const existing = byRank.get(card.rank) ?? [];
      existing.push(card);
      byRank.set(card.rank, existing);
    }
    return byRank;
  }
}
