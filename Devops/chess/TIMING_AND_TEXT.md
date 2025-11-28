# Custom Timing and Text Display Guide

Your Chess Theory Video Generator now supports custom timing for individual moves and standalone text display!

## What's New 🎉

### 1. TIMING Directive

Control how long each move is displayed on screen.

**Basic Syntax:**
```text
TIMING: move_number duration_in_seconds
```

**Example:**
```text
MOVES:
e4 e6

TEXT: The French Defense
TIMING: 1 3
```

This displays move 1 (e4) for 3 seconds instead of the default 2 seconds.

### 2. DISPLAY Directive

Show text that's not tied to a specific move. Perfect for introductions, strategic commentary, and conclusions.

**Basic Syntax:**
```text
DISPLAY: Your text here
```

**Example:**
```text
DISPLAY: The French Defense is Black's most solid response to 1.e4

MOVES:
e4 e6
```

---

## Complete Example

Here's a complete file using both features:

```text
TITLE: French Defense Analysis
DESCRIPTION: Complete guide to the French Defense opening

DISPLAY: The French Defense is one of Black's most solid and strategic responses to 1.e4

MOVES:
e4 e6

TEXT: Black prepares d5 to challenge the center immediately
TIMING: 1 3

MOVES:
d4 d5

TEXT: Black strikes at the center, leading to closed, strategic positions
TIMING: 2 3

MOVES:
Nc3 Bb4

TEXT: The Winawer Variation - Black pins the knight
TIMING: 3 3.5

DISPLAY: This position showcases the key strategic ideas of the French Defense

MOVES:
e5 c5

TEXT: White gains space, Black counterattacks
TIMING: 4 3

MOVES:
a3 Bxc3+

TEXT: Black trades the bishop, damaging White's pawn structure
TIMING: 5 3.5

DISPLAY: The resulting position is a complex battle between space and piece activity
```

---

## Key Features

### Timing

✅ **Per-Move Control**
- Set individual timing for each move
- Emphasize complex positions (3-4 seconds)
- Quick transitions for simple moves (1-2 seconds)

✅ **Flexible Syntax**
```text
TIMING: 1 2       # Move 1: 2 seconds
TIMING: 2 3.5     # Move 2: 3.5 seconds
TIMING: 10 4      # Move 10: 4 seconds
```

✅ **Smart Defaults**
- If you don't set TIMING for a move, uses command-line `--duration`
- Mixes custom timing with defaults seamlessly
- No need to set every move

### Display Text

✅ **Multiple Displays**
```text
DISPLAY: First introduction

MOVES:
e4 e5

DISPLAY: Strategic commentary after moves

MOVES:
Nf3 Nc6

DISPLAY: Final conclusion
```

✅ **Flexible Placement**
- Before moves for introduction
- Between move groups for commentary
- After moves for conclusion

✅ **Unlimited Text**
- As much text as you want
- Multi-line text supported
- Professional formatting

---

## Timing Guidelines

### By Position Complexity

| Type | Recommended | Example |
|------|---|---|
| Opening moves (simple) | 2-2.5s | e4, e5, Nf3 |
| Development moves | 2-3s | Bc4, O-O, Nd2 |
| Key strategic moves | 3-3.5s | Pins, forks, major attacks |
| Complex tactics | 3.5-4s | Sacrifices, unusual moves |
| Critical positions | 4-5s | End of variation, key moment |

### Example Timing Pattern

```text
# Quick opening setup
TIMING: 1 2       # e4
TIMING: 2 2       # e5
TIMING: 3 2       # Nf3

# Key moves - longer timing
TIMING: 4 3.5     # Bb5 (important pin)
TIMING: 5 3.5     # a6 (challenging the bishop)

# Complex position
TIMING: 6 4       # Ba4 (critical decision)
```

---

## Real-World Example

### Sicilian Defense - Quick Opening

```text
TITLE: Sicilian Defense - Quick Overview
DESCRIPTION: The most popular defense to 1.e4

DISPLAY: The Sicilian Defense is Black's most aggressive response to 1.e4, leading to sharp, tactical games

MOVES:
e4 c5
TIMING: 1 2
TIMING: 2 2

TEXT: The sharp structure of the Sicilian
DISPLAY: Black immediately challenges White's center and avoids symmetrical positions

MOVES:
Nf3 d6
TIMING: 3 2.5
TIMING: 4 2.5

MOVES:
d4 cxd4
TIMING: 5 3
TIMING: 6 3

TEXT: The classic Open Sicilian position
DISPLAY: White's d-pawn is sacrificed for piece activity and initiative

MOVES:
Nxd4 Nf6
TIMING: 7 2
TIMING: 8 2.5

MOVES:
Nc3 a6
TIMING: 9 2
TIMING: 10 2

DISPLAY: This is the Najdorf Variation - one of Black's most respected choices
```

**Result:** A 30-second educational video showing the key moves of the Sicilian Defense

---

## Common Use Cases

### 1. Educational Content

Show introductory text, then explain each position:

```text
DISPLAY: Today we'll learn the Italian Game, one of the oldest and best openings

MOVES:
e4 e5
TEXT: The classical opening
TIMING: 1 2

MOVES:
Nf3 Nc6
TEXT: Both sides develop
TIMING: 2 2.5

MOVES:
Bc4 Bc5
TEXT: The Italian Game setup complete
TIMING: 3 3.5

DISPLAY: This position balances piece activity with pawn structure
```

### 2. Tactical Analysis

Emphasize complex moves:

```text
DISPLAY: Let's analyze a fascinating tactical sequence

MOVES:
e4 c5
TIMING: 1 2
TIMING: 2 2

MOVES:
Nf3 d6
TIMING: 3 2
TIMING: 4 2

MOVES:
d4 cxd4
TEXT: The critical central exchange
TIMING: 5 4

DISPLAY: This move opens up the position for White's attack
```

### 3. Opening Repertoire

Different timing for different moves:

```text
TITLE: My Opening Repertoire - White

MOVES:
e4 c5
TIMING: 1 2
TIMING: 2 2

MOVES:
Nf3 d6
TEXT: My main line
TIMING: 3 3
TIMING: 4 3

MOVES:
d4 cxd4
TEXT: Solid and popular
TIMING: 5 3
TIMING: 6 3

DISPLAY: This opening leads to rich, interesting positions
```

---

## Command-Line Compatibility

### Timing Priority

1. **File TIMING directive** (highest priority)
2. **Command-line `--duration`** (fallback)

```bash
# Command-line sets default
.venv/bin/python main.py -i theory.txt -o video.mp4 --duration 2

# File TIMING directives override this for specific moves
TIMING: 1 3   # This uses 3 seconds, not the 2-second default
TIMING: 2 2   # This uses 2 seconds (same as default)
TIMING: 3 2.5 # This uses 2.5 seconds
```

### Example

**File: theory.txt**
```text
TITLE: Example

MOVES:
e4 e5

TEXT: First moves
TIMING: 1 3      # 3 seconds
TIMING: 2 2      # 2 seconds
```

**Command:**
```bash
.venv/bin/python main.py -i theory.txt -o video.mp4 --duration 2.5

# Result:
# Move 1: 3 seconds (from file TIMING)
# Move 2: 2 seconds (from file TIMING)
# Move 3+: 2.5 seconds (from --duration flag)
```

---

## Mixing Formats

You can mix timing with all input formats:

### Simple Annotated + Timing

```text
1. e4 - King's pawn opening
2. e5 - Black responds
3. Nf3 - Develop the knight

TIMING: 1 3
TIMING: 2 3
TIMING: 3 3.5
```

### Structured + Timing

```text
TITLE: Opening

MOVES:
e4 e5
Nf3 Nc6
Bc4 Bc5

TEXT: The Italian Game
TIMING: 1 2
TIMING: 2 2.5
TIMING: 3 3
```

### PGN + Timing

```text
1. e4 e5 2. Nf3 Nc6 3. Bc4

TIMING: 1 2
TIMING: 2 2
TIMING: 3 3
```

---

## Practical Tips

### 1. Start with Default Timing
```bash
.venv/bin/python main.py -i theory.txt -o video.mp4 --duration 2
```

Then add TIMING only for emphasis:

```text
TIMING: 5 3.5    # Key move - longer
TIMING: 10 4     # Critical position - even longer
```

### 2. Test Before Full Generation

Quick test with small board:
```bash
.venv/bin/python main.py -i theory.txt -o test.mp4 --size 600 --duration 2
```

Then full render:
```bash
.venv/bin/python main.py -i theory.txt -o final.mp4 --size 1280 --fps 60
```

### 3. Consistent Timing

Use similar timing for similar positions:

```text
# Simple opening moves - 2 seconds each
TIMING: 1 2
TIMING: 2 2
TIMING: 3 2

# Development moves - 2.5 seconds each
TIMING: 4 2.5
TIMING: 5 2.5
TIMING: 6 2.5

# Key moves - 3+ seconds
TIMING: 7 3
TIMING: 8 3.5
TIMING: 9 3.5
```

### 4. Strategic Display Text

```text
DISPLAY: This opening emphasizes piece activity

MOVES:
e4 e5
Nf3 Nc6
Bc4 Bc5

DISPLAY: The resulting position balances both sides perfectly
```

---

## Troubleshooting

### TIMING Not Working

**Check:**
- TIMING comes AFTER the moves and TEXT
- Format is correct: `TIMING: move_number duration`
- Move number matches the move count

**Wrong:**
```text
TIMING: 1 3      # ❌ Before MOVES!
MOVES:
e4
```

**Right:**
```text
MOVES:
e4
TIMING: 1 3      # ✅ After MOVES!
```

### Display Text Not Showing

**Check:**
- DISPLAY is on its own line (not inside MOVES section)
- Colon is present: `DISPLAY: text`

**Wrong:**
```text
DISPLAY The text   # ❌ Missing colon
```

**Right:**
```text
DISPLAY: The text  # ✅ Has colon
```

---

## Examples Reference

The `examples/` directory includes:

- `sample_analysis.txt` - **Complete example with all features**
  - Uses TITLE, DESCRIPTION, DISPLAY, MOVES, TEXT, TIMING
  - 20 moves with custom timing (3-3.5 seconds each)
  - 2 standalone DISPLAY sections
  - Perfect template to copy from

---

## Quick Syntax Summary

### TIMING
```text
TIMING: 1 3       # Move 1 for 3 seconds
TIMING: 5 3.5     # Move 5 for 3.5 seconds
TIMING: 10 4      # Move 10 for 4 seconds
```

### DISPLAY
```text
DISPLAY: Introductory text here

DISPLAY: Commentary text

DISPLAY: Conclusion text here
```

### Full Template
```text
TITLE: Your Title
DESCRIPTION: Your description

DISPLAY: Intro text

MOVES:
move1 move2

TEXT: Description
TIMING: 1 3

DISPLAY: Commentary

MOVES:
move3 move4

TEXT: More description
TIMING: 3 3.5

DISPLAY: Conclusion
```

---

## Next Steps

1. **Create a theory file** with TITLE, MOVES, TEXT, TIMING
2. **Add DISPLAY sections** for context
3. **Generate the video** with custom timing
4. **View the result** and adjust timing as needed

**Example:**
```bash
.venv/bin/python main.py -i my_theory.txt -o my_video.mp4 --size 800
```

---

## Support

For more information:
- [FORMAT_GUIDE.md](FORMAT_GUIDE.md) - All format details
- [UPDATES.md](UPDATES.md) - What's new
- [CHEATSHEET.md](CHEATSHEET.md) - Quick reference
- `examples/sample_analysis.txt` - Working example

---

**Happy creating!** 🎬♟️

Time to make your chess videos truly shine with custom pacing and professional commentary!
