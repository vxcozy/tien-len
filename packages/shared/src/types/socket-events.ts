import type { Card } from './card';
import type { GameSettings, ClientGameState, GameEvent } from './game';
import type { RoomInfo, RoomPlayer } from './room';

/** Client -> Server events */
export interface ClientToServerEvents {
  'room:create': (
    data: { playerName: string; settings: Partial<GameSettings> },
    callback: (response: { success: boolean; code?: string; error?: string }) => void,
  ) => void;

  'room:join': (
    data: { code: string; playerName: string },
    callback: (response: { success: boolean; room?: RoomInfo; error?: string }) => void,
  ) => void;

  'room:leave': (
    callback: (response: { success: boolean }) => void,
  ) => void;

  'room:ready': (
    callback: (response: { success: boolean }) => void,
  ) => void;

  'room:start': (
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  'room:kick': (
    data: { playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  'room:settings': (
    data: { settings: Partial<GameSettings> },
    callback: (response: { success: boolean }) => void,
  ) => void;

  'game:play': (
    data: { cardIds: string[] },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  'game:pass': (
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;

  'game:rematch': (
    callback: (response: { success: boolean }) => void,
  ) => void;

  'chat:message': (
    data: { message: string },
  ) => void;

  'room:reconnect': (
    data: { code: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
}

/** Server -> Client events */
export interface ServerToClientEvents {
  'room:updated': (room: RoomInfo) => void;
  'room:player_joined': (player: RoomPlayer) => void;
  'room:player_left': (data: { playerId: string }) => void;
  'room:player_ready': (data: { playerId: string; isReady: boolean }) => void;
  'room:kicked': (data: { reason: string }) => void;
  'room:settings_updated': (settings: GameSettings) => void;

  'game:state': (state: ClientGameState) => void;
  'game:event': (event: GameEvent) => void;
  'game:cards_played': (data: {
    playerId: string;
    cards: Card[];
    handSize: number;
  }) => void;
  'game:player_passed': (data: { playerId: string }) => void;
  'game:round_won': (data: { playerId: string }) => void;
  'game:player_finished': (data: { playerId: string; position: number }) => void;
  'game:over': (data: { finishOrder: string[] }) => void;
  'game:instant_win': (data: { playerId: string; type: string; cards: Card[] }) => void;

  'chat:message': (data: { playerId: string; playerName: string; message: string; timestamp: number }) => void;

  'player:disconnected': (data: { playerId: string; reconnectDeadline: number }) => void;
  'player:reconnected': (data: { playerId: string }) => void;

  'error': (data: { message: string }) => void;
}
