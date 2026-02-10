import type { Server, Socket } from 'socket.io';
import { ChatMessageSchema } from '@tienlen/shared';
import type { RoomManager } from '../../rooms/room-manager.js';
import { sanitizeString } from '../../utils/sanitize.js';
import { chatLimiter } from '../rate-limiter.js';

export function registerChatHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
): void {
  const userId = socket.data.userId as string;
  const userName = socket.data.name as string;

  socket.on('chat_message', (data, callback) => {
    try {
      // Rate limit
      if (!chatLimiter.consume(socket.id)) {
        return callback?.({ error: 'Sending messages too quickly' });
      }

      const parsed = ChatMessageSchema.safeParse(data);
      if (!parsed.success) {
        return callback?.({ error: 'Invalid message' });
      }

      const room = roomManager.getRoomForPlayer(userId);
      if (!room) return callback?.({ error: 'Not in a room' });

      const sanitizedMessage = sanitizeString(parsed.data.message, 200);
      if (sanitizedMessage.length === 0) return;

      io.to(room.code).emit('chat_message', {
        playerId: userId,
        playerName: userName,
        message: sanitizedMessage,
        timestamp: Date.now(),
      });

      callback?.({ success: true });
    } catch (err: any) {
      callback?.({ error: err.message ?? 'Failed to send message' });
    }
  });
}
