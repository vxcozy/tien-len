# Game Engine API Reference

This document provides technical specifications for the Tien Len game engine API.

## TienLenGame Class

The core game engine class that manages game state and enforces rules.

### Constructor

```typescript
constructor(
  playerIds: string[],
  playerNames: Map<string, string>,
  settings: Partial<GameSettings> = {},
  isFirstGame: boolean = true
)
```

Creates a new game instance.

**Parameters:**

- `playerIds`: Array of unique player identifiers
- `playerNames`: Map of player IDs to display names
- `settings`: Partial game settings object (merged with defaults)
- `isFirstGame`: If true, the player with 3 of spades leads; if false, player at index 0 leads

**Returns:** TienLenGame instance

**Initial State:** Phase is set to 'waiting'. No cards are dealt until `start()` is called.

### start()

```typescript
start(): GameEvent[]
```

Starts the game by shuffling, dealing cards, checking for instant wins, and determining the first player.

**Returns:** Array of game events in order:
- `cards_dealt`
- Zero or more `instant_win` events
- `game_started` (includes `firstPlayerId` in data)
- `turn_changed`
- If instant wins result in game end: `game_over`

**Side Effects:**
- Deals 13 cards to each player
- Sets phase to 'dealing', then 'playing' (or 'gameEnd' if instant wins end the game)
- Determines current player based on `isFirstGame` flag
- May immediately end game if instant wins reduce active players to 1 or fewer

**Throws:** None

### playCards()

```typescript
playCards(playerId: string, cardIds: string[]): GameEvent[]
```

Plays cards from the current player's hand.

**Parameters:**

- `playerId`: ID of the player making the play
- `cardIds`: Array of card IDs to play (e.g., `["3s", "4s", "5s"]`)

**Returns:** Array of game events:
- `cards_played` (includes `cards`, `combination`, `handSize`)
- Optionally `player_finished` (includes `position`)
- Optionally `game_over` (includes `finishOrder`)
- Optionally `round_won` (if all other active players have passed)
- `turn_changed`

**Validation:**
- Player must be current player
- Game phase must be 'playing'
- Cards must exist in player's hand
- Cards must form a valid combination
- First play of first game must include 3 of spades
- Combination must beat current combination on table

**Throws:**
- `Error('Not your turn')` if playerId is not current player
- `Error('Game is not in playing phase')` if phase is not 'playing'
- `Error('Player not found')` if player has no hand
- `Error('Cards not found in hand')` if any card ID is invalid
- `Error('Invalid card combination')` if cards don't form valid combination
- `Error('First play of the game must include the 3 of Spades')` if first play invalid
- `Error('This combination does not beat the current play')` if combination doesn't beat table

**Side Effects:**
- Removes played cards from player's hand
- Updates current combination
- Clears passed players set
- Advances to next active player
- May trigger round end (clears table, resets passed players)
- May finish player if hand becomes empty
- May end game if only 0-1 active players remain

### pass()

```typescript
pass(playerId: string): GameEvent[]
```

Current player passes their turn.

**Parameters:**

- `playerId`: ID of the player passing

**Returns:** Array of game events:
- `player_passed`
- Optionally `round_won` (if all other active players have now passed)
- `turn_changed`

**Validation:**
- Player must be current player
- Game phase must be 'playing'
- Cannot pass when leading (no combination on table)

**Throws:**
- `Error('Not your turn')` if playerId is not current player
- `Error('Game is not in playing phase')` if phase is not 'playing'
- `Error('Cannot pass when leading')` if currentCombination is null

**Side Effects:**
- Adds player to passed players set
- Advances to next active player
- May trigger round end if only one active player hasn't passed

### getStateForPlayer()

```typescript
getStateForPlayer(playerId: string): ClientGameState
```

Returns game state redacted for a specific player.

**Parameters:**

- `playerId`: ID of the player requesting state

**Returns:** ClientGameState object containing:

```typescript
{
  phase: GamePhase;
  players: PlayerState[];           // All players with public info
  myHand: Card[];                   // Sorted hand for requesting player
  myPlayerId: string;
  currentPlayerIndex: number;
  currentCombination: Combination | null;
  lastPlayedBy: string | null;
  passedPlayerIds: string[];
  isFirstGame: boolean;
  isFirstTurnOfGame: boolean;
  turnHistory: TurnHistoryEntry[];  // Last 20 entries
  finishOrder: string[];
  settings: GameSettings;
}
```

**Notes:**
- Other players' hands are hidden; only hand sizes are visible
- Turn history is limited to last 20 entries
- All hands are sorted in ascending order

### getCurrentPlayerId()

```typescript
getCurrentPlayerId(): string
```

Returns the ID of the player whose turn it is.

**Returns:** String player ID

### getPhase()

```typescript
getPhase(): GamePhase
```

Returns the current game phase.

**Returns:** One of: `'waiting'`, `'dealing'`, `'playing'`, `'roundEnd'`, `'gameEnd'`

### getFinishOrder()

```typescript
getFinishOrder(): string[]
```

Returns the order in which players finished the game.

**Returns:** Array of player IDs. First element is the winner, last is the loser. Empty array if game is not finished.

### getActivePlayers()

```typescript
getActivePlayers(): string[]
```

Returns IDs of players who still have cards.

**Returns:** Array of player IDs who are still active

### isPlayerTurn()

```typescript
isPlayerTurn(playerId: string): boolean
```

Checks if it is a specific player's turn.

**Parameters:**

- `playerId`: Player ID to check

**Returns:** true if it is the specified player's turn, false otherwise

### isLeading()

```typescript
isLeading(): boolean
```

Checks if the current player must play (i.e., they are leading the round).

**Returns:** true if no combination is on the table, false if a combination exists

**Notes:** When leading, the player cannot pass and must play any valid combination.

## SimpleAI Class

A simple AI player that plays the lowest valid combination to conserve strong cards.

### selectPlay()

```typescript
selectPlay(
  hand: Card[],
  currentCombo: Combination | null,
  isFirstPlay: boolean
): string[] | null
```

Selects cards to play or returns null to pass.

**Parameters:**

- `hand`: The AI's current hand
- `currentCombo`: The combination currently on the table (null if leading)
- `isFirstPlay`: true if this is the first play of the game (must include 3 of spades)

**Returns:**
- Array of card IDs to play
- `null` to pass (only when not leading and cannot beat current combination)

**Strategy:**
- When leading: plays lowest possible combination
- When first play of game: attempts to include 3 of spades in a combination, otherwise plays it as single
- When beating: finds all valid beating combinations and plays the weakest one
- Conserves strong cards (2s, high ranks) for later

**Notes:**
- Always attempts to beat with bombs (quads and double sequences) when table shows 2s
- Prioritizes playing cards rather than passing when possible

## Utility Functions

### createDeck()

```typescript
createDeck(): Card[]
```

Creates a standard 52-card deck.

**Returns:** Array of 52 Card objects

### shuffle()

```typescript
shuffle(deck: Card[]): Card[]
```

Shuffles a deck using Fisher-Yates algorithm.

**Parameters:**

- `deck`: Array of cards to shuffle

**Returns:** New shuffled array (does not mutate input)

### deal()

```typescript
deal(deck: Card[], numPlayers: number): { hands: Card[][] }
```

Deals cards from a deck to players.

**Parameters:**

- `deck`: Shuffled deck
- `numPlayers`: Number of players (typically 2-8)

**Returns:** Object with `hands` array, where each element is a player's hand

### sortHand()

```typescript
sortHand(hand: Card[]): Card[]
```

Sorts a hand in ascending order (3 of spades first, 2 of hearts last).

**Parameters:**

- `hand`: Array of cards

**Returns:** New sorted array

### cardValue()

```typescript
cardValue(card: Card): number
```

Returns numeric value of a card (0-51). Higher value means stronger card.

**Parameters:**

- `card`: Card to evaluate

**Returns:** Integer from 0 to 51

**Formula:** `RANK_ORDER[card.rank] * 4 + SUIT_ORDER[card.suit]`

### compareCards()

```typescript
compareCards(a: Card, b: Card): number
```

Compares two cards for sorting.

**Parameters:**

- `a`: First card
- `b`: Second card

**Returns:**
- Negative number if a < b
- Zero if a equals b
- Positive number if a > b

### findCardsInHand()

```typescript
findCardsInHand(hand: Card[], cardIds: string[]): Card[] | null
```

Finds cards in a hand by their IDs.

**Parameters:**

- `hand`: Player's hand
- `cardIds`: Array of card IDs to find

**Returns:**
- Array of Card objects if all IDs found
- `null` if any ID is not found

### removeCardsFromHand()

```typescript
removeCardsFromHand(hand: Card[], cardIds: string[]): Card[]
```

Removes cards from a hand by their IDs.

**Parameters:**

- `hand`: Player's hand
- `cardIds`: Array of card IDs to remove

**Returns:** New hand array without the specified cards

### findThreeOfSpades()

```typescript
findThreeOfSpades(hands: Card[][]): number
```

Finds which player holds the 3 of spades.

**Parameters:**

- `hands`: Array of player hands

**Returns:** Player index (0-based), or -1 if not found

### isTwo()

```typescript
isTwo(card: Card): boolean
```

Checks if a card is a 2.

**Parameters:**

- `card`: Card to check

**Returns:** true if rank is '2', false otherwise

### detectCombination()

```typescript
detectCombination(cards: Card[]): Combination | null
```

Detects what combination a set of cards forms.

**Parameters:**

- `cards`: Array of cards to analyze

**Returns:**
- Combination object if cards form valid combination
- `null` if cards don't form any valid combination

**Valid Combinations:**
- `single`: 1 card
- `pair`: 2 cards of same rank
- `triple`: 3 cards of same rank
- `quad`: 4 cards of same rank
- `sequence`: 3+ consecutive ranks (no 2s)
- `doubleSequence`: 3+ consecutive pairs (no 2s)

### combinationLabel()

```typescript
combinationLabel(combo: Combination): string
```

Returns human-readable label for a combination.

**Parameters:**

- `combo`: Combination object

**Returns:** String description (e.g., "Pair of 5s", "Straight 3-7", "Four 2s")

### canBeat()

```typescript
canBeat(played: Combination, onTable: Combination | null): boolean
```

Checks if a played combination beats the current combination on the table.

**Parameters:**

- `played`: Combination being played
- `onTable`: Current combination on table (null if leading)

**Returns:** true if play is valid, false otherwise

**Rules:**
- If table is empty, any valid combination can lead
- Bombs (quads, large double sequences) can beat 2s regardless of type
- Otherwise, must match type and have higher high card
- Sequences and double sequences must match length

### isValidPlay()

```typescript
isValidPlay(
  cards: Card[],
  onTable: Combination | null
): { valid: boolean; combination?: Combination; error?: string }
```

Validates a play is legal given the current game context.

**Parameters:**

- `cards`: Cards being played
- `onTable`: Current combination on table

**Returns:** Object with:
- `valid`: boolean indicating if play is legal
- `combination`: Detected combination (if valid)
- `error`: Error message (if invalid)

### isValidFirstPlay()

```typescript
isValidFirstPlay(cards: Card[], isFirstGame: boolean): boolean
```

Validates the first play of a game includes the 3 of spades.

**Parameters:**

- `cards`: Cards being played
- `isFirstGame`: Whether this is the first game

**Returns:** true if play is valid for first turn, false otherwise

**Notes:** If `isFirstGame` is false, always returns true

### checkInstantWin()

```typescript
checkInstantWin(hand: Card[], settings: GameSettings): InstantWinType | null
```

Checks if a hand qualifies for an instant win.

**Parameters:**

- `hand`: Player's dealt hand
- `settings`: Game settings specifying which instant wins are enabled

**Returns:**
- `'dragon'`: 13-card straight (one card of each rank)
- `'fourTwos'`: All four 2s
- `'sixPairs'`: 6 or more pairs
- `null`: No instant win

**Notes:** Must be checked immediately after dealing, before any cards are played.

## Type Definitions

### Card

```typescript
interface Card {
  rank: '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';
  suit: 'spades' | 'clubs' | 'diamonds' | 'hearts';
  id: string;  // e.g., "3s", "Ah", "2d"
}
```

### Combination

```typescript
interface Combination {
  type: 'single' | 'pair' | 'triple' | 'quad' | 'sequence' | 'doubleSequence';
  cards: Card[];
  highCard: Card;     // Card that determines beating power
  length?: number;    // For sequences: number of ranks (not cards)
}
```

### GameSettings

```typescript
interface GameSettings {
  maxPlayers: number;                    // 2-8
  instantWins: {
    dragon: boolean;                     // 13-card straight
    fourTwos: boolean;                   // All four 2s
    sixPairs: boolean;                   // 6+ pairs
  };
  turnTimeoutSeconds: number;            // 10-120
  winnerLeads: boolean;                  // true = winner leads next game
}
```

**Defaults:**

```typescript
{
  maxPlayers: 4,
  instantWins: { dragon: true, fourTwos: true, sixPairs: true },
  turnTimeoutSeconds: 30,
  winnerLeads: true
}
```

### GameEvent

```typescript
interface GameEvent {
  type: 'game_started' | 'cards_dealt' | 'cards_played' | 'player_passed'
        | 'round_won' | 'player_finished' | 'game_over' | 'instant_win'
        | 'turn_changed';
  playerId?: string;
  data?: Record<string, unknown>;
}
```

### PlayerState

```typescript
interface PlayerState {
  id: string;
  name: string;
  handSize: number;
  isActive: boolean;
  hasPassed: boolean;
  finishPosition: number | null;
}
```

### TurnHistoryEntry

```typescript
interface TurnHistoryEntry {
  playerId: string;
  playerName: string;
  action: 'play' | 'pass';
  combination?: Combination;
  timestamp: number;
}
```
