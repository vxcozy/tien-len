# Tien Len

A full-stack Vietnamese card game (Tiến Lên) built for the web. Play solo against AI or create multiplayer rooms with friends.

**[Play Now](https://tien-len-ruby.vercel.app)**

## What is Tien Len?

Tien Len (Tiến Lên, "Go Forward") is the most popular card game in Vietnam. Players race to empty their hand by playing increasingly powerful card combinations. Twos are the highest card. Bombs beat twos. First to empty wins.

The game supports 2–8 players, with AI opponents filling empty seats in solo mode.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4, Framer Motion |
| 3D | Three.js via React Three Fiber |
| State | Zustand (two-store architecture) |
| Multiplayer | Socket.io with JWT authentication |
| Game Engine | Pure TypeScript, server-authoritative |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Vitest (83 tests) |

## Project Structure

```
tien-len/
├── apps/
│   ├── web/          Next.js frontend
│   └── server/       Socket.io multiplayer server
├── packages/
│   ├── engine/       Game logic, AI, validation (83 tests)
│   └── shared/       Types, constants, Zod schemas
├── docs/             Diataxis-style documentation
└── turbo.json        Turborepo configuration
```

## Quick Start

```bash
# Install dependencies
npx pnpm install

# Run tests
npx pnpm --filter @tienlen/engine test

# Start the dev server
npx pnpm --filter web dev
```

Visit `http://localhost:3000` and click **Solo** to play against AI.

For multiplayer, also start the game server:

```bash
npx pnpm --filter @tienlen/server dev
```

## Documentation

All documentation follows the [Diataxis](https://diataxis.fr) framework, organized into four categories by purpose.

### Tutorials — Learning-oriented

Step-by-step lessons to get you started.

- [Getting Started](docs/tutorials/01-getting-started.md) — Set up the dev environment
- [Your First Game](docs/tutorials/02-your-first-game.md) — Play a solo game against AI
- [Host Multiplayer](docs/tutorials/03-host-multiplayer.md) — Create a room and play with friends

### How-To Guides — Task-oriented

Practical guides for specific tasks.

- [Run Tests](docs/how-to/run-tests.md) — Run and write engine tests
- [Deploy](docs/how-to/deploy.md) — Deploy frontend to Vercel and server to Docker
- [Add House Rules](docs/how-to/add-house-rules.md) — Customize game settings
- [Customize Theme](docs/how-to/customize-theme.md) — Change colors, fonts, and styles
- [Add AI Difficulty](docs/how-to/add-ai-difficulty.md) — Create harder AI opponents

### Explanation — Understanding-oriented

Background knowledge and design decisions.

- [Architecture](docs/explanation/architecture.md) — Monorepo structure and data flow
- [Game Rules](docs/explanation/game-rules.md) — Complete Tien Len rules reference
- [Security Model](docs/explanation/security-model.md) — Server-authoritative validation
- [State Management](docs/explanation/state-management.md) — Zustand two-store architecture

### Reference — Information-oriented

Technical specifications and API docs.

- [Game Engine API](docs/reference/game-engine-api.md) — TienLenGame class and utilities
- [Socket Events](docs/reference/socket-events.md) — WebSocket event contracts
- [Environment Variables](docs/reference/environment-variables.md) — Configuration reference
- [Design System](docs/reference/design-system.md) — Colors, typography, components
- [Component Library](docs/reference/component-library.md) — UI component props and usage

## Design

The UI draws from Vietnamese and Chinese festive aesthetics — deep reds paired with gold, a Ma Shan Zheng brush calligraphy font, and a golden felt poker table. The landing page features 3D playing cards floating in space via Three.js.

Players are represented by deterministic pixel-art avatars (Facehash) with rainbow ring borders. The game table supports 2–8 players seated around an elliptical layout with red ribbon name banners and animated status indicators.

## License

MIT
