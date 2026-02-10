# Getting Started with Tien Len

## Introduction

This tutorial will guide you through setting up the Tien Len card game project on your local machine. By the end of this tutorial, you will have a fully functional development environment with the game running in your browser.

## What You'll Learn

- How to clone and set up the monorepo
- How to install dependencies using pnpm
- How to run the test suite
- How to start the development server

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **Git** for cloning the repository

You do not need to install pnpm globally, as we will use it via npx throughout this tutorial.

## Step 1: Clone the Repository

First, open your terminal and navigate to the directory where you want to store the project. Then clone the repository:

```bash
cd ~/Desktop/ai-projects
git clone <repository-url> tien-len
cd tien-len
```

You should now be inside the project directory. Let's verify the structure:

```bash
ls -la
```

You should see the monorepo structure with `packages/` and `apps/` directories.

## Step 2: Understand the Project Structure

The project is organized as a monorepo with the following structure:

```
tien-len/
├── packages/
│   ├── shared/       # Shared TypeScript types, constants, and Zod schemas
│   └── engine/       # Core game logic and AI opponent
├── apps/
│   ├── web/          # Next.js 15 frontend application
│   └── server/       # Socket.io multiplayer server
├── package.json      # Root package configuration
└── turbo.json        # Turborepo configuration
```

This architecture allows code sharing between the frontend, backend, and game engine.

## Step 3: Install Dependencies

Now install all the project dependencies. Since pnpm may not be installed globally on your system, we'll use npx to run it:

```bash
npx pnpm install
```

This command will:

1. Download and use pnpm if not already available
2. Install dependencies for all packages and apps in the monorepo
3. Set up the workspace links between packages

The installation may take a few minutes depending on your internet connection. You should see output indicating that dependencies are being installed for each workspace.

## Step 4: Run the Test Suite

Before starting the development server, let's verify that everything is working correctly by running the test suite for the game engine:

```bash
npx pnpm --filter @tienlen/engine test
```

This command runs tests specifically for the engine package. The `--filter` flag tells pnpm to run the command only in the specified workspace.

You should see test output showing:

- Game state management tests
- Card validation tests
- AI opponent logic tests
- Hand evaluation tests

All tests should pass. If you see any failures, double-check that you completed the installation step correctly.

## Step 5: Start the Development Server

Now you're ready to start the development server:

```bash
npx pnpm dev
```

This command uses Turborepo to start all development servers in parallel:

- **Web app** (Next.js): `http://localhost:3000`
- **Multiplayer server** (Socket.io): `http://localhost:3001`

You should see output in your terminal indicating that both servers are running.

## Step 6: Open the Game in Your Browser

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the Tien Len game home page. Congratulations! Your development environment is now set up and running.

## What You've Accomplished

You have successfully:

- Cloned the Tien Len monorepo
- Installed all project dependencies using pnpm
- Verified the installation by running tests
- Started the development servers
- Accessed the game in your browser

## Next Steps

Now that your environment is set up, you're ready to play your first game. Continue to the next tutorial: **Your First Game** to learn how to play against the AI opponent.

## Troubleshooting

### Port Already in Use

If you see an error that port 3000 or 3001 is already in use, you'll need to stop the conflicting process or change the port in the respective configuration files.

### pnpm Command Not Found

If npx cannot find pnpm, ensure you have a recent version of Node.js installed (18 or higher). You can check your version with:

```bash
node --version
```

### Installation Errors

If you encounter errors during `npx pnpm install`, try clearing the npm cache and running the installation again:

```bash
npm cache clean --force
npx pnpm install
```

## Alternative: Installing pnpm Globally

If you prefer to install pnpm globally to avoid using npx each time, you can do so with:

```bash
npm install -g pnpm
```

After this, you can use `pnpm` directly instead of `npx pnpm` in all commands.
