# Host a Multiplayer Game

## Introduction

This tutorial will guide you through creating and hosting a multiplayer game of Tien Len. You'll learn how to set up a game room, invite other players, and start a multiplayer match with real people.

## What You'll Learn

- How to access the multiplayer lobby
- How to create a new game room
- How to share your room code with other players
- How other players can join your room
- How to ready up and start the game
- The differences between hosting and joining a room

## Prerequisites

Before starting this tutorial, make sure you have:

- Completed the **Getting Started** and **Your First Game** tutorials
- The development server running at `http://localhost:3000` and `http://localhost:3001`
- At least one other person who wants to play (or a second browser/device for testing)

If the servers are not running, start them with:

```bash
npx pnpm dev
```

## Step 1: Navigate to the Lobby

Open your web browser and go to:

```
http://localhost:3000
```

From the home page, look for a button or link labeled **"Multiplayer"** or **"Lobby"**, and click it. Alternatively, you can navigate directly to:

```
http://localhost:3000/lobby
```

You should now see the multiplayer lobby interface.

## Step 2: Enter Your Player Name

When you first enter the lobby, you'll be prompted to enter your player name. This is the name other players will see during the game.

1. **Type your desired name** in the text input field.
   - Choose something memorable and appropriate
   - Names are typically limited to a reasonable length (e.g., 20 characters)

2. **Click "Continue"** or press Enter to confirm your name.

Your name will be stored for the session, so you won't need to enter it again unless you refresh the page.

## Step 3: Create a New Room

Now you're ready to create a game room. On the lobby screen, you should see options for creating or joining a room.

1. **Click the "Create Room" button**.

2. The server will generate a new room and assign it a unique 6-character room code.

3. You'll be automatically moved into your newly created room.

### Understanding Your Role

As the room creator, you are the **host**. This gives you special privileges:

- You can see when other players join
- You control when the game starts
- The game won't begin until you click the start button

## Step 4: Share the Room Code

Once your room is created, you'll see a **6-character room code** displayed prominently on the screen. This code is case-insensitive and might look something like:

```
ABC123
```

Share this code with the players you want to invite. You can:

- Tell them the code verbally if you're in the same location
- Send it via text message, email, or chat
- Share your screen if you're on a video call

All players need to use this code to join your specific game room.

## Step 5: Wait for Players to Join

While waiting for other players, you'll see the room status:

- **Your name** listed as the host
- **Empty player slots** for players who haven't joined yet
- A **ready status** for each player (not ready by default)

### Minimum Players

Tien Len typically requires 4 players. Some implementations allow 2-4 players, but the classic game is played with exactly 4 players.

Watch the screen as other players join your room. You'll see their names appear in real-time as they connect.

## Step 6: How Other Players Join Your Room

Share these instructions with players who want to join your game:

### For Joining Players

1. **Open the game** at `http://localhost:3000`

2. **Navigate to the lobby** by clicking "Multiplayer" or going to `/lobby`

3. **Enter their player name** when prompted

4. **Click "Join Room"** instead of "Create Room"

5. **Enter the 6-character room code** you shared with them

6. **Click "Join"** or press Enter

They will be connected to your room and their name will appear in your player list.

## Step 7: Players Ready Up

Before the game can start, all players must indicate they are ready:

### If You're the Host

1. Once you're satisfied with the player count and ready to begin, click the **"Ready" button**.

2. Your status will change from "Not Ready" to "Ready".

3. Wait for all other players to mark themselves as ready.

### If You're a Joining Player

After joining a room:

1. Review the other players in the room.

2. When you're ready to play, click the **"Ready" button**.

3. Your status will change to "Ready" and the host will see this.

### Ready Status Indicators

You'll see visual indicators for each player's ready status:

- **Not Ready**: Grayed out, dimmed, or with a "waiting" icon
- **Ready**: Highlighted, with a checkmark, or in green

All players can toggle their ready status on and off by clicking the Ready button again.

## Step 8: Start the Game

Once all players are marked as ready, the host can start the game.

### As the Host

1. Verify that **all player slots** are filled and **all players show as "Ready"**.

2. The **"Start Game" button** should now be enabled.

3. **Click "Start Game"** to begin the match.

4. The server will:
   - Deal cards to all players
   - Determine who goes first (player with 3 of Spades)
   - Transition everyone to the game screen

### What Happens Next

All players in the room will simultaneously:

- See a loading or transition animation
- Be moved to the game screen
- Receive their 13 cards
- See the other players positioned around the table

The game will begin with the player who has the 3 of Spades taking the first turn.

## Step 9: Play the Multiplayer Game

The multiplayer game works similarly to the AI game, with a few key differences:

### Real-Time Multiplayer

- **Wait for your turn**: You can only play when it's your turn
- **See live updates**: Watch other players' moves in real-time
- **No AI**: All players are real people making their own decisions
- **Chat (if available)**: Some implementations include a chat feature

### Turn Order

Players take turns in a fixed order around the table. The turn indicator will show whose turn it currently is.

### Disconnections

If a player disconnects:

- The game may pause
- The room may allow them to reconnect
- Or the game may end, depending on the implementation

Refer to the on-screen messages if a disconnection occurs.

## Step 10: Game Completion

The game continues until players play all their cards, establishing a final ranking.

### End-of-Game Screen

When the game ends, all players will see:

- Final rankings (1st, 2nd, 3rd, 4th place)
- Game statistics
- Options to:
  - Return to lobby
  - Play again with the same players
  - Exit to main menu

### Playing Again

If all players want to play another round:

1. Return to the lobby
2. The host creates a new room or you rejoin the existing room
3. Ready up and start a new game

## What You've Accomplished

You have successfully:

- Navigated to the multiplayer lobby
- Created a new game room
- Shared your room code with other players
- Waited for players to join
- Readied up along with all players
- Started a multiplayer game as the host
- Played a full multiplayer match with real players

## Tips for Hosting

### Good Hosting Practices

- **Communicate clearly**: Make sure all players have the room code
- **Wait for everyone**: Don't start until all players are present and ready
- **Check ready status**: Verify everyone has clicked Ready before starting
- **Be patient**: Give players time to understand the game if they're new

### Managing Your Room

- If someone joins by mistake, some implementations allow the host to remove players
- If a player is unresponsive, you may need to wait or restart the room
- Make sure everyone has a stable internet connection before starting

## Troubleshooting

### Can't Create a Room

If you can't create a room:

- Check that both servers are running (web and Socket.io server)
- Verify you're connected to the internet
- Check the browser console for error messages (F12)
- Ensure the Socket.io server is running on port 3001

### Room Code Doesn't Work

If players can't join with the room code:

- Verify the code is correct (codes are case-insensitive)
- Make sure the room still exists (rooms may expire after inactivity)
- Check that both players are connected to the same server
- Try creating a new room

### Player Names Don't Appear

If player names aren't showing up:

- Refresh the page and re-enter the lobby
- Check your network connection
- Verify the Socket.io server is running properly
- Check the browser console for WebSocket connection errors

### Start Button Won't Enable

The Start button will only enable when:

- You are the host
- All player slots are filled (typically 4 players)
- All players have marked themselves as "Ready"

Double-check that all conditions are met.

### Game Starts But Players Don't See Cards

If the game starts but cards don't appear:

- Check the browser console for errors
- Try refreshing the page (you may be able to reconnect)
- Ensure all players have a stable connection
- Restart the game if necessary

## Advanced: Testing Multiplayer Solo

For development or testing purposes, you can simulate multiple players:

### Option 1: Multiple Browser Windows

1. Open the game in multiple browser windows
2. Use different player names in each window
3. Create a room in one window
4. Join the room with the other windows using the room code

### Option 2: Different Browsers

1. Use different browsers (Chrome, Firefox, Safari)
2. Follow the same process as above
3. This better simulates independent players

### Option 3: Incognito/Private Windows

1. Use incognito or private browsing windows
2. Each window will be treated as a separate player session
3. Useful for quick testing without clearing cookies

### Option 4: Multiple Devices

1. Access the game from different devices on the same network
2. Use your computer's local IP instead of localhost
3. For example: `http://192.168.1.100:3000`

## Next Steps

Now that you've mastered hosting multiplayer games, you can:

- Experiment with different strategies against real opponents
- Explore the codebase to understand the multiplayer implementation
- Consider contributing features like chat or player profiles
- Check out the other documentation for advanced topics

Enjoy playing Tien Len with your friends!
