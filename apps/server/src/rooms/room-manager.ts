import { Room } from './room.js';
import { generateRoomCode } from './code-generator.js';

const MAX_ROOMS = 100;
const ROOM_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRoomMap: Map<string, string> = new Map(); // playerId -> roomCode
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup stale rooms every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupStaleRooms(), 5 * 60 * 1000);
  }

  createRoom(hostId: string, hostName: string): Room {
    if (this.rooms.size >= MAX_ROOMS) {
      throw new Error('Maximum room limit reached');
    }

    // Remove player from any existing room first
    this.removePlayerFromCurrentRoom(hostId);

    let code: string;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts++;
      if (attempts > 100) throw new Error('Failed to generate unique room code');
    } while (this.rooms.has(code));

    const room = new Room(code, hostId, hostName);
    this.rooms.set(code, room);
    this.playerRoomMap.set(hostId, code);

    return room;
  }

  joinRoom(code: string, playerId: string, playerName: string): Room {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new Error('Room not found');

    // Remove player from any existing room first
    this.removePlayerFromCurrentRoom(playerId);

    room.addPlayer(playerId, playerName);
    this.playerRoomMap.set(playerId, code);

    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomForPlayer(playerId: string): Room | undefined {
    const code = this.playerRoomMap.get(playerId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  removePlayerFromCurrentRoom(playerId: string): void {
    const code = this.playerRoomMap.get(playerId);
    if (!code) return;

    const room = this.rooms.get(code);
    if (room) {
      room.removePlayer(playerId);
      if (room.isEmpty()) {
        room.destroy();
        this.rooms.delete(code);
      }
    }

    this.playerRoomMap.delete(playerId);
  }

  handlePlayerDisconnect(playerId: string, onTimeout: () => void): void {
    const room = this.getRoomForPlayer(playerId);
    if (!room) return;

    if (room.isGameInProgress()) {
      // Grace period during game
      room.markDisconnected(playerId, () => {
        onTimeout();
        this.removePlayerFromCurrentRoom(playerId);
      });
    } else {
      // Immediate removal in lobby
      this.removePlayerFromCurrentRoom(playerId);
    }
  }

  handlePlayerReconnect(playerId: string): Room | undefined {
    const room = this.getRoomForPlayer(playerId);
    if (!room) return undefined;

    room.markReconnected(playerId);
    return room;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.isEmpty()) {
        room.destroy();
        this.rooms.delete(code);
      } else if (!room.isGameInProgress() && now - room.createdAt > ROOM_IDLE_TIMEOUT_MS) {
        room.destroy();
        this.rooms.delete(code);
        // Clean up player mappings
        for (const [pid, rcode] of this.playerRoomMap) {
          if (rcode === code) this.playerRoomMap.delete(pid);
        }
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    for (const room of this.rooms.values()) {
      room.destroy();
    }
    this.rooms.clear();
    this.playerRoomMap.clear();
  }
}
