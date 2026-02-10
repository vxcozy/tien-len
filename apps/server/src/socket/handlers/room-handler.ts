import type { Server, Socket } from 'socket.io';
import { CreateRoomSchema, JoinRoomSchema, RoomSettingsSchema, KickPlayerSchema } from '@tienlen/shared';
import type { RoomManager } from '../../rooms/room-manager.js';
import { sanitizeName } from '../../utils/sanitize.js';
import { joinLimiter } from '../rate-limiter.js';

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
): void {
  const userId = socket.data.userId as string;
  const userName = socket.data.name as string;

  socket.on('create_room', (data, callback) => {
    try {
      const parsed = CreateRoomSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ error: 'Invalid request' });
      }

      const name = sanitizeName(parsed.data.playerName ?? userName);
      const room = roomManager.createRoom(userId, name);

      socket.join(room.code);
      callback?.({ code: room.code, room: room.getState() });
      io.to(room.code).emit('room_updated', room.getState());
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to create room' });
    }
  });

  socket.on('join_room', (data, callback) => {
    try {
      const parsed = JoinRoomSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ error: 'Invalid request' });
      }

      // Rate limit join attempts (anti brute-force)
      if (!joinLimiter.consume(socket.id)) {
        return callback?.({ error: 'Too many attempts. Try again later.' });
      }

      const name = sanitizeName(parsed.data.playerName ?? userName);
      const room = roomManager.joinRoom(parsed.data.code, userId, name);

      socket.join(room.code);
      callback?.({ room: room.getState() });
      io.to(room.code).emit('room_updated', room.getState());
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to join room' });
    }
  });

  socket.on('leave_room', (_, callback) => {
    try {
      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });

      const code = room.code;
      socket.leave(code);
      roomManager.removePlayerFromCurrentRoom(userId);

      callback?.({ success: true });

      // Notify remaining players
      const updatedRoom = roomManager.getRoom(code);
      if (updatedRoom) {
        io.to(code).emit('room_updated', updatedRoom.getState());
      } else {
        io.to(code).emit('room_closed');
      }
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to leave room' });
    }
  });

  socket.on('toggle_ready', (_, callback) => {
    try {
      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });

      const player = room.getPlayer(userId);
      if (!player) return callback?.({ error: 'Player not found' });

      room.setReady(userId, !player.isReady);
      callback?.({ success: true });
      io.to(room.code).emit('room_updated', room.getState());
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to toggle ready' });
    }
  });

  socket.on('update_settings', (data, callback) => {
    try {
      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });
      if (room.hostId !== userId) return callback?.({ error: 'Only the host can change settings' });

      const parsed = RoomSettingsSchema.safeParse(data);
      if (!parsed.success) return callback?.({ error: 'Invalid settings' });

      room.updateSettings(parsed.data);
      callback?.({ success: true });
      io.to(room.code).emit('room_updated', room.getState());
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to update settings' });
    }
  });

  socket.on('kick_player', (data, callback) => {
    try {
      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });
      if (room.hostId !== userId) return callback?.({ error: 'Only the host can kick players' });

      const parsed = KickPlayerSchema.safeParse(data);
      if (!parsed.success) return callback?.({ error: 'Invalid request' });

      room.kickPlayer(parsed.data.playerId);
      callback?.({ success: true });

      // Notify the kicked player
      io.to(room.code).emit('player_kicked', { playerId: parsed.data.playerId });
      io.to(room.code).emit('room_updated', room.getState());
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to kick player' });
    }
  });

  socket.on('start_game', (_, callback) => {
    try {
      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });
      if (room.hostId !== userId) return callback?.({ error: 'Only the host can start the game' });

      room.startGame();
      callback?.({ success: true });

      // Send each player their personal game state
      for (const playerId of room.getPlayerIds()) {
        const state = room.getGameStateForPlayer(playerId);
        if (state) {
          const sockets = io.sockets.adapter.rooms.get(room.code);
          if (sockets) {
            for (const socketId of sockets) {
              const s = io.sockets.sockets.get(socketId);
              if (s && s.data.userId === playerId) {
                s.emit('game_started', state);
              }
            }
          }
        }
      }
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to start game' });
    }
  });
}
