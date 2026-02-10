# Component Library Reference

This document is a complete API reference for every UI component in `apps/web/src/components`. Components are grouped by category, and each entry lists props, key behaviors, and internal dependencies.

All components are React client components (`'use client'`). Animation is handled through Framer Motion; styling uses Tailwind v4 with the project's custom theme tokens (gold, felt-green, wood, card-red, card-black, etc.).

---

## 1. Game Components

### PokerTable

Renders the oval poker table surface with decorative layers (wood rail, red trim, gold pinstripe, felt texture) and positions opponent seats around it. The local player (hero) is excluded from the table since their hand renders separately below.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `players` | `PlayerState[]` | Yes | All players in the game |
| `currentPlayerId` | `string` | Yes | ID of the player whose turn it is |
| `myPlayerId` | `string` | Yes | ID of the local (hero) player |
| `currentCombination` | `Combination \| null` | Yes | Cards currently on the table |
| `lastPlayedBy` | `string \| null` | Yes | ID of the player who last played cards |

**Key behaviors:**
- Rotates the player array so the hero is always at seat index 0 (bottom center), then skips index 0 (hero hand renders separately below the table).
- Reads seat coordinates from `SEAT_POSITIONS[playerCount]` (`@/constants/seat-positions`).

**Dependencies:** `PlayerSeat`, `PlayArea`, `SEAT_POSITIONS` constant.

---

### PlayerSeat

Displays a single opponent around the table: avatar, name banner, card-count badge, and contextual status overlays (passed, finished, locked, waiting).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `player` | `PlayerState` | Yes | Player data (name, handSize, hasPassed, finishPosition, isLocked) |
| `position` | `SeatPosition` | Yes | `{ x: number, y: number }` as percent offsets on the table |
| `isCurrentTurn` | `boolean` | Yes | Whether this player currently has the turn |
| `isSelf` | `boolean` | Yes | Whether this seat represents the local player |

**Key behaviors:**
- Absolute-positioned at `left/top` percentages; centered via CSS transforms.
- Spring-animated entrance (scale 0.8 to 1).
- Active turn: pulsing yellow ring around the avatar.
- Winner (finishPosition 1): crown emoji and "FIRST" ribbon badge.
- Passed: dark overlay with red X.
- Finished (non-first): gold badge with `#N` position.
- Locked: red exclamation badge at top-left.
- Waiting: animated bouncing dots beneath the name ribbon.
- Card count shown as a red rounded badge (hidden for self or finished players).

**Dependencies:** `Avatar`.

---

### PlayArea

Center-of-table zone that shows the most recently played combination or a dashed placeholder when the table is empty (indicating a free lead).

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `combination` | `Combination \| null` | Yes | Current combination on the table |
| `lastPlayedBy` | `string \| null` | Yes | Player ID of whoever last played |
| `playerNames` | `Record<string, string>` | Yes | Map of player IDs to display names |

**Key behaviors:**
- Cards fan out with staggered spring animations and slight rotation based on index.
- Bomb types (quad, threePairBomb, fourPairBomb) trigger `animate-bomb-shake` CSS.
- Empty state renders a dashed yellow placeholder with "Your Lead!" label.
- Below the cards, a small label shows the name of the last player who played.

**Dependencies:** `PlayingCard`.

---

### GameControls

Action bar displayed below the hero's hand with Sort, Pass, and Play buttons, plus an inline combination label.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `canPlay` | `boolean` | Yes | Whether the selected cards form a valid, playable combination |
| `canPass` | `boolean` | Yes | Whether the player is allowed to pass |
| `isMyTurn` | `boolean` | Yes | Whether it is the local player's turn |
| `selectedCount` | `number` | Yes | Number of currently selected cards |
| `selectedCombination` | `Combination \| null` | Yes | Parsed combination from selected cards |
| `onPlay` | `() => void` | Yes | Callback when Play is clicked |
| `onPass` | `() => void` | Yes | Callback when Pass is clicked |
| `onSort` | `() => void` | Yes | Callback when Sort is clicked |

**Key behaviors:**
- Play and Pass are disabled when it is not the player's turn or the action is invalid.
- Play button label dynamically shows `Play N` when cards are selected.
- Animated combination label appears above buttons when a valid combo is selected.
- `whileTap` scale-down on all buttons. Minimum 44px touch targets for mobile.

**Dependencies:** `combinationLabel` from `@tienlen/engine`.

---

### TurnIndicator

Pill-shaped banner that displays whose turn it is. Highlighted when it is the local player's turn.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `playerName` | `string` | Yes | Display name of the current player |
| `isMyTurn` | `boolean` | Yes | Whether it is the local player's turn |

**Key behaviors:**
- Uses `AnimatePresence mode="wait"` to crossfade between turn changes.
- When `isMyTurn` is true: yellow glowing pill with bouncing dot indicator and "Your Turn!" text.
- Otherwise: subtle translucent pill showing the opponent's name.

**Dependencies:** None (standalone).

---

### GameLog

Scrollable feed of turn history entries showing who played or passed and what combination was used.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `history` | `TurnHistoryEntry[]` | Yes | Array of turn actions to display |

**Key behaviors:**
- Auto-scrolls to the bottom on each new entry.
- Returns `null` when history is empty (renders nothing).
- Bomb combinations are highlighted in red; normal plays use gold text.
- Maximum height of 96px with thin custom scrollbar.

**Dependencies:** `combinationLabel` from `@tienlen/engine`.

---

### ComboPreview

Lightweight inline label that displays the name of a card combination. Used to give feedback on what the selected cards form.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `combination` | `Combination \| null` | Yes | The combination to label, or null to hide |

**Key behaviors:**
- Renders nothing when `combination` is null.
- Animates in/out with `AnimatePresence mode="wait"` (vertical slide + fade).
- Text styled as bold yellow brush font for thematic consistency.

**Dependencies:** `combinationLabel` from `@tienlen/engine`.

---

## 2. Card Components

### PlayingCard

Renders a single playing card with front and back faces, 3D flip animation, selection glow, and hover/tap micro-interactions.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rank` | `string` | Yes | Card rank (e.g. "A", "2", "10") |
| `suit` | `'hearts' \| 'diamonds' \| 'clubs' \| 'spades'` | Yes | Card suit |
| `faceUp` | `boolean` | Optional (default `true`) | Whether the front face is visible |
| `selected` | `boolean` | Optional (default `false`) | Whether the card is selected (lifts up, yellow ring) |
| `disabled` | `boolean` | Optional (default `false`) | Grays out card and disables interactions |
| `onClick` | `() => void` | Optional | Click handler for toggling selection |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | Optional (default `'md'`) | Predefined size preset |

**Size presets:**
- `sm`: 40x56px, `md`: 64x88px, `lg`: 80x112px, `xl`: 80x120px.

**Key behaviors:**
- 3D flip via `rotateY` with `backface-hidden`. Selected cards lift 10px with yellow ring glow.
- Hover lifts 5px with slight rotation. Front: white gradient, rank/suit corners, center watermark.
- Back: maroon gradient with diamond cross-hatch and centered gold circle.

**Dependencies:** None (standalone).

---

### CardFan

Arranges an array of cards in an arc (fan) layout with spring-animated entry, selection lift, and automatic overlap scaling based on hand size.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `cards` | `Card[]` | Yes | Sorted array of cards to display |
| `selectedCardIds` | `Set<string>` | Yes | IDs of currently selected cards |
| `onToggleSelect` | `(cardId: string) => void` | Optional | Called when a card is clicked |
| `maxFanAngle` | `number` | Optional (default `30`) | Maximum total spread angle in degrees |
| `size` | `'sm' \| 'md' \| 'lg'` | Optional (default `'md'`) | Size passed through to each PlayingCard |
| `disabled` | `boolean` | Optional (default `false`) | Disables all card interactions |

**Key behaviors:**
- Rotation distributed evenly across `maxFanAngle`, capped at 5 degrees per card.
- Overlap scales inversely with card count (tighter on mobile). Cards follow a parabolic arc.
- Selected cards lift 16px above their arc position.
- `AnimatePresence` for animated entry/exit; staggered 20ms delay per card.

**Dependencies:** `PlayingCard`.

---

### CardStack

Displays a pile of face-down cards with slight rotation spread, used to represent an opponent's hidden hand. Includes a "+N" overflow badge.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `count` | `number` | Yes | Total number of cards in the stack |
| `maxVisible` | `number` | Optional (default `5`) | Maximum cards rendered visually |

**Key behaviors:**
- Renders up to `maxVisible` card-back rectangles, each rotated from -3 to +3 degrees.
- When `count > maxVisible`, a small red badge shows `+N` for the remaining cards.
- Fixed dimensions: 36x48px.
- Card backs use the same maroon gradient and cross-hatch pattern as PlayingCard.

**Dependencies:** None (standalone, uses only CSS).

---

## 3. Avatar Component

### Avatar

Deterministic avatar generated from a player name using the `facehash` library, wrapped in a rainbow conic-gradient ring.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes | Player name used as the hash seed |
| `size` | `'sm' \| 'md' \| 'lg'` | Optional (default `'md'`) | Avatar pixel size: sm=44, md=64, lg=80 |
| `className` | `string` | Optional (default `''`) | Additional CSS classes (e.g. opacity for passed/finished) |

**Key behaviors:**
- Rainbow ring border via `conic-gradient` cycling through 8 hue stops.
- White inner border for a polished mobile-game appearance.
- The `Facehash` component generates a unique pixel-art face per name.
- Ring is 10px larger than the avatar itself.

**Exported utility:** `getAvatarColor(name: string): string` returns a deterministic color from an 8-color palette, useful for name labels or charts.

**Dependencies:** `facehash` (third-party).

---

## 4. Effect Components

### Confetti

Full-screen particle celebration effect triggered on game victory. Renders animated confetti pieces that fall from the top of the viewport.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `active` | `boolean` | Yes | Whether the confetti is currently visible |
| `count` | `number` | Optional (default `50`) | Number of confetti pieces |

**Key behaviors:**
- Pieces are memoized on `count` with randomized position, color, delay, duration, rotation, drift, and shape.
- Each piece falls from top to bottom with horizontal drift and spin; opacity fades near the end.
- Full-screen `fixed inset-0 z-50 pointer-events-none` overlay. 8-color rainbow palette.

**Dependencies:** None (standalone).

---

### BombEffect

Full-screen red flash overlay triggered when a bomb combination (quad, 3-pair bomb, 4-pair bomb) is played.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `active` | `boolean` | Yes | Whether the flash is active |

**Key behaviors:**
- Red-tinted overlay that pulses in and out over 400ms (fast fade-in, slower fade-out).
- Full-screen `fixed z-50 pointer-events-none`. Entry/exit via `AnimatePresence`.

**Dependencies:** None (standalone).

---

## 5. Three.js Components

### FloatingCardsScene

Ambient 3D background scene of playing cards orbiting slowly, flipping, and drifting. Used on the home/lobby screen for visual polish.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| *(none)* | -- | -- | This component takes no props |

**Key behaviors:**
- Renders 10 cards as thin `boxGeometry` meshes with canvas-generated textures (front and back).
- Each card has randomized, memoized orbital parameters (radius, height, orbit/flip speed, tilt).
- Cards orbit in a loose ring, floating vertically and flipping on the Y axis.
- `GoldDust` sub-component adds 25 drifting gold point particles.
- Three-point lighting: ambient, directional warm white, gold point light.
- Renders at 45% opacity as `fixed inset-0 z-0 pointer-events-none`. Camera `[0,0,6]`, FOV 50, DPR capped at 1.5.

**Internal sub-components (not exported):** `FloatingCard` (single orbiting mesh), `GoldDust` (point particles), `createCardFaceTexture()` and `createCardBackTexture()` (256x384 canvas texture generators).

**Dependencies:** `@react-three/fiber`, `three`.
