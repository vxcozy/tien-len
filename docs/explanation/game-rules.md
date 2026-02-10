# Tien Len Game Rules

This document provides a complete explanation of Vietnamese Tien Len (also called Thirteen) as implemented in this project.

## Overview

Tien Len is a climbing game where players try to empty their hand by playing increasingly powerful card combinations. The last player with cards loses.

## The Deck

Standard 52-card deck (no jokers).

### Rank Order (Low to High)

```
3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2
```

The 2 is the highest rank, not the lowest. This inversion from Western card games is fundamental to Tien Len strategy.

### Suit Order (Low to High)

```
Spades < Clubs < Diamonds < Hearts
```

Suits matter for breaking ties. When two cards have the same rank, the suit determines which is higher. For example:
- 7 of Spades < 7 of Hearts
- Ace of Clubs < Ace of Diamonds

The highest single card in the deck is the 2 of Hearts. The lowest is the 3 of Spades.

## Card Combinations

Players must play combinations (sets of cards with specific patterns). You cannot add random cards to make a larger set.

### Singles

One card. Any card can be played as a single.

### Pairs

Two cards of the same rank (e.g., two 7s). The suit of the higher card determines the pair's strength.

Example: 7 of Spades + 7 of Hearts is a pair of 7s, represented by the 7 of Hearts (higher suit).

### Triples

Three cards of the same rank (e.g., three Queens). The suit of the highest card determines strength.

### Quads (Four of a Kind)

All four cards of the same rank (e.g., four 5s). Quads have special bomb properties explained below.

### Sequences (Straights)

Three or more consecutive ranks. Important constraints:

- **Minimum length**: 3 cards
- **No 2s allowed**: The 2 is too powerful to appear in sequences
- **No wrapping**: Cannot wrap from 2 to 3 (no circular sequences)

Valid sequences:
- 3-4-5
- 8-9-10-J
- 10-J-Q-K-A (longest valid sequence without 2)

Invalid sequences:
- K-A-2 (contains 2)
- A-2-3 (contains 2)
- 7-8 (only 2 cards)

Suits can differ within a sequence. The highest card's value determines the sequence's strength.

### Double Sequences

Three or more consecutive pairs. This is a sequence where each rank appears exactly twice.

- **Minimum length**: 3 pairs (6 cards)
- **No 2s allowed**: Same restriction as regular sequences
- **Each rank must appear exactly twice**: Not 3-3-4-4-4-5-5 (the triple breaks it)

Valid double sequences:
- 3-3-4-4-5-5 (three consecutive pairs)
- 9-9-10-10-J-J-Q-Q (four consecutive pairs)

Invalid double sequences:
- 5-5-6-6 (only 2 pairs, need at least 3)
- 8-8-9-9-10-10-2-2 (contains 2s)
- 5-5-5-6-6-7-7 (triple 5 breaks the pattern)

Double sequences have special bomb properties explained below.

## Playing Combinations

### Leading

When you lead (start a new round), you can play any valid combination. The next player must play the same type of combination with higher value.

### Following

When following, you must:
1. Play the same type (single matches single, pair matches pair, etc.)
2. Play a higher value of that type
3. For sequences: play the same length

You cannot play a pair to beat a single, or a triple to beat a pair. Type must match.

### Passing

If you cannot or do not wish to play, you pass. Once you pass in a round, you are out until the next round starts.

Passing is temporary. You can play again when a new round begins (when someone wins the current round).

### Round Completion

A round ends when all players except one have passed. The player who played the last combination wins the round and leads the next round. They can play any combination they want (starting fresh).

## Beating Combinations

### Normal Beating

To beat a combination:

1. **Same type required**: Pair beats pair, triple beats triple, etc.
2. **Higher rank**: The high card must be higher rank
3. **Suit tiebreaker**: If ranks are equal, higher suit wins

Examples:
- Pair of 8s beats pair of 6s
- Single King beats single Jack
- 7-8-9 sequence loses to 9-10-J sequence (higher high card)

### Sequences

Sequences must match length. A 5-card sequence can only be beaten by another 5-card sequence with a higher high card.

- 5-6-7-8-9 loses to 6-7-8-9-10 (both 5-card, higher high card)
- Cannot play 5-6-7-8 (4-card) against 5-6-7-8-9 (5-card)

### Double Sequences

Same principle: must match the number of pairs.

- 5-5-6-6-7-7 (3 pairs) can only be beaten by another 3-pair double sequence with higher rank
- Cannot play 8-8-9-9-10-10-J-J (4 pairs) against 5-5-6-6-7-7 (3 pairs)

## Bomb Mechanics

Bombs are special plays that can beat 2s despite type mismatch. This is the exception to the "same type" rule.

### Why Bombs Exist

The 2 is the highest rank, making pairs and triples of 2s extremely powerful. Without bombs, holding multiple 2s would be overwhelming. Bombs provide a counter-strategy, creating interesting tactical decisions about when to use them.

### Quad Bombs

Any quad beats a single 2, pair of 2s, or triple of 2s:

- Four 3s beats a single 2
- Four 10s beats a pair of 2s
- Four Queens beats triple 2s

Quads cannot beat a quad of 2s. To beat four 2s, you would need... nothing. Four 2s is unbeatable by quads.

Actually, you need a higher quad:
- Four 2s vs Four Aces: the 2s win (higher rank)
- Four 2s vs any lesser quad: the 2s win

### Double Sequence Bombs

Long double sequences can bomb 2s based on length:

- **3 pairs** (6 cards): Beats a single 2
- **4 pairs** (8 cards): Beats a pair of 2s
- **5 pairs** (10 cards): Beats triple 2s

The logic: a sequence of 3+ consecutive pairs is rare and powerful enough to overcome one 2. A 4-pair sequence overwhelms two 2s, and so on.

Examples:
- 3-3-4-4-5-5 beats single 2 of Hearts
- 7-7-8-8-9-9-10-10 beats pair of 2s
- 5-5-6-6-7-7-8-8-9-9 beats three 2s

### Bomb vs Bomb

When two bombs collide:

**Quad vs Quad**: Higher rank wins (four Kings beats four 10s)

**Double Sequence vs Double Sequence**: If same length, higher high card wins. If different lengths, they can only beat the appropriate level of 2s (cannot beat each other since lengths differ).

**Quad vs Double Sequence**: These don't interact. A quad of 5s can beat a pair of 2s. A 4-pair double sequence can also beat a pair of 2s. But if someone plays a quad of 5s, you cannot respond with a 4-pair double sequence (different types). You would need a higher quad.

## First Play Rules

### First Game

The player holding the 3 of Spades leads first. They **must** include the 3 of Spades in their first play.

This can be:
- Single 3 of Spades
- Pair including 3 of Spades
- Sequence starting with 3 (like 3-4-5)
- Double sequence starting with 3 (like 3-3-4-4-5-5)

This rule ensures the weakest card gets played early, preventing someone from holding it until the end.

### Subsequent Games

After the first game, the winner of the previous game leads first. They can play any combination (no 3 of Spades requirement).

## Winning and Finishing

### Player Finishing

When you play your last card(s), you are finished. You are placed in the finishing order and stop playing.

If 4 players start and you finish first, you take 1st place. You wait while others continue playing for 2nd, 3rd, and 4th.

### Game End

The game ends when all but one player have finished (or when only one player remains). The remaining player(s) take the last position(s) based on who has more cards left.

Traditional Tien Len has stakes or scoring based on finishing position, but this implementation focuses on the core game mechanics.

## Instant Win Conditions

Three optional instant win conditions can be enabled in game settings. When dealt, the player wins immediately without playing:

### Dragon (13-Card Straight)

One card of each rank: 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2.

This is extremely rare (1 in ~635 billion hands) and honored as an automatic win because attempting to play it is impractical. You would need to win every round and play perfectly sequenced.

### Four 2s

Holding all four 2s. This hand is nearly unbeatable through normal play since 2s are the highest rank.

### Six Pairs

Having six or more pairs in your 13-card hand. With six pairs, you hold 12+ cards in paired form, leaving at most 1 singleton. This hand is highly constrained and difficult to play effectively, so it is honored as an instant win.

These instant wins are checked immediately after dealing. If multiple players have instant wins, they are resolved in order of dealing, or tie-breaking by the specific win condition's strength.

## Strategic Implications

Understanding the rules reveals strategic depth:

**2s are powerful but vulnerable**: High rank makes them strong in normal play, but bombs specifically counter them.

**Sequences require planning**: You must collect consecutive ranks. Breaking a sequence to play something else may cost you later.

**Bomb timing**: Playing a quad early removes four cards from your hand at once. Holding it to bomb 2s later may be stronger, but risky if you never get the chance.

**Passing is tactical**: Passing is not giving up. You pass to let others burn their high cards, then lead the next round with whatever you choose.

**The 3 of Spades burden**: In the first game, whoever holds it must play it early, potentially disrupting their strategy.

These rules create a game of timing, memory (tracking what's been played), and risk assessment (when to use bombs, when to pass). The winner is not always who gets the best cards, but who plays them most effectively.
