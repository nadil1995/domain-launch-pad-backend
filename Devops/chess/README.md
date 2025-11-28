# Chess Theory Video Generator

Generate realistic, professional-looking chess videos from chess theory notation and descriptions. Perfect for chess content creators, coaches, and students!

## Features

- **Multiple Input Formats**: PGN, UCI, or algebraic notation with annotations
- **High-Quality Rendering**: Generate board visualizations with multiple style options
- **Smooth Animations**: Animated move transitions with customizable timing
- **Text Overlays**: Add theory explanations and annotations to each move
- **Flexible Export**: MP4 video format with customizable resolution and FPS
- **Professional Styling**: Choose from 5 different board themes

## Quick Start

### Installation

**Option 1: Automated Setup (Recommended)**
```bash
./setup.sh
```

**Option 2: Manual Installation**
```bash
pip install -r requirements.txt
```

### Test Installation

```bash
python test_app.py
```

### Generate Your First Video

```bash
python main.py --input examples/ruy_lopez.txt --output ruy_lopez.mp4
```

## Usage

### Basic Usage

```bash
python main.py --input theory.txt --output chess_theory.mp4
```

### High-Quality Video

```bash
python main.py --input theory.txt --output video.mp4 --fps 60 --size 1280 --style wood
```

### Quick Preview

```bash
python main.py --input theory.txt --output preview.mp4 --duration 1 --size 600
```

## Input Format

The app supports multiple input formats:

### Format 1: PGN with Comments
```
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
{This is the Ruy Lopez opening, one of the oldest and most classic of all openings}
4. Ba4 Nf6 5. O-O Be7
```

### Format 2: UCI Notation with Descriptions
```
TITLE: King's Indian Defense
DESCRIPTION: A hypermodern opening where Black allows White to occupy the center.

MOVES:
e2e4 e7e5
g1f3 b8c6
f1b5 a7a6

TEXT: The Ruy Lopez, also called the Spanish Opening
```

### Format 3: Algebraic Notation with Annotations
```
Opening: Italian Game

1. e4 - King's pawn opening
2. e5 - Black mirrors the move
3. Nf3 - Develop the knight
4. Nc6 - Black develops
5. Bc4 - The Italian Game begins
```

## Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input` | Input file with chess theory (required) | - |
| `-o, --output` | Output video file path | output.mp4 |
| `--fps` | Frames per second (24, 30, 60) | 30 |
| `--duration` | Duration per move in seconds | 2.0 |
| `--size` | Board size in pixels (600, 800, 1024, 1280) | 800 |
| `--style` | Board style (default, wood, marble, blue, green) | default |
| `--intro-duration` | Intro screen duration in seconds | 3.0 |
| `--outro-duration` | Outro screen duration in seconds | 2.0 |
| `--thumbnail` | Generate thumbnail image | False |
| `-v, --verbose` | Verbose output | False |

## Examples

See the [examples/](examples/) directory for sample chess theory files:

- **ruy_lopez.txt** - Classic Spanish Opening
- **italian_game.txt** - The Italian Game (Giuoco Piano)
- **sicilian_defense.txt** - Sicilian Defense Dragon Variation
- **kings_indian.txt** - King's Indian Defense
- **scholars_mate.txt** - Scholar's Mate trap

## Project Structure

```
chess/
├── main.py                  # Main application entry point
├── parser.py                # Chess notation parser
├── board_renderer.py        # Board visualization engine
├── video_generator.py       # Video creation engine
├── requirements.txt         # Python dependencies
├── setup.sh                 # Automated setup script
├── test_app.py             # Test suite
├── README.md               # This file
├── USAGE.md                # Detailed usage guide
└── examples/               # Example theory files
    ├── ruy_lopez.txt
    ├── italian_game.txt
    ├── sicilian_defense.txt
    ├── kings_indian.txt
    └── scholars_mate.txt
```

## Requirements

- Python 3.8+
- python-chess
- Pillow (PIL)
- OpenCV (cv2)
- NumPy
- CairoSVG

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is open source and available for educational and personal use.

## Tips for Best Results

1. **Clear Annotations**: Write descriptive annotations for each move to make the theory easy to understand
2. **Appropriate Timing**: Use 1.5-2s per move for openings, 2-3s for complex middle game positions
3. **Board Size**: Use 1024px or higher for presentations, 800px for general use, 600px for social media
4. **Styling**: Match the board style to your preference or branding

## Troubleshooting

If you encounter issues, please:

1. Run the test suite: `python test_app.py`
2. Check that all dependencies are installed: `pip install -r requirements.txt`
3. Review [USAGE.md](USAGE.md) for detailed documentation
4. Ensure your input notation is valid chess notation

## Future Enhancements

- GUI interface for easier use
- More board themes and piece sets
- Voice-over support
- Multiple camera angles
- Export to different video formats
- Batch processing of multiple theories
- Custom piece styles

---

Happy chess video creation!
