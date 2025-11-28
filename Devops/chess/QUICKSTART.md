# Quick Start Guide

Get started with Chess Theory Video Generator in 5 minutes!

## Step 1: Install (2 minutes)

```bash
# Clone or download the project
cd chess

# Run setup script
./setup.sh

# OR install manually
pip install -r requirements.txt
```

## Step 2: Test (30 seconds)

```bash
# Run the test suite
python test_app.py
```

You should see:
```
✓ All tests passed! The application is ready to use.
```

## Step 3: Generate Your First Video (1 minute)

```bash
# Generate a video from an example
python main.py -i examples/ruy_lopez.txt -o my_first_video.mp4
```

Watch it generate:
```
============================================================
Chess Theory Video Generator
============================================================
Input file:     examples/ruy_lopez.txt
Output video:   my_first_video.mp4
Board size:     800x800
Style:          default
FPS:            30
Move duration:  2.0s
============================================================

Step 1: Parsing chess theory...
✓ Successfully parsed 10 moves
  Title: Ruy Lopez (Spanish Opening)

Step 2: Generating video...
Generating video: my_first_video.mp4
Total moves: 10
Adding intro...
Processing move 1/10: e4
Processing move 2/10: e5
...
✓ Video generated successfully: my_first_video.mp4
```

## Step 4: View Your Video

Open `my_first_video.mp4` with any video player!

## Step 5: Create Your Own Theory

Create a file `my_theory.txt`:

```text
Opening: My Favorite Opening

1. e4 - I love starting with the king's pawn
2. c5 - The Sicilian Defense, sharp and aggressive
3. Nf3 - Developing the knight to a natural square
4. d6 - Black supports the center
5. d4 - White challenges in the center
6. cxd4 - Black takes the pawn
7. Nxd4 - The Open Sicilian position
```

Generate it:

```bash
python main.py -i my_theory.txt -o my_theory.mp4
```

## Common Commands

### Quick preview (fast generation)
```bash
python main.py -i theory.txt -o preview.mp4 --duration 1 --size 600
```

### High quality (for presentations)
```bash
python main.py -i theory.txt -o hq.mp4 --fps 60 --size 1280 --style wood
```

### With thumbnail
```bash
python main.py -i theory.txt -o video.mp4 --thumbnail
```

### Different board styles
```bash
# Try: default, wood, marble, blue, green
python main.py -i theory.txt -o video.mp4 --style marble
```

## Input Format Examples

### Format 1: Simple (Easiest)
```
1. e4 - King's pawn
2. e5 - Black responds
3. Nf3 - Develop knight
```

### Format 2: With Title
```
Opening: Italian Game

1. e4 - Open game
2. e5 - Symmetric response
3. Nf3 - Knight develops
4. Nc6 - Black develops too
5. Bc4 - The Italian!
```

### Format 3: Advanced
```
TITLE: Sicilian Dragon
DESCRIPTION: Sharp and aggressive opening for Black

MOVES:
e4 c5
Nf3 d6
d4 cxd4

TEXT: Black gets a strong dragon bishop on g7

MOVES:
Nxd4 Nf6
Nc3 g6
```

## Tips

1. **Start Simple**: Use Format 1 for your first videos
2. **Add Annotations**: Good explanations make better videos
3. **Test Quickly**: Use small size and short duration for testing
4. **Check Examples**: Look at `examples/` for inspiration

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [USAGE.md](USAGE.md) for advanced features
- Explore all example files in `examples/`

## Need Help?

1. Run tests: `python test_app.py`
2. Check notation is valid chess notation
3. Review error messages carefully
4. Try the example files first

---

Happy creating! Start making your chess content today!
