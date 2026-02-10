# System Architecture

This document explains the architectural decisions behind the Tien Len card game implementation, focusing on the why behind the structure and technology choices.

## Monorepo Structure

The project uses a monorepo organized into distinct packages and applications:

```
tien len/
├── packages/
│   ├── shared/        # Type definitions and constants
│   └── engine/        # Game logic and rules
└── apps/
    ├── web/          # Client application
    └── server/       # Game server
```

### Why a Monorepo?

This structure was chosen to enforce clear separation of concerns while maintaining tight integration:

**Shared Package** (`packages/shared`)
- Contains type definitions, constants, and Zod schemas used by both client and server
- Acts as the single source of truth for data structures and socket event contracts
- Enables type safety across the entire stack without code duplication
- Changes to types or events immediately propagate to all consumers

**Engine Package** (`packages/engine`)
- Pure game logic with zero dependencies on UI or networking
- Can be tested in isolation without spinning up servers or browsers
- Potentially reusable for different clients (CLI, mobile, AI training)
- Deterministic behavior makes testing straightforward

**Server Application** (`apps/server`)
- Handles networking, authentication, room management, and state synchronization
- Orchestrates the engine but never reimplements game rules
- The only place where game state mutations occur

**Web Application** (`apps/web`)
- Purely presentational layer that renders state and captures user input
- Never makes game decisions or validates moves locally
- Trusts the server completely

The monorepo eliminates version skew between packages. When the engine changes a rule, TypeScript immediately flags every affected file in the server and client. This prevents the common distributed systems problem where different services deploy incompatible versions.

## Server-Authoritative Model

The fundamental architectural principle: **never trust the client**.

### Why Server Authority?

In any multiplayer game, clients cannot be trusted because:

1. **Cheating Prevention**: A client could be modified to see opponent hands, play invalid moves, or manipulate game state
2. **State Consistency**: Multiple clients need a single source of truth to stay synchronized
3. **Fairness**: All players must play by identical rules enforced in one place

### How It Works

The server is the sole authority for game state:

```typescript
// Client sends intent
socket.emit('play_cards', { cardIds: ['3s', '4s', '5s'] });

// Server validates and executes
const events = game.playCards(playerId, cardIds);  // May throw

// Server broadcasts result to all
io.to(roomCode).emit('game_state_updated', ...);
```

Every game action follows this pattern:
1. Client expresses intent via socket event
2. Server validates the action (correct turn, valid cards, legal play)
3. Engine executes the action or rejects with error
4. Server broadcasts the new state to all connected clients
5. Clients render what the server tells them

The client never decides if a move is legal. It can provide UI hints (highlight playable cards) for better UX, but the server always has the final say.

### State Redaction

The server maintains complete game state (all hands, deck composition) but clients receive filtered views:

```typescript
getStateForPlayer(playerId: string): ClientGameState {
  return {
    // Your cards only
    myHand: this.state.hands.get(playerId),

    // Opponent metadata (not their actual cards)
    players: this.state.playerIds.map(id => ({
      handSize: this.state.hands.get(id).length,  // Count only
      isActive: ...,
      hasPassed: ...,
    })),

    // Public information
    currentCombination: ...,
    turnHistory: ...,
  };
}
```

This function is critical for security. It ensures:
- Players only see their own cards
- Opponent hand contents never leave the server
- Public information (current play, turn history) is shared
- Each player gets a view tailored to what they should know

If `getStateForPlayer` accidentally included opponent hands in the returned object, clients could inspect network traffic to see hidden cards. The redaction must happen server-side before serialization.

## Data Flow

The complete flow for a typical game action:

1. **User Interaction** → User clicks cards in the web UI
2. **Client Validation** → Optional UI validation (prevent obviously wrong actions)
3. **Socket Event** → `socket.emit('play_cards', { cardIds })` sent to server
4. **Schema Validation** → Zod schema validates event structure
5. **Rate Limiting** → Token bucket checks if action is within limits
6. **Server Handler** → Extracts room and player context
7. **Engine Execution** → `game.playCards(playerId, cardIds)` validates and executes
8. **Event Generation** → Engine returns array of game events
9. **Broadcast** → Server sends updated state to all players in room
10. **Client Update** → All connected clients receive new state and re-render

This flow ensures the server validates everything before state changes. The client is fundamentally a "dumb terminal" that displays state and collects input.

### Why This Flow?

**Separation of Concerns**: The engine knows game rules, the server knows networking, the client knows presentation. None overstep.

**Auditability**: Every state change comes from an engine method. Logs capture the complete event history.

**Testing**: The engine can be tested with simple function calls. The server can be tested with mock sockets. The client can be tested with mock state.

**Latency Handling**: The client can optimistically update UI (show cards moving) but must revert if the server rejects. The server state is always correct.

## Technology Choices

### TypeScript Everywhere

TypeScript enables:
- Compile-time verification that client and server agree on data structures
- IDE autocomplete for socket events and game state
- Refactoring with confidence (rename a field, see every usage)
- Self-documenting code (types serve as always-up-to-date contracts)

Shared types eliminate an entire class of bugs where client expects `handSize` but server sends `cardCount`.

### Socket.io for Real-Time Communication

WebSockets provide bidirectional, event-driven communication needed for a real-time multiplayer game:

- **Low Latency**: Cards played by one client appear on other clients within milliseconds
- **Event-Driven**: Game events map naturally to socket events
- **Automatic Reconnection**: Socket.io handles reconnection when networks flicker
- **Room Support**: Built-in concept of rooms for grouping players

The server configures WebSocket-only transport (no HTTP long-polling fallback) because the game requires persistent connections anyway.

### Zod for Runtime Validation

TypeScript types vanish at runtime. Zod provides runtime validation:

```typescript
export const PlayCardsSchema = z.object({
  cardIds: z.array(CardIdSchema).min(1).max(13),
});

// At runtime
const result = PlayCardsSchema.safeParse(data);
if (!result.success) {
  // Reject invalid data before it reaches game logic
}
```

This protects against malicious or buggy clients sending malformed data. Every socket event is validated against a schema before processing.

### Pure Game Engine

The engine is written as a pure TypeScript class with no I/O:
- No network calls
- No database queries
- No file system access
- No randomness except controlled RNG

This makes it:
- Deterministic (same inputs always produce same outputs)
- Easily testable (no mocks needed)
- Portable (can run in any JS environment)
- Fast (pure computation, no I/O waits)

The engine exposes a simple API:
```typescript
game.start() → GameEvent[]
game.playCards(playerId, cardIds) → GameEvent[]
game.pass(playerId) → GameEvent[]
game.getStateForPlayer(playerId) → ClientGameState
```

The server is responsible for persisting state, handling disconnections, and broadcasting. The engine just applies rules to game state.

### Turborepo for Build Orchestration

Turborepo manages the monorepo:
- Caches build outputs (rebuild only what changed)
- Runs tasks in dependency order (build shared before server)
- Parallelizes independent tasks (test engine and web simultaneously)
- Provides consistent commands (`turbo dev`, `turbo build`)

This makes the monorepo feel like a single cohesive project rather than juggling multiple package.json scripts.

## Conclusion

The architecture prioritizes:
1. **Security** through server authority and state redaction
2. **Correctness** through type safety and validation
3. **Maintainability** through clear separation of concerns
4. **Performance** through efficient data flow and caching

Every architectural decision stems from "never trust the client" as the foundational principle. The server validates, the engine executes, the client renders. This makes the system secure, testable, and reliable.
