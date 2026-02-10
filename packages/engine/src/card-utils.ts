import type { Card } from '@tienlen/shared';
import { RANK_ORDER, SUIT_ORDER } from '@tienlen/shared';

/** Get numeric value of a card (0-51). Higher value = stronger card. */
export function cardValue(card: Card): number {
  return RANK_ORDER[card.rank] * 4 + SUIT_ORDER[card.suit];
}

/** Compare two cards. Negative = a < b, Positive = a > b, Zero = equal. */
export function compareCards(a: Card, b: Card): number {
  return cardValue(a) - cardValue(b);
}

/** Sort a hand ascending (3 of spades first, 2 of hearts last) */
export function sortHand(hand: Card[]): Card[] {
  return [...hand].sort(compareCards);
}

/** Find which player index holds the 3 of spades */
export function findThreeOfSpades(hands: Card[][]): number {
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].some(c => c.rank === '3' && c.suit === 'spades')) {
      return i;
    }
  }
  return -1;
}

/** Check if a card is a 2 */
export function isTwo(card: Card): boolean {
  return card.rank === '2';
}

/** Get a card from a hand by its ID, returning the card and remaining hand */
export function removeCardFromHand(hand: Card[], cardId: string): { card: Card | null; remaining: Card[] } {
  const index = hand.findIndex(c => c.id === cardId);
  if (index === -1) return { card: null, remaining: hand };
  const card = hand[index];
  const remaining = [...hand.slice(0, index), ...hand.slice(index + 1)];
  return { card, remaining };
}

/** Find cards in a hand by their IDs. Returns null if any ID not found. */
export function findCardsInHand(hand: Card[], cardIds: string[]): Card[] | null {
  const found: Card[] = [];
  const handCopy = [...hand];

  for (const id of cardIds) {
    const index = handCopy.findIndex(c => c.id === id);
    if (index === -1) return null;
    found.push(handCopy[index]);
    handCopy.splice(index, 1);
  }

  return found;
}

/** Remove multiple cards from hand by their IDs */
export function removeCardsFromHand(hand: Card[], cardIds: string[]): Card[] {
  const idsToRemove = new Set(cardIds);
  return hand.filter(c => !idsToRemove.has(c.id));
}
