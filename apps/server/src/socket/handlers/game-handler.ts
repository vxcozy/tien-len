import type { Server, Socket } from 'socket.io';
import { PlayCardsSchema } from '@tienlen/shared';
import type { RoomManager } from '../../rooms/room-manager.js';
import { gameActionLimiter } from '../rate-limiter.js';

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
): void {
  const userId = socket.data.userId as string;

  /** Broadcast each player's personal game state after a game action */
  function broadcastGameState(roomCode: string): void {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const sockets = io.sockets.adapter.rooms.get(roomCode);
    if (!sockets) return;

    for (const socketId of sockets) {
      const s = io.sockets.sockets.get(socketId);
      if (s) {
        const playerId = s.data.userId as string;
        const state = room.getGameStateForPlayer(playerId);
        if (state) {
          s.emit('game_state_updated', state);
        }
      }
    }

    // Check if game is over
    if (room.isGameOver()) {
      io.to(roomCode).emit('game_ended', {
        finishOrder: room.getGameStateForPlayer(room.getPlayerIds()[0])?.finishOrder ?? [],
      });
    }
  }

  socket.on('play_cards', (data, callback) => {
    try {
      // Rate limit
      if (!gameActionLimiter.consume(socket.id)) {
        return callback?.({ error: 'Too many actions. Slow down.' });
      }

      const parsed = PlayCardsSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ error: 'Invalid request' });
      }

      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });
      if (!room.isGameInProgress()) return callback?.({ error: 'No game in progress' });

      room.playCards(userId, parsed.data.cardIds);
      callback?.({ success: true });
      broadcastGameState(room.code);
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Invalid play' });
    }
  });

  socket.on('pass', (_, callback) => {
    try {
      // Rate limit
      if (!gameActionLimiter.consume(socket.id)) {
        return callback?.({ error: 'Too many actions. Slow down.' });
      }

      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });
      if (!room.isGameInProgress()) return callback?.({ error: 'No game in progress' });

      room.pass(userId);
      callback?.({ success: true });
      broadcastGameState(room.code);
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Cannot pass' });
    }
  });

  socket.on('request_rematch', (_, callback) => {
    try {
      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });
      if (!room.isGameOver()) return callback?.({ error: 'Game is not over' });

      room.endGame();
      callback?.({ success: true });
      io.to(room.code).emit('room_updated', room.getState());
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to request rematch' });
    }
  });
}
