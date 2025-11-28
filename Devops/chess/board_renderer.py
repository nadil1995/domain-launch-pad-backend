"""
Chess board renderer with piece visualization
Creates high-quality chess board images
"""

import chess
import chess.svg
from PIL import Image, ImageDraw, ImageFont
import io
import cairosvg
from typing import Optional, Tuple


class ChessBoardRenderer:
    """Render chess boards with various styles"""

    BOARD_STYLES = {
        'default': {
            'light': '#F0D9B5',
            'dark': '#B58863'
        },
        'wood': {
            'light': '#FFCE9E',
            'dark': '#D18B47'
        },
        'marble': {
            'light': '#E8E8E8',
            'dark': '#7C7C7C'
        },
        'blue': {
            'light': '#DEE3E6',
            'dark': '#8CA2AD'
        },
        'green': {
            'light': '#FFFFDD',
            'dark': '#86A666'
        }
    }

    def __init__(self, size: int = 800, style: str = 'default'):
        """
        Initialize the renderer

        Args:
            size: Size of the board in pixels
            style: Board color style
        """
        self.size = size
        self.style = style
        self.colors = self.BOARD_STYLES.get(style, self.BOARD_STYLES['default'])

    def render_board(self, board: chess.Board,
                    highlight_squares: Optional[list] = None,
                    last_move: Optional[chess.Move] = None) -> Image.Image:
        """
        Render a chess board position

        Args:
            board: Chess board object
            highlight_squares: List of squares to highlight
            last_move: Last move to highlight

        Returns:
            PIL Image of the board
        """
        # Create SVG
        fill = {}
        if highlight_squares:
            for square in highlight_squares:
                fill[square] = '#FFFF0050'

        arrows = []
        if last_move:
            arrows = [(last_move.from_square, last_move.to_square)]

        svg_data = chess.svg.board(
            board,
            size=self.size,
            fill=fill,
            arrows=arrows,
            colors={
                'square light': self.colors['light'],
                'square dark': self.colors['dark']
            }
        )

        # Convert SVG to PNG
        png_data = cairosvg.svg2png(
            bytestring=svg_data.encode('utf-8'),
            output_width=self.size,
            output_height=self.size
        )

        # Load as PIL Image
        image = Image.open(io.BytesIO(png_data))
        return image

    def render_with_annotation(self, board: chess.Board,
                               annotation: str,
                               last_move: Optional[chess.Move] = None) -> Image.Image:
        """
        Render board with text annotation at the bottom

        Args:
            board: Chess board object
            annotation: Text to display
            last_move: Last move to highlight

        Returns:
            PIL Image with board and annotation
        """
        # Render the board
        board_img = self.render_board(board, last_move=last_move)

        # Calculate total height with annotation space
        annotation_height = 100
        total_height = self.size + annotation_height

        # Create new image with extra space
        full_img = Image.new('RGB', (self.size, total_height), color='white')
        full_img.paste(board_img, (0, 0))

        # Add annotation text
        draw = ImageDraw.Draw(full_img)

        # Try to load a nice font, fallback to default
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        except:
            try:
                font = ImageFont.truetype("arial.ttf", 24)
                title_font = ImageFont.truetype("arial.ttf", 32)
            except:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()

        # Draw annotation text (wrapped)
        y_offset = self.size + 20
        max_width = self.size - 40

        # Wrap text
        words = annotation.split()
        lines = []
        current_line = []

        for word in words:
            current_line.append(word)
            line_text = ' '.join(current_line)
            bbox = draw.textbbox((0, 0), line_text, font=font)
            line_width = bbox[2] - bbox[0]

            if line_width > max_width:
                if len(current_line) > 1:
                    current_line.pop()
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)
                    current_line = []

        if current_line:
            lines.append(' '.join(current_line))

        # Draw lines
        for line in lines[:2]:  # Max 2 lines
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (self.size - text_width) // 2
            draw.text((x, y_offset), line, fill='black', font=font)
            y_offset += 35

        return full_img

    def render_move_comparison(self, before: chess.Board,
                               after: chess.Board,
                               move: chess.Move) -> Image.Image:
        """
        Render before and after comparison of a move

        Args:
            before: Board state before move
            after: Board state after move
            move: The move that was made

        Returns:
            PIL Image showing both states
        """
        img_before = self.render_board(before, last_move=None)
        img_after = self.render_board(after, last_move=move)

        # Create side-by-side image
        total_width = self.size * 2 + 40
        comparison = Image.new('RGB', (total_width, self.size + 60), color='white')

        # Paste images
        comparison.paste(img_before, (0, 30))
        comparison.paste(img_after, (self.size + 40, 30))

        # Add labels
        draw = ImageDraw.Draw(comparison)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        except:
            font = ImageFont.load_default()

        draw.text((self.size // 2 - 30, 5), "Before", fill='black', font=font)
        draw.text((self.size + self.size // 2 + 10, 5), "After", fill='black', font=font)

        return comparison


if __name__ == '__main__':
    # Test the renderer
    board = chess.Board()
    renderer = ChessBoardRenderer(size=600, style='wood')

    # Test basic rendering
    img = renderer.render_board(board)
    img.save('test_board.png')
    print("Test board saved as test_board.png")

    # Test with annotation
    board.push_san('e4')
    img_annotated = renderer.render_with_annotation(
        board,
        "King's pawn opening - The most popular first move in chess",
        last_move=board.peek()
    )
    img_annotated.save('test_annotated.png')
    print("Test annotated board saved as test_annotated.png")
