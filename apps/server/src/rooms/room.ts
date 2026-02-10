import { TienLenGame, SimpleAI } from '@tienlen/engine';
import type { GameSettings, ClientGameState, RoomState, RoomPlayer } from '@tienlen/shared';
import { DEFAULT_GAME_SETTINGS } from '@tienlen/shared';

const DISCONNECT_GRACE_MS = 30_000;

export class Room {
  readonly code: string;
  readonly hostId: string;
  readonly createdAt: number;

  private players: Map<string, RoomPlayer> = new Map();
  private game: TienLenGame | null = null;
  private settings: GameSettings;
  private isFirstGame = true;
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(code: string, hostId: string, hostName: string) {
    this.code = code;
    this.hostId = hostId;
    this.createdAt = Date.now();
    this.settings = { ...DEFAULT_GAME_SETTINGS };
    this.players.set(hostId, {
      id: hostId,
      name: hostName,
      isHost: true,
      isReady: false,
      isConnected: true,
    });
  }

  // --- Player management ---

  addPlayer(id: string, name: string): void {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error('Room is full');
    }
    if (this.game) {
      throw new Error('Game already in progress');
    }
    this.players.set(id, {
      id,
      name,
      isHost: false,
      isReady: false,
      isConnected: true,
    });
  }

  removePlayer(id: string): void {
    this.clearDisconnectTimer(id);
    this.players.delete(id);
  }

  markDisconnected(id: string, onTimeout: () => void): void {
    const player = this.players.get(id);
    if (!player) return;

    player.isConnected = false;
    this.clearDisconnectTimer(id);

    const timer = setTimeout(() => {
      onTimeout();
    }, DISCONNECT_GRACE_MS);
    this.disconnectTimers.set(id, timer);
  }

  markReconnected(id: string): boolean {
    const player = this.players.get(id);
    if (!player) return false;

    player.isConnected = true;
    this.clearDisconnectTimer(id);
    return true;
  }

  setReady(id: string, ready: boolean): void {
    const player = this.players.get(id);
    if (player) player.isReady = ready;
  }

  kickPlayer(id: string): void {
    if (id === this.hostId) throw new Error('Cannot kick the host');
    this.removePlayer(id);
  }

  hasPlayer(id: string): boolean {
    return this.players.has(id);
  }

  getPlayer(id: string): RoomPlayer | undefined {
    return this.players.get(id);
  }

  getPlayerIds(): string[] {
    return [...this.players.keys()];
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  // --- Settings ---

  updateSettings(updates: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...updates };
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  // --- Game lifecycle ---

  canStart(): boolean {
    if (this.game) return false;
    if (this.players.size < 2) return false;
    // All non-host players must be ready
    for (const [id, player] of this.players) {
      if (id !== this.hostId && !player.isReady) return false;
    }
    return true;
  }

  startGame(): void {
    if (!this.canStart()) throw new Error('Cannot start game');

    const playerIds = [...this.players.keys()];
    const playerNames = new Map(
      [...this.players.entries()].map(([id, p]) => [id, p.name]),
    );

    this.game = new TienLenGame(playerIds, playerNames, this.settings, this.isFirstGame);
    this.game.start();
    this.isFirstGame = false;
  }

  getGameStateForPlayer(playerId: string): ClientGameState | null {
    return this.game?.getStateForPlayer(playerId) ?? null;
  }

  playCards(playerId: string, cardIds: string[]): void {
    if (!this.game) throw new Error('No game in progress');
    this.game.playCards(playerId, cardIds);
  }

  pass(playerId: string): void {
    if (!this.game) throw new Error('No game in progress');
    this.game.pass(playerId);
  }

  isGameOver(): boolean {
    return this.game?.getPhase() === 'gameEnd';
  }

  isGameInProgress(): boolean {
    return this.game !== null && this.game.getPhase() === 'playing';
  }

  endGame(): void {
    this.game = null;
    // Reset ready states
    for (const player of this.players.values()) {
      player.isReady = false;
    }
  }

  // --- State ---

  getState(): RoomState {
    return {
      code: this.code,
      hostId: this.hostId,
      players: [...this.players.values()],
      settings: { ...this.settings },
      isGameInProgress: this.isGameInProgress(),
    };
  }

  // --- Private ---

  private clearDisconnectTimer(id: string): void {
    const timer = this.disconnectTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(id);
    }
  }

  destroy(): void {
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectTimers.clear();
  }
}
