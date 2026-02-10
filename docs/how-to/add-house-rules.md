# How to Configure Game Rules

This guide shows how to modify game settings and add custom house rules to the Tien Len card game.

## Understanding GameSettings

Game rules are defined by the `GameSettings` type in `packages/shared/src/types/game.ts`:

```typescript
export interface GameSettings {
  maxPlayers: number;
  instantWins: {
    dragon: boolean;      // 13-card straight
    fourTwos: boolean;    // All four 2s
    sixPairs: boolean;    // Six consecutive pairs
  };
  turnTimeoutSeconds: number;
  winnerLeads: boolean;   // true = winner leads next game
                          // false = 3-of-spades holder always leads
}
```

## Modify Default Settings

### 1. Edit the defaults

Open `packages/shared/src/types/game.ts` and locate `DEFAULT_GAME_SETTINGS`:

```typescript
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 4,
  instantWins: {
    dragon: true,
    fourTwos: true,
    sixPairs: true,
  },
  turnTimeoutSeconds: 30,
  winnerLeads: true,
};
```

### 2. Change settings

Modify any value to change the default behavior:

```typescript
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 3,           // Changed: 3-player games
  instantWins: {
    dragon: false,         // Changed: disable dragon instant wins
    fourTwos: true,
    sixPairs: false,       // Changed: disable six pairs
  },
  turnTimeoutSeconds: 60,  // Changed: longer turn timer
  winnerLeads: false,      // Changed: 3-of-spades always leads
};
```

### 3. Rebuild packages

After modifying `game.ts`, rebuild the affected packages:

```bash
npx pnpm --filter @tienlen/shared build
npx pnpm --filter @tienlen/server build
npx pnpm --filter web build
```

Or rebuild everything:

```bash
npx pnpm build
```

## Room Creation with Custom Settings

### How settings are passed

When a player creates a room, they can override defaults. The room creation event in `packages/shared/src/types/socket-events.ts`:

```typescript
'room:create': (
  data: { playerName: string; settings: Partial<GameSettings> },
  callback: (response: { success: boolean; code?: string; error?: string }) => void,
) => void;
```

The `settings` parameter accepts a `Partial<GameSettings>`, meaning any subset of settings can be specified. Unspecified settings use `DEFAULT_GAME_SETTINGS`.

### Example: Create room with custom settings

In client code:

```typescript
socket.emit('room:create', {
  playerName: 'Alice',
  settings: {
    maxPlayers: 3,
    turnTimeoutSeconds: 45,
    instantWins: {
      dragon: false,
      fourTwos: true,
      sixPairs: true,
    },
  },
}, (response) => {
  if (response.success) {
    console.log('Room created:', response.code);
  }
});
```

### Partial overrides

Only specify settings you want to change:

```typescript
socket.emit('room:create', {
  playerName: 'Bob',
  settings: {
    turnTimeoutSeconds: 60,  // Only override turn timeout
  },
}, callback);
```

All other settings inherit from `DEFAULT_GAME_SETTINGS`.

## Update Settings During Room Setup

### Before game starts

The host can modify settings after room creation using the `room:settings` event:

```typescript
socket.emit('room:settings', {
  settings: {
    maxPlayers: 2,
    winnerLeads: false,
  },
}, (response) => {
  if (response.success) {
    console.log('Settings updated');
  }
});
```

This only works when the room phase is `waiting` (before game starts).

### Settings are broadcast

When settings change, the server broadcasts to all players:

```typescript
'room:settings_updated': (settings: GameSettings) => void;
```

Clients receive the complete updated `GameSettings` object.

## Add New Settings

### 1. Extend the GameSettings type

In `packages/shared/src/types/game.ts`:

```typescript
export interface GameSettings {
  maxPlayers: number;
  instantWins: {
    dragon: boolean;
    fourTwos: boolean;
    sixPairs: boolean;
  };
  turnTimeoutSeconds: number;
  winnerLeads: boolean;
  // Add your new setting:
  allowBombs: boolean;      // Example: enable bomb combinations
  doubleRank: string | null; // Example: make a rank count as double
}
```

### 2. Update defaults

Add the new setting to `DEFAULT_GAME_SETTINGS`:

```typescript
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 4,
  instantWins: {
    dragon: true,
    fourTwos: true,
    sixPairs: true,
  },
  turnTimeoutSeconds: 30,
  winnerLeads: true,
  allowBombs: false,         // Default for new setting
  doubleRank: null,          // Default for new setting
};
```

### 3. Implement the rule

Modify game engine logic in `packages/engine/src/` to use the new setting. For example, in the validator:

```typescript
export function canPlayCombination(
  combo: Combination,
  current: Combination | null,
  settings: GameSettings
): boolean {
  if (settings.allowBombs && isBomb(combo)) {
    return true; // Bombs can be played on anything
  }
  // ... rest of validation logic
}
```

### 4. Add UI controls

In the frontend room setup screen, add controls to modify the new setting:

```typescript
<input
  type="checkbox"
  checked={settings.allowBombs}
  onChange={(e) => updateSettings({ allowBombs: e.target.checked })}
/>
```

### 5. Rebuild and test

Rebuild all packages and test the new rule:

```bash
npx pnpm build
npx pnpm dev
```

## Common Rule Modifications

### Change player count range

Modify validation in the server to allow different player counts:

```typescript
// In server room creation logic
if (maxPlayers < 2 || maxPlayers > 6) {
  return callback({ success: false, error: 'Invalid player count' });
}
```

### Disable all instant wins

```typescript
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  // ...
  instantWins: {
    dragon: false,
    fourTwos: false,
    sixPairs: false,
  },
  // ...
};
```

### Remove turn timer

```typescript
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  // ...
  turnTimeoutSeconds: 0,  // 0 = no timeout
  // ...
};
```

Implement logic in the server to skip timer when value is 0.

## Testing Rule Changes

After modifying rules:

1. Run engine tests to verify game logic:
   ```bash
   npx pnpm --filter @tienlen/engine test
   ```

2. Add tests for new rules in `packages/engine/src/__tests__/`

3. Manually test in development:
   ```bash
   npx pnpm dev
   ```

4. Create test rooms with different settings to verify behavior
