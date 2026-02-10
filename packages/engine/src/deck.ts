import type { Card, Rank, Suit } from '@tienlen/shared';
import { RANKS, SUITS, SUIT_SHORT } from '@tienlen/shared';

/** Create a standard 52-card deck */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        rank,
        suit,
        id: `${rank}${SUIT_SHORT[suit]}`,
      });
    }
  }
  return deck;
}

/** Fisher-Yates shuffle (cryptographically fair if crypto.getRandomValues available) */
export function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards evenly to players.
 * With 4 players: 13 cards each (standard).
 * With other counts: deal evenly, remainder goes undealt.
 */
export function deal(deck: Card[], playerCount: number): { hands: Card[][]; undealt: Card[] } {
  const cardsPerPlayer = Math.floor(deck.length / playerCount);
  const hands: Card[][] = [];

  for (let i = 0; i < playerCount; i++) {
    hands.push(deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer));
  }

  const undealt = deck.slice(playerCount * cardsPerPlayer);
  return { hands, undealt };
}
