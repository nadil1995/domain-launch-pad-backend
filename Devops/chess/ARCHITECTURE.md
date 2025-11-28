# Architecture & Design

## Overview

The Chess Theory Video Generator is built with a modular architecture consisting of three main components:

```
Input (Text) → Parser → Renderer → Video Generator → Output (MP4)
```

## Component Architecture

### 1. Parser Module (`parser.py`)

**Responsibility**: Convert text-based chess notation into structured data

**Input**:
- Text file with chess theory
- Multiple format support (PGN, UCI, algebraic)

**Output**:
```python
{
    'title': str,
    'description': str,
    'moves': [
        {
            'san': str,      # Standard algebraic notation
            'uci': str,      # Universal chess interface
            'from': str,     # Source square
            'to': str,       # Destination square
            'fen': str       # Board state after move
        }
    ],
    'annotations': [(int, str)],  # (move_index, text)
    'starting_fen': str,
    'move_count': int
}
```

**Key Features**:
- Format auto-detection
- Error handling for invalid moves
- Support for comments and annotations
- Flexible parsing strategies

### 2. Board Renderer Module (`board_renderer.py`)

**Responsibility**: Create visual representations of chess positions

**Key Classes**:
- `ChessBoardRenderer`: Main rendering engine

**Methods**:
- `render_board()`: Basic board rendering
- `render_with_annotation()`: Board + text overlay
- `render_move_comparison()`: Before/after comparison

**Styling**:
```python
BOARD_STYLES = {
    'default': {'light': '#F0D9B5', 'dark': '#B58863'},
    'wood': {'light': '#FFCE9E', 'dark': '#D18B47'},
    'marble': {'light': '#E8E8E8', 'dark': '#7C7C7C'},
    'blue': {'light': '#DEE3E6', 'dark': '#8CA2AD'},
    'green': {'light': '#FFFFDD', 'dark': '#86A666'}
}
```

**Technology Stack**:
- python-chess: Board state and SVG generation
- CairoSVG: SVG to PNG conversion
- Pillow: Image manipulation and text overlay

### 3. Video Generator Module (`video_generator.py`)

**Responsibility**: Create animated videos from board positions

**Key Classes**:
- `ChessVideoGenerator`: Video creation engine

**Process Flow**:
```
1. Intro Screen (optional)
   ↓
2. For each move:
   - Transition animation (30% of move duration)
   - Hold final position (70% of move duration)
   ↓
3. Outro Screen (optional)
```

**Frame Generation**:
- Intro: Static frame with title/description
- Move transitions: Animated highlights
- Hold frames: Display final position with annotation
- Outro: Final board position

**Technology Stack**:
- OpenCV: Video writing and frame management
- NumPy: Array operations for image processing

### 4. Main Application (`main.py`)

**Responsibility**: CLI interface and workflow orchestration

**Workflow**:
```
1. Parse command-line arguments
2. Validate input file
3. Parse chess theory
4. Generate video
5. (Optional) Generate thumbnail
6. Report statistics
```

## Data Flow

```
┌─────────────────┐
│  Input File     │
│  (theory.txt)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parser         │
│  - Detect format│
│  - Parse moves  │
│  - Extract data │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Structured     │
│  Data           │
│  (dict)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Board Renderer │
│  - Create board │
│  - Add pieces   │
│  - Style board  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frame Images   │
│  (PIL Images)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Video Generator│
│  - Intro        │
│  - Animate moves│
│  - Add text     │
│  - Outro        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Output Video   │
│  (video.mp4)    │
└─────────────────┘
```

## Design Patterns

### 1. Strategy Pattern (Parser)
Different parsing strategies for different input formats:
- PGN with comments
- Structured format
- Annotated algebraic
- Simple PGN

### 2. Builder Pattern (Video Generator)
Builds video incrementally:
- Add intro
- Add moves (one by one)
- Add outro

### 3. Factory Pattern (Board Styles)
Creates different board styles from configuration

## Key Design Decisions

### 1. Why python-chess?
- Industry-standard chess library
- Handles all chess rules automatically
- Excellent notation parsing
- Built-in SVG board generation

### 2. Why OpenCV for Video?
- Efficient video encoding
- Wide format support
- Frame-by-frame control
- No licensing issues

### 3. Why SVG → PNG Pipeline?
- python-chess generates high-quality SVG
- CairoSVG provides excellent rendering
- Pillow allows easy text overlay
- Scalable to any resolution

### 4. Modular Architecture
- Each component is independently testable
- Easy to extend with new features
- Can be used as a library or CLI tool
- Clear separation of concerns

## Performance Considerations

### 1. Frame Generation
- Pre-calculate all frames before writing
- Reuse board objects when possible
- Cache rendered positions

### 2. Video Writing
- Use efficient codec (mp4v)
- Write frames in batches
- Optimize image conversion

### 3. Memory Management
- Stream processing where possible
- Release resources after use
- Avoid loading entire video in memory

## Extension Points

### Adding New Board Styles
Edit `board_renderer.py`:
```python
BOARD_STYLES['mystyle'] = {
    'light': '#HEXCOLOR',
    'dark': '#HEXCOLOR'
}
```

### Adding New Input Formats
Add method to `ChessTheoryParser`:
```python
def _parse_new_format(self, text: str) -> dict:
    # Custom parsing logic
    return self._build_result()
```

### Custom Animations
Modify `video_generator.py`:
```python
def _add_move_animation(self, ...):
    # Custom animation logic
```

## Testing Strategy

### Unit Tests
- Parser: Test each format independently
- Renderer: Test board generation
- Generator: Test frame creation

### Integration Tests
- End-to-end video generation
- Format compatibility
- Error handling

### Performance Tests
- Large theory files (50+ moves)
- High resolution (1920x1080)
- Different FPS settings

## Future Architecture

### Planned Enhancements
1. **GUI Layer**: Web-based or desktop interface
2. **Plugin System**: Custom renderers and styles
3. **Cloud Processing**: Offload video generation
4. **Real-time Preview**: Show video before generation
5. **Batch Processing**: Multiple theories in parallel

### Scalability
- Stateless design enables cloud deployment
- Can be containerized with Docker
- Suitable for batch processing
- API-first design for integration

---

This architecture provides a solid foundation for a maintainable, extensible chess video generation system.
