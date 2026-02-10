import http from 'node:http';
import { Server } from 'socket.io';
import { config } from './config.js';
import { RoomManager } from './rooms/room-manager.js';
import { authMiddleware } from './socket/auth-middleware.js';
import { registerRoomHandlers } from './socket/handlers/room-handler.js';
import { registerGameHandlers } from './socket/handlers/game-handler.js';
import { registerChatHandlers } from './socket/handlers/chat-handler.js';
import { gameActionLimiter, chatLimiter, joinLimiter } from './socket/rate-limiter.js';

const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: roomManager.getRoomCount() }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'], // WebSocket only - no polling
  pingTimeout: 20_000,
  pingInterval: 10_000,
});

const roomManager = new RoomManager();

// Authentication middleware
io.use(authMiddleware);

// Connection handling
io.on('connection', (socket) => {
  const userId = socket.data.userId as string;
  const userName = socket.data.name as string;
  console.log(`[connect] ${userName} (${userId}) - ${socket.id}`);

  // Check for reconnection to existing room
  const existingRoom = roomManager.handlePlayerReconnect(userId);
  if (existingRoom) {
    socket.join(existingRoom.code);
    console.log(`[reconnect] ${userName} rejoined room ${existingRoom.code}`);

    // Send current state
    const gameState = existingRoom.getGameStateForPlayer(userId);
    if (gameState) {
      socket.emit('game_state_updated', gameState);
    }
    socket.emit('room_updated', existingRoom.getState());
    io.to(existingRoom.code).emit('player_reconnected', { playerId: userId });
  }

  // Register event handlers
  registerRoomHandlers(io, socket, roomManager);
  registerGameHandlers(io, socket, roomManager);
  registerChatHandlers(io, socket, roomManager);

  // Disconnect handling
  socket.on('disconnect', (reason) => {
    console.log(`[disconnect] ${userName} (${userId}) - reason: ${reason}`);

    // Cleanup rate limiters
    gameActionLimiter.remove(socket.id);
    chatLimiter.remove(socket.id);
    joinLimiter.remove(socket.id);

    // Handle disconnect with grace period for in-game
    roomManager.handlePlayerDisconnect(userId, () => {
      const room = roomManager.getRoomForPlayer(userId);
      if (room) {
        io.to(room.code).emit('player_disconnected_timeout', { playerId: userId });
        roomManager.removePlayerFromCurrentRoom(userId);
        io.to(room.code).emit('room_updated', room.getState());
      }
    });

    // Notify room of temporary disconnect
    const room = roomManager.getRoomForPlayer(userId);
    if (room) {
      io.to(room.code).emit('player_disconnected', { playerId: userId });
    }
  });
});

server.listen(config.PORT, () => {
  console.log(`Tien Len server running on port ${config.PORT}`);
  console.log(`CORS origin: ${config.CORS_ORIGIN}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

// Graceful shutdown
function shutdown() {
  console.log('Shutting down...');
  roomManager.destroy();
  io.close();
  server.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
