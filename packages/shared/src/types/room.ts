import type { GameSettings } from './game';

export type RoomPhase = 'waiting' | 'starting' | 'playing' | 'finished' | 'abandoned';

export interface RoomPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
}

/** Room state broadcast to all clients */
export interface RoomState {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  settings: GameSettings;
  isGameInProgress: boolean;
}

export interface RoomInfo {
  code: string;
  phase: RoomPhase;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  settings: GameSettings;
  createdAt: number;
}
