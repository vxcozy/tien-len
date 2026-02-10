import type { Card } from './card';

export type GamePhase = 'waiting' | 'dealing' | 'playing' | 'roundEnd' | 'gameEnd';

export type CombinationType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'sequence'
  | 'quad'
  | 'threePairBomb'
  | 'fourPairBomb';

export interface Combination {
  type: CombinationType;
  cards: Card[];
  /** The card that determines beating power (highest rank, then suit) */
  highCard: Card;
  /** For sequences: number of individual ranks. For bombs: number of pairs */
  length?: number;
}

export interface PlayerState {
  id: string;
  name: string;
  handSize: number;
  isActive: boolean;
  hasPassed: boolean;
  finishPosition: number | null;
  isLocked: boolean;
}

export interface PrivatePlayerState extends PlayerState {
  hand: Card[];
}

export interface TurnHistoryEntry {
  playerId: string;
  playerName: string;
  action: 'play' | 'pass';
  combination?: Combination;
  timestamp: number;
}

export interface GameSettings {
  maxPlayers: number;
  instantWins: {
    dragon: boolean;
    fourTwos: boolean;
    sixPairs: boolean;
    fiveConsecutivePairs: boolean;
    threeConsecutiveTriples: boolean;
    twoPlusBombs: boolean;
  };
  turnTimeoutSeconds: number;
  /** true = winner of previous game leads; false = 3-of-spades holder leads every game */
  winnerLeads: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 8,
  instantWins: {
    dragon: true,
    fourTwos: true,
    sixPairs: true,
    fiveConsecutivePairs: true,
    threeConsecutiveTriples: true,
    twoPlusBombs: true,
  },
  turnTimeoutSeconds: 30,
  winnerLeads: true,
};

/** Game state visible to a specific player (redacted view) */
export interface ClientGameState {
  phase: GamePhase;
  players: PlayerState[];
  myHand: Card[];
  myPlayerId: string;
  currentPlayerIndex: number;
  currentCombination: Combination | null;
  lastPlayedBy: string | null;
  passedPlayerIds: string[];
  isFirstGame: boolean;
  isFirstTurnOfGame: boolean;
  turnHistory: TurnHistoryEntry[];
  finishOrder: string[];
  settings: GameSettings;
  lockedPlayerIds: string[];
}

/** Full internal game state (server only - never sent to clients) */
export interface InternalGameState {
  phase: GamePhase;
  playerIds: string[];
  playerNames: Map<string, string>;
  hands: Map<string, Card[]>;
  currentPlayerIndex: number;
  currentCombination: Combination | null;
  lastPlayedBy: string | null;
  passedPlayerIds: Set<string>;
  isFirstGame: boolean;
  isFirstTurnOfGame: boolean;
  turnHistory: TurnHistoryEntry[];
  finishOrder: string[];
  activePlayers: string[];
  settings: GameSettings;
  cardsPlayedByPlayer: Map<string, number>;
  lockedPlayerIds: Set<string>;
}

export type GameEventType =
  | 'game_started'
  | 'cards_dealt'
  | 'cards_played'
  | 'player_passed'
  | 'round_won'
  | 'player_finished'
  | 'game_over'
  | 'instant_win'
  | 'turn_changed';

export interface GameEvent {
  type: GameEventType;
  playerId?: string;
  data?: Record<string, unknown>;
}

export type InstantWinType =
  | 'dragon'
  | 'fourTwos'
  | 'sixPairs'
  | 'fiveConsecutivePairs'
  | 'threeConsecutiveTriples'
  | 'twoPlusBombs';
