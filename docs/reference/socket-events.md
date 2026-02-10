# Socket Events Reference

This document specifies all WebSocket events used for real-time communication between client and server.

## Event Naming Convention

Events use namespaced naming: `namespace:action`

- `room:*`: Room management events
- `game:*`: Game action and state events
- `chat:*`: Chat messaging events
- `player:*`: Player connection status events

## Client to Server Events

Events sent from client to server. All events include a callback function for synchronous response.

### room:create

Creates a new game room.

**Payload:**

```typescript
{
  playerName: string;              // 1-20 characters, trimmed
  settings: Partial<GameSettings>; // Optional game settings
}
```

**Settings Schema:**

```typescript
{
  maxPlayers?: number;                    // 2-8, default: 4
  instantWins?: {
    dragon?: boolean;                     // default: true
    fourTwos?: boolean;                   // default: true
    sixPairs?: boolean;                   // default: true
  };
  turnTimeoutSeconds?: number;            // 10-120, default: 30
  winnerLeads?: boolean;                  // default: true
}
```

**Callback Response:**

```typescript
{
  success: boolean;
  code?: string;      // 6-character room code (if success)
  error?: string;     // Error message (if failure)
}
```

**Example:**

```typescript
socket.emit('room:create', {
  playerName: 'Alice',
  settings: { maxPlayers: 4 }
}, (response) => {
  if (response.success) {
    console.log('Room created:', response.code);
  }
});
```

### room:join

Joins an existing room.

**Payload:**

```typescript
{
  code: string;        // 6-character room code (A-Z, 2-9, excluding I,O,L,0,1)
  playerName: string;  // 1-20 characters, trimmed
}
```

**Callback Response:**

```typescript
{
  success: boolean;
  room?: RoomInfo;    // Full room state (if success)
  error?: string;     // Error message (if failure)
}
```

**Validation:**
- Room must exist
- Room must not be full
- Room must not have game in progress
- Player name must be unique in room

**Example:**

```typescript
socket.emit('room:join', {
  code: 'ABC123',
  playerName: 'Bob'
}, (response) => {
  if (response.success) {
    console.log('Joined room:', response.room);
  }
});
```

### room:leave

Leaves the current room.

**Payload:** None

**Callback Response:**

```typescript
{
  success: boolean;
}
```

**Side Effects:**
- If player is host and others remain, host transfers to next player
- If player is last in room, room is deleted
- If game is in progress, player's cards are discarded and they auto-pass all turns

**Example:**

```typescript
socket.emit('room:leave', (response) => {
  console.log('Left room');
});
```

### room:ready

Toggles the player's ready status.

**Payload:** None

**Callback Response:**

```typescript
{
  success: boolean;
}
```

**Notes:**
- Host cannot toggle ready status
- Ready status is broadcast to all room members via `room:player_ready`

**Example:**

```typescript
socket.emit('room:ready', (response) => {
  console.log('Ready status toggled');
});
```

### room:start

Starts the game (host only).

**Payload:** None

**Callback Response:**

```typescript
{
  success: boolean;
  error?: string;     // Error message (if failure)
}
```

**Validation:**
- Caller must be host
- All non-host players must be ready
- At least 2 players required

**Side Effects:**
- Game begins immediately
- All players receive `game:state` with initial game state

**Example:**

```typescript
socket.emit('room:start', (response) => {
  if (response.success) {
    console.log('Game started');
  }
});
```

### room:kick

Kicks a player from the room (host only).

**Payload:**

```typescript
{
  playerId: string;   // 1-50 characters
}
```

**Callback Response:**

```typescript
{
  success: boolean;
  error?: string;     // Error message (if failure)
}
```

**Validation:**
- Caller must be host
- Cannot kick yourself
- Player must be in room

**Side Effects:**
- Kicked player receives `room:kicked` event
- Kicked player's socket is disconnected

**Example:**

```typescript
socket.emit('room:kick', {
  playerId: 'player-123'
}, (response) => {
  if (response.success) {
    console.log('Player kicked');
  }
});
```

### room:settings

Updates room settings (host only).

**Payload:**

```typescript
{
  settings: Partial<GameSettings>;  // Same schema as room:create
}
```

**Callback Response:**

```typescript
{
  success: boolean;
}
```

**Validation:**
- Caller must be host
- Cannot change settings while game is in progress

**Side Effects:**
- All players receive `room:settings_updated` event

**Example:**

```typescript
socket.emit('room:settings', {
  settings: {
    turnTimeoutSeconds: 45,
    instantWins: { dragon: false }
  }
}, (response) => {
  console.log('Settings updated');
});
```

### game:play

Plays cards from the player's hand.

**Payload:**

```typescript
{
  cardIds: string[];  // 1-13 card IDs, e.g., ["3s", "4s", "5s"]
}
```

**Card ID Format:** Rank followed by suit initial
- Ranks: `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `J`, `Q`, `K`, `A`, `2`
- Suits: `s` (spades), `c` (clubs), `d` (diamonds), `h` (hearts)
- Examples: `3s`, `10h`, `Kd`, `2c`

**Callback Response:**

```typescript
{
  success: boolean;
  error?: string;     // Error message (if failure)
}
```

**Validation:**
- Must be player's turn
- Cards must exist in hand
- Cards must form valid combination
- Combination must beat current table (if any)
- First play of first game must include 3 of spades

**Side Effects:**
- All players receive `game:cards_played` event
- All players receive updated `game:state`
- Turn advances to next player

**Example:**

```typescript
socket.emit('game:play', {
  cardIds: ['5s', '5c']
}, (response) => {
  if (!response.success) {
    console.error(response.error);
  }
});
```

### game:pass

Passes the turn without playing cards.

**Payload:** None

**Callback Response:**

```typescript
{
  success: boolean;
  error?: string;     // Error message (if failure)
}
```

**Validation:**
- Must be player's turn
- Cannot pass when leading (no cards on table)

**Side Effects:**
- All players receive `game:player_passed` event
- All players receive updated `game:state`
- Turn advances to next player

**Example:**

```typescript
socket.emit('game:pass', (response) => {
  if (!response.success) {
    console.error(response.error);
  }
});
```

### game:rematch

Requests to start a new game in the same room.

**Payload:** None

**Callback Response:**

```typescript
{
  success: boolean;
}
```

**Notes:**
- Available after game ends
- Resets ready statuses
- Previous game winner becomes host if `winnerLeads` is true

**Example:**

```typescript
socket.emit('game:rematch', (response) => {
  console.log('Rematch requested');
});
```

### chat:message

Sends a chat message to all room members.

**Payload:**

```typescript
{
  message: string;    // 1-200 characters, trimmed
}
```

**Callback:** None (fire and forget)

**Side Effects:**
- All players in room receive `chat:message` event

**Example:**

```typescript
socket.emit('chat:message', {
  message: 'Good game!'
});
```

### room:reconnect

Reconnects to a room after disconnection.

**Payload:**

```typescript
{
  code: string;       // 6-character room code
  playerId: string;   // 1-50 characters
}
```

**Callback Response:**

```typescript
{
  success: boolean;
  error?: string;     // Error message (if failure)
}
```

**Validation:**
- Room must exist
- Player must be in room
- Player must have been disconnected

**Side Effects:**
- Player receives current `room:updated` and `game:state`
- All players receive `player:reconnected` event

**Example:**

```typescript
socket.emit('room:reconnect', {
  code: 'ABC123',
  playerId: 'player-123'
}, (response) => {
  if (response.success) {
    console.log('Reconnected successfully');
  }
});
```

## Server to Client Events

Events sent from server to client. No callback required.

### room:updated

Broadcasts updated room state to all room members.

**Payload:**

```typescript
{
  code: string;
  phase: 'waiting' | 'starting' | 'playing' | 'finished' | 'abandoned';
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  settings: GameSettings;
  createdAt: number;      // Unix timestamp
}
```

**RoomPlayer Schema:**

```typescript
{
  id: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
}
```

**Triggered By:**
- Player joins or leaves
- Host transfers
- Ready status changes
- Settings updated
- Game phase changes

**Example:**

```typescript
socket.on('room:updated', (room) => {
  console.log('Room updated:', room);
});
```

### room:player_joined

Notifies all room members when a new player joins.

**Payload:**

```typescript
{
  id: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
}
```

**Example:**

```typescript
socket.on('room:player_joined', (player) => {
  console.log(`${player.name} joined`);
});
```

### room:player_left

Notifies all room members when a player leaves.

**Payload:**

```typescript
{
  playerId: string;
}
```

**Example:**

```typescript
socket.on('room:player_left', (data) => {
  console.log(`Player ${data.playerId} left`);
});
```

### room:player_ready

Notifies all room members when a player toggles ready status.

**Payload:**

```typescript
{
  playerId: string;
  isReady: boolean;
}
```

**Example:**

```typescript
socket.on('room:player_ready', (data) => {
  console.log(`Player ${data.playerId} is ${data.isReady ? 'ready' : 'not ready'}`);
});
```

### room:kicked

Notifies a player they have been kicked from the room.

**Payload:**

```typescript
{
  reason: string;
}
```

**Notes:**
- Only sent to the kicked player
- Socket is disconnected immediately after

**Example:**

```typescript
socket.on('room:kicked', (data) => {
  alert(`You were kicked: ${data.reason}`);
});
```

### room:settings_updated

Notifies all room members when settings are updated.

**Payload:**

```typescript
GameSettings  // Full settings object
```

**Example:**

```typescript
socket.on('room:settings_updated', (settings) => {
  console.log('Settings updated:', settings);
});
```

### game:state

Sends complete game state to a player.

**Payload:**

```typescript
{
  phase: 'waiting' | 'dealing' | 'playing' | 'roundEnd' | 'gameEnd';
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
}
```

**PlayerState Schema:**

```typescript
{
  id: string;
  name: string;
  handSize: number;
  isActive: boolean;
  hasPassed: boolean;
  finishPosition: number | null;
}
```

**Triggered By:**
- Game starts
- Player reconnects
- Game state changes (after each play or pass)

**Notes:**
- State is redacted per player (only shows their own hand)
- Other players' hands are hidden; only hand sizes visible

**Example:**

```typescript
socket.on('game:state', (state) => {
  console.log('Current game state:', state);
});
```

### game:event

Sends individual game events to all players.

**Payload:**

```typescript
{
  type: 'game_started' | 'cards_dealt' | 'cards_played' | 'player_passed'
        | 'round_won' | 'player_finished' | 'game_over' | 'instant_win'
        | 'turn_changed';
  playerId?: string;
  data?: Record<string, unknown>;
}
```

**Example:**

```typescript
socket.on('game:event', (event) => {
  switch (event.type) {
    case 'game_started':
      console.log('Game has started');
      break;
    case 'turn_changed':
      console.log('Turn changed to:', event.playerId);
      break;
  }
});
```

### game:cards_played

Notifies all players when cards are played.

**Payload:**

```typescript
{
  playerId: string;
  cards: Card[];
  handSize: number;     // Remaining cards in player's hand
}
```

**Example:**

```typescript
socket.on('game:cards_played', (data) => {
  console.log(`${data.playerId} played ${data.cards.length} cards`);
});
```

### game:player_passed

Notifies all players when a player passes.

**Payload:**

```typescript
{
  playerId: string;
}
```

**Example:**

```typescript
socket.on('game:player_passed', (data) => {
  console.log(`${data.playerId} passed`);
});
```

### game:round_won

Notifies all players when a round is won.

**Payload:**

```typescript
{
  playerId: string;     // Winner of the round
}
```

**Notes:**
- Round ends when all other active players have passed
- Winner leads the next round

**Example:**

```typescript
socket.on('game:round_won', (data) => {
  console.log(`${data.playerId} won the round`);
});
```

### game:player_finished

Notifies all players when a player runs out of cards.

**Payload:**

```typescript
{
  playerId: string;
  position: number;     // Finish position (1 = winner, 2 = second, etc.)
}
```

**Example:**

```typescript
socket.on('game:player_finished', (data) => {
  console.log(`${data.playerId} finished in position ${data.position}`);
});
```

### game:over

Notifies all players when the game ends.

**Payload:**

```typescript
{
  finishOrder: string[];    // Array of player IDs in finish order
}
```

**Notes:**
- First element is winner, last is loser
- Game ends when only 0-1 active players remain

**Example:**

```typescript
socket.on('game:over', (data) => {
  console.log('Game over. Winner:', data.finishOrder[0]);
});
```

### game:instant_win

Notifies all players when an instant win occurs.

**Payload:**

```typescript
{
  playerId: string;
  type: 'dragon' | 'fourTwos' | 'sixPairs';
  cards: Card[];
}
```

**Instant Win Types:**
- `dragon`: 13-card straight (one card of each rank)
- `fourTwos`: All four 2s
- `sixPairs`: 6 or more pairs

**Example:**

```typescript
socket.on('game:instant_win', (data) => {
  console.log(`${data.playerId} got instant win: ${data.type}`);
});
```

### chat:message

Broadcasts a chat message to all room members.

**Payload:**

```typescript
{
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;        // Unix timestamp in milliseconds
}
```

**Example:**

```typescript
socket.on('chat:message', (data) => {
  console.log(`[${data.playerName}]: ${data.message}`);
});
```

### player:disconnected

Notifies all players when a player disconnects.

**Payload:**

```typescript
{
  playerId: string;
  reconnectDeadline: number;    // Unix timestamp when player will be removed
}
```

**Notes:**
- Disconnected players have a grace period to reconnect
- If game is in progress, disconnected player auto-passes turns

**Example:**

```typescript
socket.on('player:disconnected', (data) => {
  const timeRemaining = data.reconnectDeadline - Date.now();
  console.log(`Player ${data.playerId} disconnected. ${timeRemaining}ms to reconnect.`);
});
```

### player:reconnected

Notifies all players when a player reconnects.

**Payload:**

```typescript
{
  playerId: string;
}
```

**Example:**

```typescript
socket.on('player:reconnected', (data) => {
  console.log(`Player ${data.playerId} reconnected`);
});
```

### error

Sends an error message to a specific client.

**Payload:**

```typescript
{
  message: string;
}
```

**Triggered By:**
- Invalid event payload
- Authorization failures
- Server errors

**Example:**

```typescript
socket.on('error', (data) => {
  console.error('Error:', data.message);
});
```

## Connection Lifecycle

1. Client connects to server via Socket.IO
2. Client authenticates (if required)
3. Client creates or joins room
4. Client receives `room:updated` with full room state
5. When host starts game, all clients receive `game:state`
6. During gameplay, clients receive continuous state updates
7. If client disconnects, server holds state for reconnection period
8. Client can reconnect using `room:reconnect` event
9. On intentional leave, client sends `room:leave`
10. Socket disconnects

## Error Handling

All client-to-server events with callbacks should check `response.success`:

```typescript
socket.emit('game:play', { cardIds: ['3s'] }, (response) => {
  if (!response.success) {
    // Handle error
    console.error(response.error);
    return;
  }
  // Handle success
});
```

Server-to-client `error` events should be handled globally:

```typescript
socket.on('error', (data) => {
  showErrorNotification(data.message);
});
```
