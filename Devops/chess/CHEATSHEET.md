# Chess Theory Video Generator - Cheat Sheet

Quick reference for common tasks and commands.

## Installation

```bash
./setup.sh                    # Automated setup
pip install -r requirements.txt  # Manual install
python test_app.py            # Test installation
```

## Basic Commands

```bash
# Generate video from theory file
python main.py -i INPUT.txt -o OUTPUT.mp4

# Quick preview (small, fast)
python main.py -i INPUT.txt -o preview.mp4 --size 600 --duration 1

# High quality (large, slow)
python main.py -i INPUT.txt -o hq.mp4 --size 1280 --fps 60

# With thumbnail
python main.py -i INPUT.txt -o video.mp4 --thumbnail
```

## All Options

| Short | Long | Values | Default | Description |
|-------|------|--------|---------|-------------|
| `-i` | `--input` | filepath | (required) | Input theory file |
| `-o` | `--output` | filepath | output.mp4 | Output video file |
| | `--fps` | 24/30/60 | 30 | Frames per second |
| | `--duration` | float | 2.0 | Seconds per move |
| | `--size` | 600/800/1024/1280 | 800 | Board size (px) |
| | `--style` | see below | default | Board style |
| | `--intro-duration` | float | 3.0 | Intro seconds |
| | `--outro-duration` | float | 2.0 | Outro seconds |
| | `--thumbnail` | flag | false | Generate thumbnail |
| `-v` | `--verbose` | flag | false | Verbose output |

## Board Styles

- `default` - Classic brown/beige
- `wood` - Natural wood tones
- `marble` - Gray/white elegant
- `blue` - Modern blue/gray
- `green` - Traditional green/cream

## Input Format Templates

### Format 1: Simple Annotated
```text
Opening: Name Here

1. e4 - Description of move
2. e5 - Another description
3. Nf3 - Keep going...
```

### Format 2: Structured
```text
TITLE: Opening Name
DESCRIPTION: Brief description

MOVES:
e4 e5
Nf3 Nc6

TEXT: Commentary here

MOVES:
Bc4 Bc5
```

### Format 3: PGN
```text
1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
{Comment in curly braces}
4. c3 Nf6 5. d4
```

## Quick Examples

### Generate from each example
```bash
python main.py -i examples/ruy_lopez.txt -o ruy_lopez.mp4
python main.py -i examples/italian_game.txt -o italian.mp4
python main.py -i examples/sicilian_defense.txt -o sicilian.mp4
python main.py -i examples/kings_indian.txt -o kings_indian.mp4
python main.py -i examples/scholars_mate.txt -o scholars.mp4
```

### Different styles
```bash
python main.py -i theory.txt -o wood.mp4 --style wood
python main.py -i theory.txt -o marble.mp4 --style marble
python main.py -i theory.txt -o blue.mp4 --style blue
```

### Different qualities
```bash
# Social media (small file)
python main.py -i theory.txt -o social.mp4 --size 600 --fps 24

# Standard (balanced)
python main.py -i theory.txt -o standard.mp4 --size 800 --fps 30

# Presentation (high quality)
python main.py -i theory.txt -o presentation.mp4 --size 1280 --fps 60
```

### Timing variations
```bash
# Fast (1 sec per move)
python main.py -i theory.txt -o fast.mp4 --duration 1

# Normal (2 sec per move)
python main.py -i theory.txt -o normal.mp4 --duration 2

# Slow (3 sec per move)
python main.py -i theory.txt -o slow.mp4 --duration 3
```

## Common Chess Notation

### Pieces
- K = King
- Q = Queen
- R = Rook
- B = Bishop
- N = Knight
- (no letter) = Pawn

### Squares
- Files: a-h (left to right)
- Ranks: 1-8 (bottom to top for White)
- Example: e4, Nf3, Bb5

### Special Notation
- `x` = captures (e.g., Nxe4)
- `+` = check
- `#` = checkmate
- `O-O` = kingside castle
- `O-O-O` = queenside castle
- `=Q` = pawn promotion to queen

### Move Examples
```
e4      - Pawn to e4
Nf3     - Knight to f3
Bxc6    - Bishop captures on c6
Qd8+    - Queen to d8, check
O-O     - Castle kingside
e8=Q#   - Pawn promotes to queen, checkmate
```

## File Size Guide

| Size | FPS | 10 moves | 20 moves | 50 moves |
|------|-----|----------|----------|----------|
| 600px | 24 | ~3 MB | ~6 MB | ~15 MB |
| 800px | 30 | ~6 MB | ~12 MB | ~30 MB |
| 1024px | 30 | ~10 MB | ~20 MB | ~50 MB |
| 1280px | 60 | ~20 MB | ~40 MB | ~100 MB |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Import errors | `pip install -r requirements.txt` |
| Invalid moves | Check notation, ensure moves are legal |
| Video won't play | Try VLC, or convert: `ffmpeg -i in.mp4 -c:v libx264 out.mp4` |
| Slow generation | Reduce size/fps: `--size 600 --fps 24` |
| Out of memory | Use smaller size: `--size 600` |
| Parser errors | Check format, see examples/ |

## Testing

```bash
# Run all tests
python test_app.py

# Test specific component
python parser.py          # Test parser
python board_renderer.py  # Test renderer
```

## Tips

1. **Start small**: Test with `--size 600 --duration 1` first
2. **Use examples**: Copy format from `examples/` directory
3. **Check notation**: Validate moves are legal in chess
4. **Preview first**: Generate preview before high-quality version
5. **Batch process**: Use shell loop for multiple files

## Batch Processing

### Process all examples
```bash
for f in examples/*.txt; do
  out="videos/$(basename "$f" .txt).mp4"
  python main.py -i "$f" -o "$out"
done
```

### Generate all styles
```bash
for style in default wood marble blue green; do
  python main.py -i theory.txt -o "video_${style}.mp4" --style $style
done
```

## Common Openings Notation

### King's Pawn Openings
```
e4 e5    - Open Game
e4 c5    - Sicilian Defense
e4 e6    - French Defense
e4 c6    - Caro-Kann Defense
```

### Queen's Pawn Openings
```
d4 d5    - Queen's Gambit
d4 Nf6   - Indian Defenses
d4 f5    - Dutch Defense
```

## Video Duration Formula

```
Total Duration =
  Intro Duration +
  (Number of Moves × Duration per Move) +
  Outro Duration

Example:
  3s intro + (10 moves × 2s) + 2s outro = 25 seconds
```

## Resources

- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [USAGE.md](USAGE.md) - Detailed usage
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [examples/](examples/) - Sample theories

## Support

1. Check examples in `examples/` directory
2. Run test suite: `python test_app.py`
3. Enable verbose mode: `--verbose`
4. Review error messages carefully

---

Keep this cheat sheet handy for quick reference!
