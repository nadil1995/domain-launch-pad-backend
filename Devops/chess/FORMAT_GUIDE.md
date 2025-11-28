# Input Format Guide

Complete guide to all supported input formats and features for Chess Theory Video Generator.

## Supported Formats

### Format 1: Simple Annotated Notation (Easiest)

Basic format with move descriptions after dashes:

```text
Opening: Italian Game

1. e4 - King's pawn opening, the most popular first move
2. e5 - Black responds symmetrically
3. Nf3 - Develop the knight
4. Nc6 - Black develops too
5. Bc4 - The Italian Game begins
```

**Features:**
- Simple and intuitive
- One move per line
- Annotation after dash
- No special syntax required

**Best for:** Quick theories, simple openings, beginner content

---

### Format 2: Structured Format (Most Powerful)

Advanced format with explicit sections for maximum control:

```text
TITLE: French Defense Complete Analysis
DESCRIPTION: A comprehensive guide to the French Defense opening

DISPLAY: The French Defense is Black's most solid response to 1.e4

MOVES:
e4 e6

TEXT: The French Defense - Black immediately prepares d5
TIMING: 1 3

MOVES:
d4 d5

TEXT: Black challenges the center head-on
TIMING: 2 3.5
```

**Sections:**

#### TITLE
Set the video title (displayed in intro screen)
```text
TITLE: Opening Name
```

#### DESCRIPTION
Set the video description (displayed in intro screen)
```text
DESCRIPTION: Brief description of the opening
```

#### DISPLAY
Standalone text to display (not tied to a specific move). Useful for introductions, conclusions, or commentary between moves.
```text
DISPLAY: This position illustrates a key strategic concept
```

#### MOVES
Chess moves in any combination of formats:
- Algebraic notation: `e4`, `Nf3`, `Bc4`, `O-O`
- Multiple moves per line: `e4 e5 Nf3 Nc6`
- Can be split across multiple lines
```text
MOVES:
e4 e5
Nf3 Nc6
Bc4 Bc5
```

#### TEXT
Annotation for the most recent move(s)
```text
TEXT: Explanation of the move or position
```

#### TIMING
Custom duration for specific moves (in seconds)
```text
TIMING: move_number duration
```

Examples:
```text
TIMING: 1 3        # Show move 1 for 3 seconds
TIMING: 5 3.5      # Show move 5 for 3.5 seconds
TIMING: 10 2       # Show move 10 for 2 seconds
```

---

### Format 3: PGN with Comments

Standard PGN (Portable Game Notation) with comments in curly braces:

```text
[Event "Chess Theory"]
[Opening "Ruy Lopez"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
{The Ruy Lopez, one of the oldest and most popular openings}
4. Ba4 Nf6 5. O-O Be7
{White's bishop retreats but maintains pressure on the center}
```

**Features:**
- Standard chess format
- Comments in `{curly braces}`
- Header information preserved
- Full PGN compatibility

**Best for:** Importing existing games, professional format

---

### Format 4: UCI Notation

Universal Chess Interface notation (square to square):

```text
TITLE: Modern Opening
DESCRIPTION: UCI notation example

MOVES:
e2e4 e7e5
g1f3 b8c6
f1b5 a7a6

TEXT: The Ruy Lopez setup
```

**Features:**
- Precise move notation
- Useful for engines and analysis

---

## Advanced Features

### Mixing Formats

You can combine elements from different formats:

```text
TITLE: Hybrid Example

Opening: Italian Game

1. e4 - King's pawn
2. e5 - Black responds

MOVES:
Nf3 Nc6
Bc4 Bc5

TEXT: The Italian Game setup
TIMING: 3 3
TIMING: 4 3
```

### Complete Example with All Features

```text
TITLE: French Defense - Winawer Variation
DESCRIPTION: A sharp and strategic battle in the heart of the opening

DISPLAY: The Winawer Variation is one of Black's most ambitious tries in the French Defense

MOVES:
e4 e6

TEXT: Black establishes the French Defense pawn structure
TIMING: 1 3

MOVES:
d4 d5

TEXT: Black immediately challenges White's center
TIMING: 2 3.5

MOVES:
Nc3 Bb4

TEXT: The Winawer pin! This move is the hallmark of this variation
TIMING: 3 4

MOVES:
e5 c5

TEXT: Strategic center battle - White gains space but Black strikes back
TIMING: 4 3.5

MOVES:
a3 Bxc3+

TEXT: Black trades pieces, damaging White's pawn structure
TIMING: 5 3.5

DISPLAY: This dynamic position shows the essence of the Winawer Variation - Black sacrifices space for piece play and counterattacking chances
```

---

## Chess Notation Reference

### Piece Abbreviations
- **K** = King
- **Q** = Queen
- **R** = Rook
- **B** = Bishop
- **N** = Knight
- **(no letter)** = Pawn

### Move Notation
- `e4` = Pawn to e4
- `Nf3` = Knight to f3
- `Bxc6` = Bishop captures on c6
- `Nxd5+` = Knight captures on d5, giving check
- `Qd8#` = Queen to d8, checkmate
- `O-O` = Castling kingside (short castle)
- `O-O-O` = Castling queenside (long castle)
- `e8=Q` = Pawn promotion to queen

### Square Names
- Files (columns): a, b, c, d, e, f, g, h (left to right)
- Ranks (rows): 1, 2, 3, 4, 5, 6, 7, 8 (bottom to top for White)
- Examples: e4, a1, h8, d5

### Symbols
- `x` = Capture (Nxe4)
- `+` = Check
- `#` = Checkmate
- `!` = Good move
- `?` = Bad move
- `...` = Black's move (in PGN)

---

## Timing Guidelines

### Recommended Timing by Position Type

| Position Type | Recommended | Example |
|---|---|---|
| Opening moves | 2-2.5s | e4, e5, Nf3 |
| Key strategic moves | 3-3.5s | Bb5 (pin), O-O (castle) |
| Complex positions | 3.5-4s | Sacrifices, tactical moves |
| Endgame moves | 2-3s | Simple transitions |
| Critical moments | 4-5s | Final moves of theory |

### Examples

```text
# Quick opening - standard timing
TIMING: 1 2
TIMING: 2 2
TIMING: 3 2

# Key move - longer timing
TIMING: 4 3.5

# Critical position - extended timing
TIMING: 10 4.5
```

---

## Best Practices

### 1. Clear Titles and Descriptions
```text
# Good
TITLE: Sicilian Defense - Dragon Variation
DESCRIPTION: One of Black's most aggressive responses to 1.e4

# Avoid
TITLE: opening
DESCRIPTION: some theory
```

### 2. Informative Annotations
```text
# Good
TEXT: The pin on the e-file becomes a key feature of this position

# Avoid
TEXT: move
```

### 3. Consistent Timing
```text
# Good - consistent with variations for emphasis
TIMING: 1 2
TIMING: 2 2
TIMING: 3 2.5      # Slightly longer for key move
TIMING: 4 2

# Avoid - erratic timing
TIMING: 1 1
TIMING: 2 5
TIMING: 3 1.5
```

### 4. Strategic Use of DISPLAY
```text
# Good - provides context
DISPLAY: This opening leads to sharp tactical battles

DISPLAY: The resulting position is considered roughly equal

# Avoid - overuse
DISPLAY: move 1
DISPLAY: move 2
DISPLAY: move 3
```

---

## Troubleshooting

### Problem: Moves not recognized

**Check:**
- Move notation is correct chess notation
- Moves are legal in the position
- No typos in piece names

**Example:**
```text
# Wrong
e9         # e9 doesn't exist
Ke5        # King can't move there
N2f3       # Unclear notation

# Right
e4
Nf3
Bb5
```

### Problem: TIMING not working

**Check:**
- TIMING comes AFTER the TEXT line
- Format is: `TIMING: move_number duration`
- Move number matches actual move count

**Example:**
```text
# Wrong
TIMING: 1 3
MOVES:
e4

# Right
MOVES:
e4
TEXT: First move
TIMING: 1 3
```

### Problem: DISPLAY text not showing

**Check:**
- DISPLAY line is standalone (not part of MOVES)
- Text content is after the colon

**Example:**
```text
# Wrong
DISPLAY The French Defense

# Right
DISPLAY: The French Defense
```

---

## Complete Example Files

See the `examples/` directory for ready-to-use examples:

- `ruy_lopez.txt` - Simple annotated format
- `italian_game.txt` - Structured format
- `sicilian_defense.txt` - Multiple move pairs
- `kings_indian.txt` - Advanced structure
- `scholars_mate.txt` - Complete game
- `sample_analysis.txt` - Full featured with timing

---

## Tips

1. **Start Simple**: Begin with Format 1 (Simple Annotated), then move to Format 2 (Structured) for more control

2. **Test Your Format**: Use `python test_app.py` to verify parsing works

3. **Use Timing Strategically**: Longer timing for complex moves, shorter for simple transitions

4. **Add Context**: Use DISPLAY to provide strategic or tactical context

5. **Vary Length**: Mix TEXT annotations with standalone DISPLAY sections for better pacing

---

For more help, see:
- [HOW_TO_RUN.md](HOW_TO_RUN.md) - Running the application
- [CHEATSHEET.md](CHEATSHEET.md) - Quick command reference
- [README.md](README.md) - Full documentation
