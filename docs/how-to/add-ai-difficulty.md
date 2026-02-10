# How to Add an AI Difficulty Level

This guide walks through creating a new AI difficulty class and integrating it with the game engine and frontend.

## Understand the current SimpleAI

The existing `SimpleAI` in `packages/engine/src/ai.ts` uses a single strategy: always play the lowest valid combination. Its public API is one method:

```typescript
selectPlay(hand: Card[], currentCombo: Combination | null, isFirstPlay: boolean): string[] | null
```

It returns an array of card IDs to play, or `null` to pass. Internally it delegates to two private methods:

- `selectLead()` -- chooses what to play when no combination is on the table (picks the lowest single).
- `selectBeat()` -- finds all combinations that beat the current table and picks the weakest one.

The helper `findBeatingCombinations()` handles every combination type (singles, pairs, triples, sequences, bombs). This method is reusable from a subclass.

## Step 1: Create the HardAI class

Add a new class in `packages/engine/src/ai.ts` that extends `SimpleAI`. The key change for a harder AI is overriding card selection strategy.

```typescript
/**
 * Hard AI that makes smarter decisions:
 * - Leads with multi-card combinations to shed cards faster
 * - Holds 2s and bombs as late-game weapons
 * - Passes strategically instead of always playing
 */
export class HardAI extends SimpleAI {
  selectPlay(
    hand: Card[],
    currentCombo: Combination | null,
    isFirstPlay: boolean,
  ): string[] | null {
    const sorted = sortHand(hand);

    if (currentCombo === null) {
      return this.selectLeadHard(sorted, isFirstPlay);
    }

    return this.selectBeatHard(sorted, currentCombo);
  }
}
```

## Step 2: Implement a smarter lead strategy

When leading, `SimpleAI` always plays its lowest single card. A harder AI should prefer multi-card combinations to shed more cards per turn.

Add this private method to `HardAI`:

```typescript
private selectLeadHard(hand: Card[], mustIncludeThreeOfSpades: boolean): string[] {
  if (mustIncludeThreeOfSpades) {
    // Delegate first-play logic to the parent -- the 3-of-spades
    // requirement doesn't change between difficulties
    return this.selectLead(hand, true);
  }

  // Prefer sequences > triples > pairs > singles
  const combos = this.findAllCombinations(hand);
  const sequences = combos.filter(c => c.type === 'sequence');
  const triples = combos.filter(c => c.type === 'triple');
  const pairs = combos.filter(c => c.type === 'pair');

  // Pick the lowest multi-card combo available
  for (const group of [sequences, triples, pairs]) {
    if (group.length > 0) {
      group.sort((a, b) => cardValue(a.highCard) - cardValue(b.highCard));
      return group[0].cards.map(c => c.id);
    }
  }

  // Fallback: lowest single that is not a 2
  const nonTwos = hand.filter(c => c.rank !== '2');
  return [(nonTwos[0] ?? hand[0]).id];
}
```

## Step 3: Implement a smarter beat strategy

When responding to a play, `SimpleAI` always plays the lowest beater. A hard AI should sometimes pass to conserve strong cards.

```typescript
private selectBeatHard(hand: Card[], onTable: Combination): string[] | null {
  const candidates = this.findBeatingCombinations(hand, onTable);
  if (candidates.length === 0) return null;

  const weakest = candidates[0];

  // Strategic pass: if we only have high cards left to beat with,
  // and we have more than 4 cards, save them for later
  if (hand.length > 4 && cardValue(weakest.highCard) >= cardValue({ rank: 'J', suit: 'hearts', id: '' })) {
    return null; // pass
  }

  return weakest.cards.map(c => c.id);
}
```

Because `findBeatingCombinations` is a private method on `SimpleAI`, you need to change its visibility to `protected` so `HardAI` can call it. Do the same for `selectLead`, `findAllCombinations`, and `groupByRank`.

In `SimpleAI`, change each `private` keyword to `protected`:

```typescript
protected selectLead(...) { ... }
protected selectBeat(...) { ... }
protected findBeatingCombinations(...) { ... }
protected findAllCombinations(...) { ... }
protected groupByRank(...) { ... }
```

## Step 4: Export the new class

Add the export to `packages/engine/src/index.ts`:

```typescript
export { SimpleAI, HardAI } from './ai';
```

## Step 5: Integrate with the game store

Open `apps/web/src/stores/game-store.ts`. The `processAITurns` function currently creates a `new SimpleAI()` on every turn. Replace it with difficulty-aware instantiation.

First, add a difficulty field to the store and import `HardAI`:

```typescript
import { TienLenGame, SimpleAI, HardAI, ... } from '@tienlen/engine';

type AIDifficulty = 'easy' | 'hard';

interface GameStore {
  // ... existing fields
  aiDifficulty: AIDifficulty;
  setAIDifficulty: (d: AIDifficulty) => void;
  // ...
}
```

Then update `processAITurns` to pick the right class:

```typescript
function processAITurns(get: () => GameStore, set: ...) {
  const { game, aiDifficulty } = get();
  // ...
  const ai = aiDifficulty === 'hard' ? new HardAI() : new SimpleAI();
  const play = ai.selectPlay(aiState.myHand, aiState.currentCombination, isFirstPlay);
  // ... rest unchanged
}
```

## Step 6: Adjust AI turn timing

AI turn delays are controlled in two places inside `game-store.ts`.

The initial delay before AI processing starts:

```typescript
setTimeout(() => processAITurns(get, set), 800);
```

The delay between consecutive AI turns at the bottom of `processAITurns`:

```typescript
const delay = 500 + Math.random() * 700; // 500-1200ms
```

To make a hard AI feel faster and more decisive, use shorter delays:

```typescript
const delay = aiDifficulty === 'hard'
  ? 300 + Math.random() * 400   // 300-700ms: snappy
  : 500 + Math.random() * 700;  // 500-1200ms: relaxed
```

For the server (`apps/server/src/rooms/room.ts`), AI timing works the same way if you add server-side AI opponents.

## Step 7: Add a difficulty selector in the UI

Create a selector component in the game setup screen. The store action `setAIDifficulty` updates the Zustand state before the game starts:

```tsx
const aiDifficulty = useGameStore(s => s.aiDifficulty);
const setAIDifficulty = useGameStore(s => s.setAIDifficulty);

<div className="flex gap-2">
  <button
    className={aiDifficulty === 'easy' ? 'bg-gold text-black' : 'bg-surface'}
    onClick={() => setAIDifficulty('easy')}
  >
    Easy
  </button>
  <button
    className={aiDifficulty === 'hard' ? 'bg-gold text-black' : 'bg-surface'}
    onClick={() => setAIDifficulty('hard')}
  >
    Hard
  </button>
</div>
```

## Step 8: Test the new difficulty

Run the existing engine tests to confirm nothing broke:

```bash
npx pnpm --filter @tienlen/engine test
```

Add a dedicated test in `packages/engine/src/__tests__/game.test.ts`:

```typescript
import { HardAI } from '../ai';

describe('HardAI', () => {
  it('prefers multi-card leads over singles', () => {
    const ai = new HardAI();
    // Build a hand with a pair of 4s and loose singles
    const hand = [/* mock cards with a pair of 4s */];
    const play = ai.selectPlay(hand, null, false);
    expect(play?.length).toBeGreaterThan(1);
  });
});
```

Verify the web build compiles:

```bash
npx pnpm --filter web build
```

Then run the dev server and play a game on each difficulty to confirm AI behavior differs noticeably.
