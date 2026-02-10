# Your First Game

## Introduction

Now that you have the development environment set up, this tutorial will walk you through playing your first game of Tien Len against the AI opponent. You'll learn how to navigate the game interface, understand the controls, and play through a complete game.

## What You'll Learn

- How to start a single-player game against AI
- Understanding the game user interface
- How to select and play cards
- How to pass your turn
- What happens when the game ends

## Prerequisites

Before starting this tutorial, make sure you have:

- Completed the **Getting Started** tutorial
- The development server running at `http://localhost:3000`

If the server is not running, start it with:

```bash
npx pnpm dev
```

## Step 1: Navigate to the Home Page

Open your web browser and go to:

```
http://localhost:3000
```

You should see the Tien Len home page with the game title and menu options.

## Step 2: Start a Game Against AI

On the home page, look for the button labeled **"Play vs AI"** and click it.

The game will immediately start loading. You should see a transition animation, and within a second or two, the game board will appear.

## Step 3: Understand the Game Interface

Once the game loads, take a moment to familiarize yourself with the interface. The screen is designed to look like a poker table and contains several key areas:

### The Poker Table

The main play area resembles a green felt poker table. This is where played cards appear during the game.

### Your Hand (Card Fan)

At the bottom of the screen, you'll see your cards arranged in a fan layout. These are the 13 cards you've been dealt at the start of the game. The cards are automatically sorted by rank and suit.

### Opponent Areas

Around the table, you'll see areas representing the AI opponents. In a four-player game, there will be three AI players positioned around the table. Each opponent's area shows:

- Their player name or avatar
- The number of cards they have remaining
- Any cards they've played in the current trick

### Control Panel

Near your hand, you'll find the game controls:

- **Play** button: Submit your selected cards
- **Pass** button: Skip your turn without playing cards

These buttons will be enabled or disabled based on what actions are legal at the current moment.

### Game Information

At the top or side of the screen, you may see additional information such as:

- Current turn indicator
- Previous plays
- Game messages or notifications

## Step 4: Select Cards to Play

To play cards, you need to select them from your hand. Here's how:

1. **Click on a card** in your hand to select it. The card will visually lift up or highlight to indicate it's selected.

2. **Click the card again** to deselect it if you change your mind.

3. **Select multiple cards** by clicking each one. You can select combinations like pairs, three-of-a-kind, or sequences.

### Understanding Valid Plays

Tien Len has specific rules about which card combinations you can play:

- **Single card**: One card
- **Pair**: Two cards of the same rank
- **Three of a kind**: Three cards of the same rank
- **Four of a kind**: Four cards of the same rank
- **Sequence**: Three or more consecutive cards (e.g., 3-4-5)
- **Double sequence**: Three or more consecutive pairs (e.g., 3-3-4-4-5-5)

The game will validate your selection when you try to play.

## Step 5: Play Your Cards

Once you've selected the cards you want to play:

1. **Click the "Play" button** to submit your cards.

2. The game will check if your play is valid:
   - If valid, your cards will move to the center of the table
   - If invalid, you'll see an error message and need to select different cards

3. After a successful play, the turn passes to the next player.

### First Play of the Game

The player with the 3 of Spades must play it to start the game. If you have the 3 of Spades, it will be indicated, and you must include it in your first play.

### Following a Play

When it's your turn and cards are already on the table, you must play a higher combination of the same type. For example:

- If a single 7 is played, you must play a single card higher than 7
- If a pair of 9s is played, you must play a pair higher than 9s

## Step 6: Pass Your Turn

If you cannot or do not want to play cards:

1. **Click the "Pass" button**.

2. Your turn ends, and play moves to the next player.

3. You cannot pass on the first play if you have the 3 of Spades.

### When Everyone Passes

If all other players pass in sequence, the trick is won, and the center of the table clears. The winner of the trick leads the next round and can play any valid combination.

## Step 7: Watch the AI Players

After your turn, the AI opponents will take their turns automatically. Watch as they:

- Play cards from their hands
- Pass when they can't beat the current play
- React to the game state with different strategies

This is a great opportunity to learn the game flow and observe different playing strategies.

## Step 8: Continue Playing

Keep playing cards until you run out. The game continues with turns rotating around the table. You'll see:

- Your hand getting smaller as you play cards
- Opponents' card counts decreasing
- The table clearing when tricks are won
- Cards moving with smooth animations

## Step 9: Game Over

The game ends when a player runs out of cards. Here's what happens:

### If You Win

If you're the first to play all your cards, you'll see a **victory screen** with:

- A congratulatory message
- Your final rank (1st place)
- Statistics about the game
- Options to play again or return to the menu

### If an AI Wins

If an AI opponent wins, you'll see a **game over screen** showing:

- Which player won
- Your final rank (2nd, 3rd, or 4th)
- Game statistics
- Options to play again or return to the menu

### Understanding Rankings

Tien Len continues even after the first player wins. The game typically continues until all players have played all their cards, establishing a final ranking from 1st to 4th place.

## Step 10: Play Again or Exit

After the game ends, you have several options:

- **Play Again**: Start a new game against AI with freshly dealt cards
- **Return to Menu**: Go back to the home page to choose different game modes
- **View Statistics**: See detailed information about the game that just finished

## What You've Accomplished

You have successfully:

- Started a single-player game against AI opponents
- Learned to navigate the game interface
- Selected and played cards
- Passed turns when appropriate
- Completed a full game of Tien Len

## Next Steps

Now that you know how to play against AI, you might want to try multiplayer with real players. Continue to the next tutorial: **Host a Multiplayer Game** to learn how to create and join multiplayer rooms.

## Tips for Better Play

### Card Selection Strategy

- Play your lowest cards early to avoid being stuck with them
- Save strong combinations (sequences, four-of-a-kind) for when you need them
- Watch what other players are passing on to gauge their hands

### Understanding Card Strength

In Tien Len, cards are ranked from lowest to highest:

- **Rank order**: 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2
- **Suit order** (for breaking ties): Spades, Clubs, Diamonds, Hearts

The 2 of Hearts is the single highest card in the game.

### When to Pass

Consider passing when:

- You want to conserve strong cards for later
- Playing would leave you with difficult cards to play
- You want to let the trick cycle back so you can lead

## Troubleshooting

### Cards Won't Select

If you can't select cards, make sure:

- It's currently your turn (check the turn indicator)
- You're clicking directly on the card images
- The game hasn't ended

### Play Button Is Disabled

The Play button will be disabled if:

- You haven't selected any cards
- Your selected combination is invalid
- It's not your turn

### Game Seems Stuck

If the game appears frozen:

- Refresh the browser page
- Check the browser console for errors (F12 or Right-click > Inspect)
- Restart the development server if needed
