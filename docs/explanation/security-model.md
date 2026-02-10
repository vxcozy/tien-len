# Security Model

This document explains the security architecture and threat model for the Tien Len multiplayer game server.

## Core Security Principle

**The server is the single source of truth. Clients are untrusted.**

Every security decision flows from this principle. We assume clients can be modified, network traffic can be inspected, and players may attempt to cheat. The server must validate everything before allowing state changes.

## Server-Authoritative Validation

### Why Server Authority?

Multiplayer games face unique security challenges:

1. **Client Modification**: A player could modify the web application to send illegal moves or see hidden information
2. **Network Inspection**: Players could intercept WebSocket traffic to read opponent cards if the server broadcasts them
3. **Replay Attacks**: Without proper validation, a player could replay old moves or inject moves out of order
4. **Race Conditions**: Multiple clients could send moves simultaneously

Server authority addresses all of these. The client is purely an interface for displaying state and collecting input. It never decides what is legal or what happens next.

### How It Works

Every game action follows this validation chain:

```typescript
// 1. Client sends intent
socket.emit('play_cards', { cardIds: ['3s', '4s', '5s'] });

// 2. Server validates player identity (JWT auth)
const userId = socket.data.userId;

// 3. Server validates it's the player's turn
if (game.getCurrentPlayerId() !== userId) {
  throw new Error('Not your turn');
}

// 4. Server validates cards exist in player's hand
const hand = game.hands.get(userId);
const cards = findCardsInHand(hand, cardIds);

// 5. Server validates combination is legal
const combination = detectCombination(cards);
if (!combination) {
  throw new Error('Invalid combination');
}

// 6. Server validates play beats current table
if (!canBeat(combination, game.currentCombination)) {
  throw new Error('Cannot beat current play');
}

// 7. Only if all validations pass: execute
game.playCards(userId, cardIds);
```

At every step, the server checks preconditions. If any check fails, the move is rejected before state changes. The client never gets to "try" an illegal move and see what happens.

### Validation Layers

**Authentication Layer**: JWT tokens ensure the socket connection belongs to a legitimate user. Without a valid token, you cannot connect.

**Authorization Layer**: Even authenticated, you can only act on your own behalf. You cannot play cards from another player's hand or skip someone else's turn.

**Game Rules Layer**: The engine validates move legality using pure game logic. The server trusts the engine completely because it is deterministic and tested.

**State Consistency Layer**: The engine maintains internal invariants (active player list, finish order, hand sizes) that the server never manipulates directly.

This layered defense ensures that even if one layer has a bug, others catch issues.

## Per-Player State Redaction

### The Problem

The server knows all hands. If it broadcasts complete game state to all clients:

```typescript
// WRONG - broadcasts opponent hands
io.to(roomCode).emit('game_state', {
  hands: {
    'player1': ['3s', '4s', '5s', ...],
    'player2': ['7h', '8h', '9h', ...],
    'player3': ['Jc', 'Qc', 'Kc', ...],
  }
});
```

A player could open browser DevTools, inspect WebSocket messages, and see opponent cards in the JSON payload. The game is compromised.

### The Solution

The server sends each player a redacted view containing only information they should have:

```typescript
// Correct - filter per player
function getStateForPlayer(playerId: string): ClientGameState {
  return {
    // Your cards in full detail
    myHand: this.state.hands.get(playerId),

    // Opponent metadata only (not card details)
    players: this.state.playerIds.map(id => ({
      id,
      name: this.state.playerNames.get(id),
      handSize: this.state.hands.get(id).length,  // Count, not contents
      isActive: this.state.activePlayers.includes(id),
      hasPassed: this.state.passedPlayerIds.has(id),
    })),

    // Public information everyone can see
    currentCombination: this.state.currentCombination,
    lastPlayedBy: this.state.lastPlayedBy,
    turnHistory: this.state.turnHistory,
  };
}

// Send personalized state to each player
for (const playerId of playerIds) {
  const state = game.getStateForPlayer(playerId);
  io.to(getSocketId(playerId)).emit('game_state_updated', state);
}
```

Key aspects:

- **Opponent hands never serialize**: The `hands` map stays on the server. Only hand sizes (counts) are shared.
- **Your hand is complete**: You need to see your own cards to play.
- **Public information is shared**: Everyone sees what's on the table, turn history, and who passed.

This redaction happens before JSON serialization, so opponent cards never enter the network stream. Even if a player intercepts WebSocket traffic, they only see their own cards.

### Why This Is Critical

Redaction must happen server-side. A common mistake is sending full state and relying on client code to "not display" opponent cards. This fails because:

1. The data is in the network payload (inspectable in DevTools)
2. Client code can be modified to display hidden data
3. Browser extensions could extract data
4. Network proxies could read unencrypted WebSockets

The data must not leave the server. Once it is transmitted, you cannot control who sees it.

## Schema Validation with Zod

### Runtime Type Safety

TypeScript types are compile-time only. At runtime, JavaScript has no built-in validation. A malicious client could send:

```javascript
socket.emit('play_cards', {
  cardIds: "not an array",  // Wrong type
});

socket.emit('play_cards', {
  cardIds: ['X999', 'INVALID', '###'],  // Invalid card IDs
});

socket.emit('play_cards', {
  cardIds: [/* 50 cards */],  // More cards than possible
});
```

Without validation, these propagate into game logic and cause crashes or exploits.

### Zod Schemas

Every socket event has a Zod schema defining expected structure:

```typescript
export const PlayCardsSchema = z.object({
  cardIds: z.array(CardIdSchema).min(1).max(13),
});

const CardIdSchema = z.string().regex(
  /^(10|[2-9]|J|Q|K|A)[schd]$/,
  'Invalid card ID format'
);
```

The server validates all input:

```typescript
socket.on('play_cards', (data) => {
  const result = PlayCardsSchema.safeParse(data);

  if (!result.success) {
    socket.emit('error', { message: 'Invalid request format' });
    return;
  }

  // Now `result.data` is guaranteed to match schema
  const { cardIds } = result.data;
  // ... proceed with validated data
});
```

If validation fails, the request is rejected before touching game logic. The schema enforces:

- **Type correctness**: `cardIds` must be an array of strings
- **Format correctness**: Each string must match card ID format (rank + suit)
- **Length bounds**: Between 1 and 13 cards (hand size limit)

This prevents injection attacks, type confusion bugs, and malformed data from reaching the engine.

### Schema Benefits

- **Fail Fast**: Bad data is rejected at the boundary, not deep in game logic
- **Clear Errors**: Zod provides descriptive error messages for debugging
- **Documentation**: Schemas serve as machine-readable API contracts
- **Consistency**: Same validation logic for all events, no ad-hoc checks

## Rate Limiting

### The Threat

Without rate limits, a malicious player could:

- **Spam actions**: Send thousands of move requests per second, degrading server performance
- **Brute force room codes**: Try all possible 6-character codes to find active rooms
- **Chat flood**: Send messages rapidly to disrupt the game
- **DoS attack**: Overwhelm the server with connection attempts

Rate limiting constrains how often each client can perform actions.

### Token Bucket Algorithm

The server uses token bucket rate limiters:

```typescript
class RateLimiter {
  private buckets: Map<string, { tokens: number, lastRefill: number }>;

  consume(key: string, cost = 1): boolean {
    const bucket = this.getBucket(key);

    // Refill tokens based on elapsed time
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate);

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;  // Action allowed
    }

    return false;  // Rate limited
  }
}
```

Each player has a "bucket" of tokens. Actions consume tokens. Tokens refill over time at a fixed rate. If your bucket is empty, your action is denied.

### Rate Limit Configuration

Three separate limiters for different action types:

**Game Actions** (5 tokens, refill 5/sec):
- Playing cards, passing, starting game
- 5 actions per second is far more than a human needs, but prevents spam
- Burst allowance: you can queue 5 actions instantly, then must wait

**Chat Messages** (3 tokens, refill 0.6/sec):
- Sending chat messages
- 3 messages per 5 seconds (0.6/sec refill rate)
- Prevents chat flooding while allowing normal conversation

**Room Join Attempts** (5 tokens, refill 0.2/sec):
- Creating rooms, joining rooms
- 5 attempts per 25 seconds (0.2/sec refill rate)
- Prevents brute-forcing room codes by limiting guesses

### Why Token Bucket?

The token bucket algorithm allows bursts while enforcing long-term limits:

- **Burst Friendly**: A player can make 5 moves quickly (playing multiple combinations in succession)
- **Sustained Limits**: Over time, cannot exceed average rate (5/sec for game actions)
- **Fair**: Everyone gets the same bucket, no unfair advantage
- **Simple**: Efficient to implement and reason about

Alternative approaches like fixed windows (max 10/minute) don't handle bursts well. A player might need to make 5 moves in 2 seconds during intense play. Token bucket allows this while still limiting abuse.

## JWT Authentication

### Why JWT?

The server needs to:
1. Identify which player a socket connection belongs to
2. Prevent impersonation (one player pretending to be another)
3. Avoid maintaining server-side session storage (stateless authentication)

JWTs (JSON Web Tokens) provide stateless authentication. The token itself contains identity claims, cryptographically signed by the server.

### How It Works

**Token Generation** (happens outside the game server, e.g., in an auth service):

```typescript
const payload = {
  userId: 'unique-player-id',
  name: 'PlayerName',
};

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('24h')
  .sign(secret);
```

**Client Stores Token**: The client receives the token and stores it (in memory, not localStorage to avoid XSS).

**Authentication on Connect**:

```typescript
// Client sends token in handshake
const socket = io('ws://server', {
  auth: { token: userToken }
});

// Server middleware verifies token
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  try {
    const { payload } = await jwtVerify(token, secret);
    socket.data.userId = payload.userId;
    socket.data.name = payload.name;
    next();  // Allow connection
  } catch {
    next(new Error('Invalid token'));  // Reject connection
  }
});
```

If the token is invalid (expired, wrong signature, tampered), the connection is rejected before any game logic runs.

### JWT Security Properties

- **Tamper-Proof**: The signature ensures payload cannot be modified without invalidating the token
- **Expiration**: Tokens expire after 24 hours, limiting damage if one leaks
- **Stateless**: The server doesn't store sessions, reducing memory and complexity
- **Identity Binding**: Once verified, every socket event is tied to a specific user ID

### What JWT Does Not Protect

JWTs authenticate but don't encrypt. A JWT is visible to anyone who intercepts it. This is acceptable because:

- The token doesn't contain sensitive data (just user ID and name)
- The token expires relatively quickly
- Production deployments use WSS (WebSocket over TLS) to encrypt all traffic

In a production environment, JWTs should be transmitted only over encrypted connections (HTTPS for HTTP requests, WSS for WebSockets).

## CORS and Origin Whitelist

### The Threat

Without CORS restrictions, any website could make requests to the game server. A malicious site could:

```html
<!-- Evil site at https://evil.com -->
<script>
  const socket = io('ws://tienlengame.com');
  // Can now interact with game server as if from legitimate client
</script>
```

If the server accepts connections from any origin, attackers can build phishing sites that connect to the real game server, misleading users.

### CORS Configuration

The server restricts which origins can connect:

```typescript
const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
  },
});
```

`CORS_ORIGIN` is an environment variable listing allowed origins:

```
CORS_ORIGIN=http://localhost:3000,https://tienlengame.com
```

When a client connects, the browser sends an `Origin` header. The server checks if it is in the whitelist. If not, the connection is rejected.

### Why This Matters

- **Phishing Prevention**: Users know the legitimate domain. If they connect via another domain, something is wrong.
- **Branding Protection**: Prevents others from embedding your game in their sites without permission.
- **Traffic Control**: You control which clients can connect, preventing unauthorized frontends.

CORS is enforced by browsers. It does not protect against non-browser clients (like scripts), but combined with JWT authentication, unauthorized access is prevented.

## XSS Prevention via Sanitization

### The Threat

Players can input text (names, chat messages). Without sanitization:

```typescript
// Malicious player name
const name = "<script>alert('XSS')</script>";

// If rendered directly in client HTML
<div>Player: {name}</div>
// Results in script execution in other players' browsers
```

This is Cross-Site Scripting (XSS): injecting scripts that execute in other users' contexts.

### Sanitization

All user input is sanitized before storage or broadcast:

```typescript
export function sanitizeString(input: string, maxLength = 100): string {
  return input
    .replace(/<[^>]*>/g, '')      // Remove HTML tags
    .replace(/[<>"'&]/g, '')       // Remove dangerous characters
    .trim()
    .slice(0, maxLength);
}
```

This removes:
- HTML tags (`<script>`, `<img>`, etc.)
- Dangerous characters that could break out of HTML contexts

Applied to all text fields:

```typescript
const sanitizedName = sanitizeName(playerName);  // Max 20 chars
const sanitizedMessage = sanitizeString(chatMessage, 200);  // Max 200 chars
```

### Defense in Depth

Sanitization is server-side (client rendering cannot be trusted). Additional protections:

- **Content Security Policy**: The client sets CSP headers to disallow inline scripts
- **React's Built-In Escaping**: The frontend uses React, which escapes content by default when rendering

Even if sanitization has a bug, React's escaping provides a backup layer.

## Room Code Brute-Force Prevention

### The Threat

Rooms are identified by 6-character codes (e.g., "AB3G7N"). A malicious actor could:

```javascript
// Attempt to join random room codes
for (let i = 0; i < 1000000; i++) {
  socket.emit('join_room', { code: randomCode() });
}
```

With enough attempts, they find active rooms and join games uninvited.

### Protection Mechanisms

**Rate Limiting**: The join action uses the slowest rate limiter (5 attempts per 25 seconds). At this rate:

- 5 guesses initially
- Then 0.2 guesses/second = 12 guesses/minute
- 720 guesses/hour

With a 36-character alphabet (A-H, J-N, P-Z, 2-9, excluding confusing characters like I, O, 0, 1), there are 36^6 = 2.1 billion possible codes. At 720 guesses/hour, brute-forcing would take 333,000 hours (38 years).

**Code Entropy**: Room codes are generated cryptographically:

```typescript
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 33 chars (no I,O,0,1)

function generateRoomCode(): string {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes)
    .map(b => alphabet[b % alphabet.length])
    .join('');
}
```

Using `crypto.randomBytes` ensures unpredictable codes (not sequential or guessable).

**Room Lifetime**: Rooms are deleted after 30 minutes of inactivity. This limits the window for brute-force attacks.

**No Room Listing**: The server does not provide an API to list all active rooms. You must know the exact code.

Combined, these make brute-forcing infeasible. An attacker would need to guess codes faster than they expire, which rate limiting prevents.

## Disconnect Grace Period

### The Problem

Network connections are unreliable. A player's Wi-Fi might drop for 5 seconds. Without handling, they would be kicked from the game immediately, frustrating users and disrupting games.

### Grace Period Mechanism

When a player disconnects during a game, the server:

1. Marks the player as disconnected (not removed)
2. Broadcasts disconnection to other players
3. Starts a 30-second timer
4. Pauses the game if it's the disconnected player's turn

If the player reconnects within 30 seconds:

```typescript
function handlePlayerReconnect(playerId: string): Room | undefined {
  const room = this.getRoomForPlayer(playerId);
  if (room) {
    room.clearDisconnectTimer(playerId);
    room.markReconnected(playerId);
    // Send current game state to player
    socket.emit('game_state_updated', room.getGameStateForPlayer(playerId));
  }
  return room;
}
```

The timer is cleared, the player is marked as active, and the game resumes.

If 30 seconds elapse without reconnection:

```typescript
function handlePlayerDisconnect(playerId: string, onTimeout: () => void) {
  const room = this.getRoomForPlayer(playerId);

  if (room && room.isGameInProgress()) {
    // Start grace period
    room.markDisconnected(playerId, () => {
      onTimeout();
      this.removePlayerFromCurrentRoom(playerId);
      io.to(room.code).emit('player_disconnected_timeout', { playerId });
    });
  } else {
    // In lobby, remove immediately
    this.removePlayerFromCurrentRoom(playerId);
  }
}
```

The player is removed, and the game either continues without them (if enough players remain) or ends.

### Why 30 Seconds?

This duration balances:

- **User Experience**: Enough time to recover from brief network issues or browser crashes
- **Game Flow**: Not so long that other players wait excessively
- **Fairness**: Prevents abuse (intentionally disconnecting to stall)

During the grace period, the game pauses if it's the disconnected player's turn. This prevents them from being auto-passed while offline.

### Lobby vs In-Game Behavior

In the lobby (before game starts), disconnects are immediate. There is no grace period because no game is in progress. A player can rejoin by entering the room code again.

Once the game starts, grace periods activate to protect ongoing matches.

## Conclusion

The security model creates multiple overlapping defenses:

1. **Server Authority**: Never trust the client
2. **State Redaction**: Never leak information that should be hidden
3. **Schema Validation**: Reject malformed input at the boundary
4. **Rate Limiting**: Prevent abuse through resource exhaustion
5. **JWT Authentication**: Verify identity cryptographically
6. **CORS Whitelist**: Control which origins can connect
7. **Input Sanitization**: Prevent injection attacks
8. **Brute-Force Prevention**: Make guessing impractical
9. **Graceful Disconnects**: Balance security with usability

Each layer addresses specific threats. Together, they make the system resilient against common attack vectors while maintaining a smooth user experience. Security is not an afterthought but a core architectural principle informing every design decision.
