# Text-to-Speech Narrator Guide

Add professional narration to your chess theory videos with text-to-speech!

## What's New 🎤

Your Chess Theory Video Generator now supports **automatic text-to-speech narration** that reads your annotations and display text aloud.

### Features

✅ **Text-to-Speech Narration**
- Automatically narrate all TEXT annotations
- Narrate standalone DISPLAY sections
- Professional natural-sounding voice
- Customizable speech rate

✅ **Easy to Use**
- Single command-line flag: `--narrator`
- No additional setup required
- Works with all input formats
- Optional feature (doesn't affect existing videos)

✅ **Customizable**
- Adjust speech rate (words per minute)
- Multiple voice options
- Smart timing integration

---

## Installation

### Step 1: Install pyttsx3

The narrator uses `pyttsx3` for text-to-speech. Install it with:

```bash
.venv/bin/python -m pip install pyttsx3
```

Or update all dependencies:

```bash
.venv/bin/python -m pip install -r requirements.txt
```

### Step 2: Verify Installation

```bash
.venv/bin/python -c "import pyttsx3; print('✓ pyttsx3 installed')"
```

---

## Quick Start

### Generate video with narration:

```bash
.venv/bin/python main.py \
  -i examples/sample_analysis.txt \
  -o video_with_narration.mp4 \
  --narrator
```

### Control speech rate:

```bash
# Slower speech (100 wpm)
.venv/bin/python main.py -i theory.txt -o video.mp4 --narrator --narrator-rate 100

# Faster speech (200 wpm)
.venv/bin/python main.py -i theory.txt -o video.mp4 --narrator --narrator-rate 200

# Default speed (150 wpm)
.venv/bin/python main.py -i theory.txt -o video.mp4 --narrator --narrator-rate 150
```

---

## What Gets Narrated?

### TEXT Annotations

Any TEXT line in your theory file will be narrated:

```text
MOVES:
e4 e5

TEXT: The opening moves establish the center control
TIMING: 1 3
```

The text "The opening moves establish the center control" will be narrated.

### DISPLAY Sections

Standalone DISPLAY text is also narrated:

```text
DISPLAY: The French Defense is Black's best response to 1.e4

MOVES:
e4 e6

DISPLAY: This position shows the key strategic ideas
```

Both DISPLAY sections will be narrated.

### Example

**File: my_theory.txt**
```text
TITLE: French Defense

DISPLAY: The French Defense is Black's best response to 1.e4

MOVES:
e4 e6

TEXT: Black prepares d5 immediately
TIMING: 1 3

MOVES:
d4 d5

TEXT: Black challenges the center head-on
TIMING: 2 3.5

DISPLAY: This position is the starting point for detailed analysis
```

**Result when `--narrator` is enabled:**
- Intro screen with title
- "The French Defense is Black's best response to 1.e4" (narrated)
- e4 displayed for 3 seconds while "Black prepares d5 immediately" is narrated
- e5 displayed for 3 seconds (no narration)
- d4 displayed for 3.5 seconds while "Black challenges the center head-on" is narrated
- d5 displayed for 3.5 seconds (no narration)
- "This position is the starting point for detailed analysis" (narrated)
- Outro screen

---

## Command-Line Options

### `--narrator`

Enable text-to-speech narration for all TEXT and DISPLAY sections.

```bash
.venv/bin/python main.py -i theory.txt -o video.mp4 --narrator
```

### `--narrator-rate`

Set the narration speed in words per minute (default: 150).

```bash
--narrator-rate 100   # Slow
--narrator-rate 150   # Normal (default)
--narrator-rate 200   # Fast
```

**Recommended values:**
- 100-120 wpm: Clear, slow for beginners
- 130-150 wpm: Standard, balanced
- 170-200 wpm: Fast, for experienced audiences

---

## Best Practices

### 1. Write Clear Annotations

Narration works best with clear, concise text:

```text
# Good
TEXT: The bishop attacks the weak f7 square

# Avoid
TEXT: b
TEXT: bshp atks f7 - weak
```

### 2. Match Timing to Narration

Adjust move timing to match narration duration:

```text
# This might not have enough time for the narration
TIMING: 1 2

# Better - gives time for narration
TIMING: 1 4
```

### 3. Use Professional Language

For formal content, use professional terminology:

```text
# Professional
TEXT: This position demonstrates the concept of tempus (gain of time) through piece activity

# Casual
TEXT: Here we get ahead in development
```

### 4. Break Long Text

If text is too long, break it into multiple sections:

```text
# Too long
TEXT: The Sicilian Defense is Black's most aggressive response to 1.e4 and leads to sharp tactical battles with both sides fighting for the initiative in the center

# Better
DISPLAY: The Sicilian Defense is Black's most aggressive response to 1.e4
DISPLAY: It leads to sharp tactical battles with both sides fighting for initiative

MOVES:
e4 c5
TEXT: The Sicilian challenges the center immediately
TIMING: 1 3
```

---

## Timing and Narration

The narrator automatically adjusts video timing to accommodate narration:

```text
MOVES:
e4 e5

TEXT: This is a simple opening move
TIMING: 1 3
```

**What happens:**
1. Text is converted to speech
2. Duration is estimated (usually 2-4 seconds)
3. Move is displayed for max(TIMING duration, narration duration)
4. Narration plays during the move display

This ensures narration isn't cut off or rushed.

---

## Examples

### Example 1: Simple Opening with Narration

```text
TITLE: King's Pawn Opening

DISPLAY: In this lesson, we'll explore the King's Pawn Opening

MOVES:
e4

TEXT: White opens with the king's pawn, controlling the center
TIMING: 1 3

MOVES:
e5

TEXT: Black mirrors the opening, establishing symmetrical control
TIMING: 2 3

DISPLAY: Both sides have equal central control and can now develop pieces
```

**Generate with:**
```bash
.venv/bin/python main.py -i opening.txt -o opening_narrated.mp4 --narrator
```

### Example 2: Tactic Explanation

```text
TITLE: The Two-Move Checkmate

DISPLAY: Let's analyze a quick and devastating checkmate pattern

MOVES:
f3 e5

TEXT: Black plays e5, White has set a trap
TIMING: 1 3

MOVES:
g4 Qh5

TEXT: Black falls for the trap with an immediate checkmate threat
TIMING: 2 4

DISPLAY: This is a good reminder to always check for back rank threats
```

**Generate with:**
```bash
.venv/bin/python main.py -i tactic.txt -o tactic_narrated.mp4 --narrator --narrator-rate 120
```

### Example 3: Slower Narration for Beginners

```bash
# Slower speech for educational content
.venv/bin/python main.py \
  -i beginner_opening.txt \
  -o beginner_video.mp4 \
  --narrator \
  --narrator-rate 120 \
  --duration 4
```

---

## Troubleshooting

### Issue: "pyttsx3 is required"

**Solution:** Install pyttsx3

```bash
.venv/bin/python -m pip install pyttsx3
```

### Issue: No sound in video

**Possible causes:**
1. Narration is being generated but not added to video
2. Your system doesn't have default audio output
3. Video player doesn't support the audio codec

**Solution:**
- Try with a shorter text to test
- Check that pyttsx3 works: `python narrator.py`
- Try a different video player

### Issue: Narration sounds robotic

**Solution:**
- This is normal for text-to-speech
- Try adjusting the rate: slower (100) for clarity, faster (200) for naturalness
- Write more natural language in your annotations

### Issue: Timing is too short

**Solution:**
- The narrator automatically extends timing for narration
- If still too short, manually increase TIMING value

### Issue: Narrator seems slow on first use

**Solution:**
- First-time initialization takes longer (generating voices)
- Subsequent generations will be faster
- This is normal behavior

---

## Advanced: Custom Voices

The narrator supports multiple system voices. To use different voices:

```python
from narrator import ChessNarrator

# Voice ID 0 = Default (usually male)
narrator = ChessNarrator(voice_id=0)

# Voice ID 1 = Alternative (usually female, if available)
narrator = ChessNarrator(voice_id=1)
```

Unfortunately, voice selection via CLI is not yet supported. You can edit the narrator.py file or use the Python API directly.

---

## Performance Notes

### File Size

With narration, files might be slightly larger due to embedded audio:
- Without narration: ~10 MB (for 20 moves at 800x600)
- With narration: ~15-20 MB (includes narration track)

### Generation Time

Narration adds to generation time:
- Without narration: 30-60 seconds
- With narration: 1-2 minutes (includes speech synthesis)

---

## Usage Summary

| Task | Command |
|------|---------|
| Generate with narration | `--narrator` |
| Slow narration | `--narrator --narrator-rate 120` |
| Fast narration | `--narrator --narrator-rate 180` |
| Custom rate | `--narrator --narrator-rate 140` |
| Without narration | (omit `--narrator` flag) |

---

## Complete Example

**File: advanced_theory.txt**
```text
TITLE: Advanced Chess Theory - The Ruy Lopez
DESCRIPTION: A deep dive into one of the greatest openings

DISPLAY: The Ruy Lopez, also known as the Spanish Opening, is one of the oldest and most respected openings in chess. Named after the 16th-century priest Ruy López de Segura, it remains a favorite at all levels of play.

MOVES:
e4 e5

TEXT: White establishes control of the center with the king's pawn
TIMING: 1 3

MOVES:
Nf3 Nc6

TEXT: Both players develop their knights, maintaining central control
TIMING: 2 3

MOVES:
Bb5 a6

TEXT: The key move of the Ruy Lopez - White pins the knight while attacking it
TIMING: 3 4

DISPLAY: Black's a6 move challenges the bishop, forcing it to make a critical decision

MOVES:
Ba4 Nf6

TEXT: White retreats the bishop, preparing to control key squares
TIMING: 4 3

MOVES:
O-O Be7

TEXT: Both sides castle kingside for king safety
TIMING: 5 3

DISPLAY: This position represents the mainline of the Ruy Lopez. White has a slight space advantage while Black has solid piece coordination and counterplay. The game will develop based on dynamic factors and piece maneuvering.
```

**Generate with:**
```bash
.venv/bin/python main.py \
  -i advanced_theory.txt \
  -o ruy_lopez_lecture.mp4 \
  --narrator \
  --narrator-rate 130 \
  --size 1024 \
  --fps 30
```

**Result:**
- Professional narrated chess lecture video
- 15-20 MB file
- 2-3 minutes duration
- All text content narrated
- High quality video (1024x1024)
- Suitable for YouTube or educational use

---

## Next Steps

1. Write your theory with TEXT and DISPLAY annotations
2. Add `--narrator` to your command
3. Adjust `--narrator-rate` if needed
4. Generate your narrated video!

```bash
.venv/bin/python main.py -i my_theory.txt -o video.mp4 --narrator
```

---

## Related Documentation

- [TIMING_AND_TEXT.md](TIMING_AND_TEXT.md) - Text and timing features
- [FORMAT_GUIDE.md](FORMAT_GUIDE.md) - All input formats
- [CHEATSHEET.md](CHEATSHEET.md) - Quick command reference
- [HOW_TO_RUN.md](HOW_TO_RUN.md) - General usage guide

---

**Enjoy your narrated chess videos!** 🎤♟️
