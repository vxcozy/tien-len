export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

export interface Card {
  rank: Rank;
  suit: Suit;
  /** Unique identifier e.g. "3s", "Ah", "2d" */
  id: string;
}
