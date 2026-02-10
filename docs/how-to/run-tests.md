# How to Run and Write Tests

This guide covers running the existing test suite and adding new tests to the Tien Len game engine.

## Running Tests

### Run all tests

From the project root:

```bash
npx pnpm --filter @tienlen/engine test
```

This runs all 66 tests in the engine package using Vitest.

### Run tests in watch mode

For development with automatic re-running:

```bash
npx pnpm --filter @tienlen/engine test:watch
```

Tests re-run whenever source files change.

### Run specific test file

```bash
npx pnpm --filter @tienlen/engine test -- combination.test.ts
```

Or use the full path:

```bash
npx pnpm --filter @tienlen/engine test -- src/__tests__/combination.test.ts
```

### Run tests with coverage

Add coverage to the vitest command:

```bash
npx pnpm --filter @tienlen/engine test -- --coverage
```

## Test Suite Structure

### Test files location

All tests live in `packages/engine/src/__tests__/`:

```
packages/engine/src/__tests__/
├── combination.test.ts    (19 tests)
├── deck.test.ts           (11 tests)
├── game.test.ts           (10 tests)
├── instant-wins.test.ts    (6 tests)
└── validator.test.ts      (20 tests)
```

Total: 66 tests across 5 files.

### Test configuration

Tests use Vitest with the default configuration. The engine package.json defines:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

No custom vitest.config.ts file exists. Vitest uses its defaults:

- Test files: `**/*.{test,spec}.{js,ts}`
- Test environment: Node.js
- Type checking: Enabled via TypeScript

## Writing New Tests

### Test file structure

All test files follow this pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../module';
import type { Card } from '@tienlen/shared';

// Helper to create card objects
function card(rank: string, suit: string): Card {
  const suitShort: Record<string, string> = {
    spades: 's',
    clubs: 'c',
    diamonds: 'd',
    hearts: 'h'
  };
  return {
    rank: rank as Card['rank'],
    suit: suit as Card['suit'],
    id: `${rank}${suitShort[suit]}`
  };
}

describe('functionToTest', () => {
  describe('specific feature', () => {
    it('describes expected behavior', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });
  });
});
```

### Example: Add a new test to combination.test.ts

1. Open `packages/engine/src/__tests__/combination.test.ts`

2. Add a new test case inside the appropriate describe block:

```typescript
describe('detectCombination', () => {
  describe('pairs', () => {
    it('detects a pair', () => {
      const combo = detectCombination([card('7', 'spades'), card('7', 'hearts')]);
      expect(combo).not.toBeNull();
      expect(combo!.type).toBe('pair');
      expect(combo!.highCard.suit).toBe('hearts');
    });

    // Add your new test here:
    it('prioritizes highest suit in pair', () => {
      const combo = detectCombination([card('K', 'diamonds'), card('K', 'hearts')]);
      expect(combo).not.toBeNull();
      expect(combo!.type).toBe('pair');
      expect(combo!.highCard.suit).toBe('hearts'); // Hearts > Diamonds
    });
  });
});
```

3. Run tests to verify:

```bash
npx pnpm --filter @tienlen/engine test
```

### Example: Create a new test file

1. Create a new file in `packages/engine/src/__tests__/`:

```bash
touch packages/engine/src/__tests__/scoring.test.ts
```

2. Write test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoring';

describe('calculateScore', () => {
  it('returns 0 for winner', () => {
    const score = calculateScore(1, 4);
    expect(score).toBe(0);
  });

  it('calculates penalty for last place', () => {
    const score = calculateScore(4, 4);
    expect(score).toBeGreaterThan(0);
  });
});
```

3. Run tests:

```bash
npx pnpm --filter @tienlen/engine test
```

The new file is automatically discovered.

## Common Test Patterns

### Testing card combinations

Use the helper function to create cards:

```typescript
it('detects a sequence', () => {
  const cards = [
    card('3', 'spades'),
    card('4', 'hearts'),
    card('5', 'clubs')
  ];
  const combo = detectCombination(cards);
  expect(combo!.type).toBe('sequence');
  expect(combo!.length).toBe(3);
});
```

### Testing game state

Import types and create mock state:

```typescript
import type { InternalGameState } from '@tienlen/shared';

it('advances to next player', () => {
  const state: InternalGameState = {
    phase: 'playing',
    playerIds: ['p1', 'p2', 'p3'],
    currentPlayerIndex: 0,
    // ... other required fields
  };

  const newState = advanceTurn(state);
  expect(newState.currentPlayerIndex).toBe(1);
});
```

### Testing validation

Test both valid and invalid cases:

```typescript
describe('canPlayCombination', () => {
  it('allows higher single', () => {
    const current = detectCombination([card('5', 'hearts')]);
    const play = detectCombination([card('7', 'spades')]);
    expect(canPlayCombination(play!, current!)).toBe(true);
  });

  it('rejects lower single', () => {
    const current = detectCombination([card('9', 'clubs')]);
    const play = detectCombination([card('7', 'spades')]);
    expect(canPlayCombination(play!, current!)).toBe(false);
  });
});
```

### Testing edge cases

Always test boundary conditions:

```typescript
describe('detectInstantWin', () => {
  it('returns null for empty hand', () => {
    const result = detectInstantWin([]);
    expect(result).toBeNull();
  });

  it('returns null for 12-card straight', () => {
    const cards = createSequence('3', 12);
    const result = detectInstantWin(cards);
    expect(result).toBeNull();
  });

  it('detects 13-card dragon', () => {
    const cards = createSequence('3', 13);
    const result = detectInstantWin(cards);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('dragon');
  });
});
```

## Debugging Test Failures

### View detailed error output

Failed tests show:

- Expected vs actual values
- Stack trace to failure location
- Diff for object comparisons

Example failure:

```
FAIL  src/__tests__/combination.test.ts
  ✕ detects a pair (3 ms)
    Expected: "pair"
    Received: null
      at combination.test.ts:35:24
```

### Use console.log for debugging

Add logging to understand test state:

```typescript
it('detects combination', () => {
  const combo = detectCombination(cards);
  console.log('Combo result:', combo);
  expect(combo).not.toBeNull();
});
```

### Run single test in watch mode

Focus on one failing test:

```bash
npx pnpm --filter @tienlen/engine test:watch -- combination.test.ts
```

Edit the test file and see results immediately.

## Test Guidelines

### What to test

- Pure functions in the engine (combination detection, validation)
- Game state transitions
- Rule enforcement
- Edge cases and invalid inputs

### What not to test

- Third-party libraries (Socket.io, Next.js)
- UI components (test engine only)
- Integration between frontend and server (use manual testing)

### Write clear test descriptions

Good:

```typescript
it('detects dragon with 13 sequential ranks', () => { ... });
```

Bad:

```typescript
it('works', () => { ... });
```

### One assertion per test

Prefer focused tests:

```typescript
// Good
it('sets type to pair', () => {
  const combo = detectCombination([card('5', 'hearts'), card('5', 'clubs')]);
  expect(combo!.type).toBe('pair');
});

it('sets high card to highest suit', () => {
  const combo = detectCombination([card('5', 'hearts'), card('5', 'clubs')]);
  expect(combo!.highCard.suit).toBe('hearts');
});

// Acceptable (related assertions)
it('detects pair properties', () => {
  const combo = detectCombination([card('5', 'hearts'), card('5', 'clubs')]);
  expect(combo!.type).toBe('pair');
  expect(combo!.cards).toHaveLength(2);
});
```

## Next Steps

After writing tests:

1. Verify all tests pass:
   ```bash
   npx pnpm --filter @tienlen/engine test
   ```

2. Check test coverage to find untested code paths

3. Add integration tests by manually testing game scenarios

4. Document any new test utilities or helpers
