# Usage Guide

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate a video from an example:
```bash
python main.py --input examples/ruy_lopez.txt --output ruy_lopez.mp4
```

## Input Formats

### Format 1: Annotated Algebraic Notation

The simplest format with move descriptions:

```text
Opening: Ruy Lopez

1. e4 - King's pawn opening
2. e5 - Black mirrors
3. Nf3 - Develop knight
4. Nc6 - Black develops
5. Bb5 - The Ruy Lopez begins
```

### Format 2: Structured Format

More control with sections:

```text
TITLE: Sicilian Defense
DESCRIPTION: The most aggressive response to 1.e4

MOVES:
e4 c5
Nf3 d6
d4 cxd4

TEXT: Black has a strong position with counterplay

MOVES:
Nxd4 Nf6
Nc3 a6
```

### Format 3: PGN Format

Standard chess notation:

```text
[Event "Chess Theory"]
[Opening "Italian Game"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5
{The Italian Game leads to open positions}
4. c3 Nf6 5. d4 exd4 6. cxd4
```

## Command Line Options

### Basic Options

- `--input FILE` or `-i FILE`: Input theory file (required)
- `--output FILE` or `-o FILE`: Output video file (default: output.mp4)

### Video Quality

- `--fps {24,30,60}`: Frames per second (default: 30)
- `--size {600,800,1024,1280}`: Board size in pixels (default: 800)
- `--style {default,wood,marble,blue,green}`: Board style

### Timing

- `--duration SECONDS`: Time per move (default: 2.0)
- `--intro-duration SECONDS`: Intro screen time (default: 3.0)
- `--outro-duration SECONDS`: Outro screen time (default: 2.0)

### Additional Features

- `--thumbnail`: Generate thumbnail image
- `--verbose` or `-v`: Show detailed output

## Examples

### Basic Video Generation

```bash
python main.py -i examples/italian_game.txt -o italian.mp4
```

### High Quality Video

```bash
python main.py -i theory.txt -o theory.mp4 --fps 60 --size 1280
```

### Quick Preview

```bash
python main.py -i theory.txt -o preview.mp4 --duration 1 --size 600
```

### With Thumbnail

```bash
python main.py -i theory.txt -o theory.mp4 --thumbnail
```

### Custom Board Style

```bash
python main.py -i theory.txt -o theory.mp4 --style wood
```

## Tips

1. **Move Duration**: Use shorter durations (1-1.5s) for simple openings, longer (2-3s) for complex theories

2. **Board Size**:
   - 600px: Good for social media
   - 800px: Balanced quality and file size
   - 1024px+: High quality for presentations

3. **FPS**:
   - 24fps: Cinematic feel
   - 30fps: Standard video
   - 60fps: Smooth animations (larger files)

4. **Annotations**: Add detailed annotations to make the theory clearer

5. **File Size**: Larger boards and higher FPS = larger files

## Troubleshooting

### Video won't play
- Try different video players (VLC, mpv)
- Convert format: `ffmpeg -i output.mp4 -c:v libx264 output_h264.mp4`

### Parsing errors
- Check move notation is valid
- Ensure moves are legal
- Use move numbers consistently

### Poor video quality
- Increase board size: `--size 1024`
- Increase FPS: `--fps 60`
- Check video codec support

### Slow generation
- Reduce board size: `--size 600`
- Lower FPS: `--fps 24`
- Shorter move durations

## Advanced Usage

### Batch Processing

Generate videos for all examples:

```bash
for file in examples/*.txt; do
    output="videos/$(basename "$file" .txt).mp4"
    python main.py -i "$file" -o "$output"
done
```

### Custom Styling

Edit `board_renderer.py` to add custom board colors in the `BOARD_STYLES` dictionary.

### Integration

Import as a library:

```python
from parser import ChessTheoryParser
from video_generator import ChessVideoGenerator

# Parse theory
parser = ChessTheoryParser()
data = parser.parse_file('theory.txt')

# Generate video
generator = ChessVideoGenerator(size=800, fps=30)
generator.generate_video(data, 'output.mp4')
```
