'use client';

import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import type { RoomState, ClientGameState, Combination } from '@tienlen/shared';
import { detectCombination, isValidPlay } from '@tienlen/engine';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { getOrCreateToken } from '@/lib/auth';

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

interface MultiplayerStore {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;
  authToken: string | null;
  userId: string | null;
  userName: string | null;

  // Room state
  roomState: RoomState | null;
  roomCode: string | null;

  // Game state
  gameState: ClientGameState | null;
  selectedCardIds: Set<string>;

  // Chat
  chatMessages: ChatMessage[];

  // Errors
  error: string | null;

  // Actions - Auth
  connect: (name?: string) => Promise<void>;
  disconnect: () => void;

  // Actions - Room
  createRoom: () => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => void;
  requestRematch: () => void;

  // Actions - Game
  toggleCard: (cardId: string) => void;
  clearSelection: () => void;
  playSelected: () => void;
  pass: () => void;

  // Actions - Chat
  sendChat: (message: string) => void;

  // Derived
  isMyTurn: () => boolean;
  canPlaySelection: () => boolean;
  canPass: () => boolean;
  getSelectedCombination: () => Combination | null;

  // Errors
  clearError: () => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  socket: null,
  isConnected: false,
  authToken: null,
  userId: null,
  userName: null,
  roomState: null,
  roomCode: null,
  gameState: null,
  selectedCardIds: new Set(),
  chatMessages: [],
  error: null,

  connect: async (name?: string) => {
    try {
      const auth = await getOrCreateToken(name);
      const socket = getSocket(auth.token);

      set({
        socket,
        authToken: auth.token,
        userId: auth.userId,
        userName: auth.name,
      });

      socket.on('connect', () => {
        set({ isConnected: true, error: null });
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
      });

      socket.on('connect_error', (err) => {
        const msg = err.message?.toLowerCase() ?? '';
        if (msg.includes('websocket') || msg.includes('xhr') || msg.includes('transport')) {
          set({ error: 'Unable to reach the game server. Check your connection or try disabling ad blockers.' });
        } else {
          set({ error: `Connection error: ${err.message}` });
        }
      });

      // Room events
      socket.on('room_updated', (roomState: RoomState) => {
        set({ roomState });
      });

      socket.on('room_closed', () => {
        set({ roomState: null, roomCode: null, gameState: null });
      });

      socket.on('player_kicked', ({ playerId }: { playerId: string }) => {
        if (playerId === auth.userId) {
          set({ roomState: null, roomCode: null, gameState: null, error: 'You were kicked from the room' });
        }
      });

      // Game events
      socket.on('game_started', (state: ClientGameState) => {
        set({ gameState: state, selectedCardIds: new Set() });
      });

      socket.on('game_state_updated', (state: ClientGameState) => {
        set({ gameState: state, selectedCardIds: new Set() });
      });

      socket.on('game_ended', () => {
        // Game state already has final state from game_state_updated
      });

      // Chat
      socket.on('chat_message', (msg: ChatMessage) => {
        set(state => ({
          chatMessages: [...state.chatMessages.slice(-50), msg],
        }));
      });

      // Player events
      socket.on('player_disconnected', ({ playerId }: { playerId: string }) => {
        // Could show UI indicator
      });

      socket.on('player_reconnected', ({ playerId }: { playerId: string }) => {
        // Could clear UI indicator
      });

    } catch (err: any) {
      set({ error: err.message ?? 'Failed to connect' });
    }
  },

  disconnect: () => {
    disconnectSocket();
    set({
      socket: null,
      isConnected: false,
      roomState: null,
      roomCode: null,
      gameState: null,
      selectedCardIds: new Set(),
      chatMessages: [],
    });
  },

  createRoom: async () => {
    const { socket, userName } = get();
    if (!socket) return null;

    return new Promise((resolve) => {
      socket.emit('create_room', { playerName: userName }, (response: any) => {
        if (response.error) {
          set({ error: response.error });
          resolve(null);
        } else {
          set({ roomCode: response.code, roomState: response.room });
          resolve(response.code);
        }
      });
    });
  },

  joinRoom: async (code: string) => {
    const { socket, userName } = get();
    if (!socket) return false;

    return new Promise((resolve) => {
      socket.emit('join_room', { code: code.toUpperCase(), playerName: userName }, (response: any) => {
        if (response.error) {
          set({ error: response.error });
          resolve(false);
        } else {
          set({ roomCode: code.toUpperCase(), roomState: response.room });
          resolve(true);
        }
      });
    });
  },

  leaveRoom: () => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('leave_room', {}, () => {
      set({ roomState: null, roomCode: null, gameState: null, selectedCardIds: new Set(), chatMessages: [] });
    });
  },

  toggleReady: () => {
    const { socket } = get();
    socket?.emit('toggle_ready', {});
  },

  startGame: () => {
    const { socket } = get();
    socket?.emit('start_game', {}, (response: any) => {
      if (response?.error) set({ error: response.error });
    });
  },

  requestRematch: () => {
    const { socket } = get();
    socket?.emit('request_rematch', {}, (response: any) => {
      if (response?.error) set({ error: response.error });
    });
  },

  toggleCard: (cardId: string) => {
    set(state => {
      const newSet = new Set(state.selectedCardIds);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return { selectedCardIds: newSet };
    });
  },

  clearSelection: () => set({ selectedCardIds: new Set() }),

  playSelected: () => {
    const { socket, selectedCardIds } = get();
    if (!socket || selectedCardIds.size === 0) return;

    socket.emit('play_cards', { cardIds: [...selectedCardIds] }, (response: any) => {
      if (response?.error) {
        set({ error: response.error });
      } else {
        set({ selectedCardIds: new Set() });
      }
    });
  },

  pass: () => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('pass', {}, (response: any) => {
      if (response?.error) set({ error: response.error });
    });
  },

  sendChat: (message: string) => {
    const { socket } = get();
    socket?.emit('chat_message', { message });
  },

  isMyTurn: () => {
    const { gameState, userId } = get();
    if (!gameState || !userId) return false;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer?.id === userId;
  },

  canPlaySelection: () => {
    const { gameState, selectedCardIds } = get();
    if (!gameState || selectedCardIds.size === 0) return false;
    if (!get().isMyTurn()) return false;

    const cards = gameState.myHand.filter(c => selectedCardIds.has(c.id));
    const result = isValidPlay(cards, gameState.currentCombination);
    return result.valid;
  },

  canPass: () => {
    const { gameState } = get();
    if (!gameState) return false;
    if (!get().isMyTurn()) return false;
    return gameState.currentCombination !== null;
  },

  getSelectedCombination: () => {
    const { gameState, selectedCardIds } = get();
    if (!gameState) return null;
    const cards = gameState.myHand.filter(c => selectedCardIds.has(c.id));
    if (cards.length === 0) return null;
    return detectCombination(cards);
  },

  clearError: () => set({ error: null }),
}));
