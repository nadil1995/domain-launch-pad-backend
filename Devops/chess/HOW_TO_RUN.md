# How to Run the Chess Theory Video Generator

## ✅ Installation Complete!

The application has been successfully installed and tested! Your test video has been generated.

## 🎯 Three Ways to Run

### Method 1: Using the Wrapper Script (Easiest)

```bash
./chess-video -i examples/ruy_lopez.txt -o video.mp4
```

### Method 2: Activate Virtual Environment First

```bash
# Activate the environment
source activate.sh

# Now you can use python directly
python main.py -i examples/ruy_lopez.txt -o video.mp4
python test_app.py

# When done, deactivate
deactivate
```

### Method 3: Direct Python Path

```bash
.venv/bin/python main.py -i examples/ruy_lopez.txt -o video.mp4
```

## 🚀 Quick Examples

### Generate from all examples

```bash
# Ruy Lopez
./chess-video -i examples/ruy_lopez.txt -o ruy_lopez.mp4

# Italian Game
./chess-video -i examples/italian_game.txt -o italian.mp4

# Sicilian Defense (already generated as test_video.mp4!)
./chess-video -i examples/sicilian_defense.txt -o sicilian.mp4

# King's Indian
./chess-video -i examples/kings_indian.txt -o kings_indian.mp4

# Scholar's Mate
./chess-video -i examples/scholars_mate.txt -o scholars_mate.mp4

# French Defense Analysis
./chess-video -i examples/sample_analysis.txt -o french_defense.mp4
```

### Different Styles

```bash
# Wood theme
./chess-video -i examples/ruy_lopez.txt -o wood.mp4 --style wood

# Marble theme
./chess-video -i examples/ruy_lopez.txt -o marble.mp4 --style marble

# Blue theme
./chess-video -i examples/ruy_lopez.txt -o blue.mp4 --style blue

# Green theme
./chess-video -i examples/ruy_lopez.txt -o green.mp4 --style green
```

### Different Quality Settings

```bash
# Quick preview (small, fast)
./chess-video -i theory.txt -o preview.mp4 --size 600 --duration 1

# Standard quality
./chess-video -i theory.txt -o standard.mp4 --size 800 --duration 2

# High quality
./chess-video -i theory.txt -o hq.mp4 --size 1280 --fps 60 --duration 2
```

### With Thumbnail

```bash
./chess-video -i examples/ruy_lopez.txt -o video.mp4 --thumbnail
# This creates: video.mp4 and video_thumbnail.png
```

## 📝 Creating Your Own Theory

1. Create a text file (e.g., `my_theory.txt`):

```text
Opening: My Favorite Opening

1. e4 - I love the king's pawn
2. c5 - The Sicilian Defense
3. Nf3 - Developing naturally
4. d6 - Solid and safe
5. d4 - Challenge the center
```

2. Generate the video:

```bash
./chess-video -i my_theory.txt -o my_video.mp4
```

## 🎨 All Available Options

```bash
./chess-video -i INPUT.txt -o OUTPUT.mp4 \
  --fps {24,30,60} \
  --duration 2.0 \
  --size {600,800,1024,1280} \
  --style {default,wood,marble,blue,green} \
  --intro-duration 3.0 \
  --outro-duration 2.0 \
  --thumbnail \
  --verbose
```

## 🔧 Troubleshooting

### If you get "command not found: python"

Use the wrapper script or activate the virtual environment:
```bash
source activate.sh
```

### If wrapper script doesn't work

Make sure it's executable:
```bash
chmod +x chess-video
```

### To run tests

```bash
source activate.sh
python test_app.py
```

Or:
```bash
.venv/bin/python test_app.py
```

## 📚 Documentation

- [GET_STARTED.md](GET_STARTED.md) - Complete beginner guide
- [QUICKSTART.md](QUICKSTART.md) - 5-minute tutorial
- [CHEATSHEET.md](CHEATSHEET.md) - Command reference
- [README.md](README.md) - Full documentation
- [USAGE.md](USAGE.md) - Detailed usage guide

## ✨ Your Test Video

A test video has already been generated for you:
- **File**: `test_video.mp4`
- **Theory**: Sicilian Defense - Dragon Variation
- **Size**: 3.3 MB
- **Duration**: 20 seconds

Open it with:
```bash
open test_video.mp4    # macOS
xdg-open test_video.mp4    # Linux
start test_video.mp4    # Windows
```

## 🎬 Next Steps

1. ✅ Installation complete
2. ✅ Tests passed
3. ✅ Test video generated
4. 📝 Create your own theory file
5. 🎥 Generate your videos!

---

**Enjoy creating chess videos!** 🎬♟️
