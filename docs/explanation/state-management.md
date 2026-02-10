# State Management

This document explains how the Tien Len web client manages state, why the architecture uses two separate Zustand stores, and how data flows from the game engine through state management into React components.

## Why Zustand

The project uses [Zustand](https://github.com/pmndrs/zustand) rather than Redux or React Context for state management. Several properties of Zustand make it a natural fit.

**Minimal boilerplate.** A Zustand store is a single `create()` call that returns a hook. There are no providers, reducers, action creators, or middleware to configure. For a game with two distinct state domains (solo play and multiplayer), this means two small files rather than a sprawling Redux directory tree.

**Direct mutation style.** Zustand's `set()` function accepts a partial state object. Game actions like playing cards or passing a turn can update multiple fields in one call without writing immutable spread chains:

```ts
set({
  clientState: game.getStateForPlayer('human'),
  selectedCardIds: new Set(),
});
```

**No Context provider required.** React Context forces a provider component at the top of the tree, and any state change re-renders every consumer. Zustand stores live outside the React tree entirely. Components subscribe to specific slices of state, so a card selection change does not re-render the poker table or the game log.

**Readable derived state.** Zustand's `get()` function allows derived selectors to live alongside actions in the same store definition. Selectors like `canPlaySelection()` and `isMyTurn()` call `get()` to compute values on demand without memoization complexity.

## Two-Store Architecture

The client has two stores, each responsible for a different game mode:

| Store | File | Purpose |
|---|---|---|
| `useGameStore` | `stores/game-store.ts` | Single-player games against AI |
| `useMultiplayerStore` | `stores/multiplayer-store.ts` | Online rooms via Socket.io |

### Why two stores instead of one?

The two modes have fundamentally different state shapes and data flow patterns.

In single-player mode, the client owns a `TienLenGame` engine instance directly. The store calls engine methods like `game.playCards()` synchronously and reads back the new state immediately. There is no network, no latency, and no authentication.

In multiplayer mode, the client owns nothing. It sends intents to the server over a socket and receives authoritative state updates asynchronously. The store holds connection state, room state, authentication tokens, and chat messages -- none of which exist in single-player.

Merging these into a single store would create a tangle of conditional logic: "if multiplayer, emit a socket event; if solo, call the engine directly." Separating them keeps each store focused and easy to reason about.

### Shared interface surface

Despite their internal differences, both stores expose a nearly identical interface to UI components:

```ts
// Both stores provide these
toggleCard(cardId: string): void
clearSelection(): void
playSelected(): void
pass(): void
isMyTurn(): boolean
canPlaySelection(): boolean
canPass(): boolean
getSelectedCombination(): Combination | null
```

This means the game UI components (card fan, game controls, poker table) do not need to know which mode they are operating in. The page-level component picks the right store, extracts state and actions, and passes them down as props.

## State Flow: Single-Player

In single-player mode, the game engine runs entirely in the browser. The data flow is synchronous and self-contained.

```
User clicks card
    --> toggleCard() updates selectedCardIds in store
    --> Component re-renders with card highlighted

User clicks Play
    --> playSelected() calls game.playCards('human', cardIds)
    --> Engine validates and mutates internal state
    --> Store calls game.getStateForPlayer('human')
    --> clientState updates, selectedCardIds resets
    --> All subscribed components re-render

    --> setTimeout triggers processAITurns()
    --> AI computes and plays, store updates clientState
    --> Recursive setTimeout continues until human's turn
```

The key object in this flow is `ClientGameState`. The engine's `getStateForPlayer()` method returns a redacted view containing only what the player should see: their own hand, opponent hand sizes (not cards), the current combination on the table, and turn history. The store holds this as `clientState` and components read from it.

The `processAITurns` function deserves attention. After every human action, it checks whether the next player is an AI. If so, it creates a `SimpleAI` instance, asks it for a play, executes that play on the engine, updates the store, and schedules itself again with a random delay between 500 and 1200 milliseconds. This recursive `setTimeout` pattern creates a natural rhythm where AI players appear to "think" before acting.

```ts
function processAITurns(get, set) {
  const { game } = get();
  if (!game || game.getPhase() !== 'playing') return;
  if (game.getCurrentPlayerId() === 'human') {
    set({ clientState: game.getStateForPlayer('human') });
    return;  // Human's turn -- stop processing
  }

  // AI plays...
  set({ clientState: game.getStateForPlayer('human') });

  if (game.getCurrentPlayerId() !== 'human') {
    const delay = 500 + Math.random() * 700;
    setTimeout(() => processAITurns(get, set), delay);
  }
}
```

Each AI turn updates `clientState`, which triggers React re-renders. The user sees opponent card counts decrease, combinations appear in the play area, and the turn indicator move -- all driven by the same `clientState` object.

## State Flow: Multiplayer

Multiplayer mode follows a server-authoritative model. The client never runs the game engine. Instead, it communicates intent to the server and renders whatever state the server sends back.

```
User clicks Play
    --> playSelected() emits socket event with card IDs
    --> Server validates, engine executes
    --> Server broadcasts new ClientGameState to all players
    --> socket.on('game_state_updated') fires
    --> Store sets gameState and clears selection
    --> Components re-render
```

### Connection and room lifecycle

The multiplayer store manages a richer lifecycle than the game store. Before any game can begin, the client must authenticate, connect a socket, create or join a room, and signal readiness.

```ts
interface MultiplayerStore {
  // Connection
  socket: Socket | null;
  isConnected: boolean;
  authToken: string | null;
  userId: string | null;

  // Room
  roomState: RoomState | null;
  roomCode: string | null;

  // Game
  gameState: ClientGameState | null;
  selectedCardIds: Set<string>;

  // Chat and errors
  chatMessages: ChatMessage[];
  error: string | null;
}
```

The `connect()` action obtains a JWT token, opens the socket, and registers all event listeners in one call. Each server event (`room_updated`, `game_started`, `game_state_updated`) writes directly to the store via `set()`. The React components subscribe to these fields and update automatically.

### Server authority in practice

The critical difference from single-player is that `playSelected()` does not validate the move locally. It sends the card IDs to the server and waits for a callback:

```ts
playSelected: () => {
  const { socket, selectedCardIds } = get();
  socket.emit('play_cards', { cardIds: [...selectedCardIds] }, (response) => {
    if (response?.error) {
      set({ error: response.error });
    } else {
      set({ selectedCardIds: new Set() });
    }
  });
},
```

If the server rejects the play, the client receives an error and the cards stay selected. If the server accepts, the selection clears, and the authoritative game state arrives separately via the `game_state_updated` event. The client never assumes success.

This design means clients cannot cheat by modifying local state. Even if a malicious client sends fabricated card IDs, the server validates every action through the engine before broadcasting.

## Card Selection and Game Controls

Card selection is the most interactive piece of state. Both stores manage it with the same pattern: a `Set<string>` of selected card IDs.

When a user taps a card, the component calls `toggleCard(cardId)`. The store adds or removes the ID from the set. The card component receives `selected` as a prop and renders the visual lift and glow:

```ts
toggleCard: (cardId) => {
  set(state => {
    const newSet = new Set(state.selectedCardIds);
    if (newSet.has(cardId)) newSet.delete(cardId);
    else newSet.add(cardId);
    return { selectedCardIds: newSet };
  });
},
```

The game controls component reads derived state to determine button availability. Three selectors work together:

- **`isMyTurn()`** checks whether the current player index points to the human player. Both Play and Pass buttons are disabled when it is not the human's turn.
- **`canPlaySelection()`** filters the hand down to selected cards, then calls the engine's `isValidPlay()` to check whether those cards form a legal combination that beats the current play. This gives real-time feedback: the Play button enables only when the selection is valid.
- **`canPass()`** returns true only when a combination is active on the table. In Tien Len, you cannot pass when you are leading (no combination to beat).

A fourth selector, `getSelectedCombination()`, calls the engine's `detectCombination()` on the selected cards. The game controls use this to display a label like "Pair of 7s" or "Straight (5)" above the buttons, giving the player confirmation of what they are about to play.

These selectors call `get()` on demand rather than storing derived values. This avoids stale data: every time React asks for `canPlaySelection()`, it recomputes from the current `selectedCardIds` and `clientState`.

## How Components Consume State

Components in this project follow a props-driven pattern. The page-level component (the game screen) calls the store hook, extracts the values it needs, and passes them as props to child components:

```tsx
// Page-level: connects store to UI
const clientState = useGameStore(s => s.clientState);
const toggleCard = useGameStore(s => s.toggleCard);
const canPlay = useGameStore(s => s.canPlaySelection());

// Passes data down
<PokerTable players={clientState.players} ... />
<GameControls canPlay={canPlay} onPlay={playSelected} ... />
```

The `PokerTable`, `GameControls`, `PlayingCard`, and `PlayerSeat` components are pure presentational components. They accept props and render UI. None of them import or call any store directly. This separation means:

1. Components are reusable across solo and multiplayer modes
2. Components are testable with simple prop injection
3. The store boundary is explicit and limited to one layer

## Summary

The state management architecture is built around a few core principles:

- **Two stores for two modes.** Single-player owns an engine instance; multiplayer owns a socket connection. Keeping them separate avoids conditional branching and keeps each store small.
- **`ClientGameState` as the common currency.** Whether produced locally by the engine or received from the server, the same type drives all UI rendering.
- **Selection is local, execution is authoritative.** Card selection lives in the client store for instant feedback. Playing cards either goes through the local engine (solo) or the server (multiplayer), but in both cases the authoritative result replaces the previous state wholesale.
- **Selectors over derived state.** Functions like `canPlaySelection()` compute on demand using `get()`, ensuring they always reflect the latest state without synchronization bugs.
- **Props, not hooks, at the leaf level.** Presentational components receive data as props, keeping the store boundary at the page level and the component tree testable and mode-agnostic.
