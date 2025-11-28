"""
Video generator for chess theories
Creates animated videos with smooth transitions between moves
"""

import chess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from board_renderer import ChessBoardRenderer
from typing import List, Dict, Optional, Tuple
import os


class ChessVideoGenerator:
    """Generate videos from chess theory data"""

    def __init__(self, size: int = 800, fps: int = 30, style: str = 'default'):
        """
        Initialize video generator

        Args:
            size: Size of the board in pixels
            fps: Frames per second for video
            style: Board color style
        """
        self.size = size
        self.fps = fps
        self.style = style
        self.renderer = ChessBoardRenderer(size=size, style=style)

    def generate_video(self, theory_data: dict, output_path: str,
                      move_duration: float = 2.0,
                      intro_duration: float = 3.0,
                      outro_duration: float = 2.0):
        """
        Generate video from chess theory data

        Args:
            theory_data: Parsed chess theory data
            output_path: Path to save the video
            move_duration: Duration to show each move (seconds)
            intro_duration: Duration of intro screen (seconds)
            outro_duration: Duration of outro screen (seconds)
        """
        print(f"Generating video: {output_path}")
        print(f"Total moves: {theory_data['move_count']}")

        # Set up video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        annotation_height = 100
        total_height = self.size + annotation_height
        video = cv2.VideoWriter(output_path, fourcc, self.fps, (self.size, total_height))

        if not video.isOpened():
            raise RuntimeError(f"Could not open video writer for {output_path}")

        try:
            # Generate intro
            if theory_data['title'] or theory_data['description']:
                self._add_intro(video, theory_data, intro_duration)

            # Generate moves
            board = chess.Board()
            annotations_dict = {idx: text for idx, text in theory_data['annotations']}
            timings_dict = theory_data.get('timings', {})

            for move_idx, move_data in enumerate(theory_data['moves']):
                print(f"Processing move {move_idx + 1}/{theory_data['move_count']}: {move_data['san']}")

                # Get annotation for this move if exists
                annotation = annotations_dict.get(move_idx, f"Move {move_idx + 1}: {move_data['san']}")

                # Get custom timing for this move if exists, otherwise use default
                duration = timings_dict.get(move_idx, move_duration)

                # Parse and make the move
                move = chess.Move.from_uci(move_data['uci'])

                # Add animated transition
                self._add_move_animation(video, board, move, annotation, duration)

                # Make the move
                board.push(move)

            # Add outro
            self._add_outro(video, board, outro_duration)

            print(f"Video generation complete: {output_path}")

        finally:
            video.release()

    def _add_intro(self, video: cv2.VideoWriter, theory_data: dict, duration: float):
        """Add intro screen with title and description"""
        print("Adding intro...")

        # Create intro frame
        frame_img = Image.new('RGB', (self.size, self.size + 100), color='#2C3E50')
        draw = ImageDraw.Draw(frame_img)

        # Load fonts
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
            desc_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
        except:
            try:
                title_font = ImageFont.truetype("arial.ttf", 48)
                desc_font = ImageFont.truetype("arial.ttf", 28)
            except:
                title_font = ImageFont.load_default()
                desc_font = ImageFont.load_default()

        # Draw title
        if theory_data['title']:
            title_bbox = draw.textbbox((0, 0), theory_data['title'], font=title_font)
            title_width = title_bbox[2] - title_bbox[0]
            x = (self.size - title_width) // 2
            y = self.size // 2 - 100
            draw.text((x, y), theory_data['title'], fill='white', font=title_font)

        # Draw description
        if theory_data['description']:
            # Word wrap description
            words = theory_data['description'].split()
            lines = []
            current_line = []
            max_width = self.size - 100

            for word in words:
                current_line.append(word)
                line_text = ' '.join(current_line)
                bbox = draw.textbbox((0, 0), line_text, font=desc_font)
                if bbox[2] - bbox[0] > max_width:
                    if len(current_line) > 1:
                        current_line.pop()
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(word)
                        current_line = []

            if current_line:
                lines.append(' '.join(current_line))

            y = self.size // 2 + 20
            for line in lines[:3]:  # Max 3 lines
                bbox = draw.textbbox((0, 0), line, font=desc_font)
                line_width = bbox[2] - bbox[0]
                x = (self.size - line_width) // 2
                draw.text((x, y), line, fill='#ECF0F1', font=desc_font)
                y += 40

        # Convert to OpenCV format and add frames
        frame_cv = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGB2BGR)
        num_frames = int(duration * self.fps)

        for _ in range(num_frames):
            video.write(frame_cv)

    def _add_move_animation(self, video: cv2.VideoWriter, board: chess.Board,
                           move: chess.Move, annotation: str, duration: float):
        """Add animated move transition"""
        # Calculate frames
        transition_frames = int(0.3 * duration * self.fps)  # 30% for animation
        hold_frames = int(0.7 * duration * self.fps)  # 70% holding position

        # Board before move
        board_before = board.copy()

        # Create frames showing the move
        from_square = move.from_square
        to_square = move.to_square

        # Render board with highlighted squares during transition
        for frame in range(transition_frames):
            progress = frame / transition_frames
            # Highlight source and destination
            img = self.renderer.render_with_annotation(
                board_before,
                annotation,
                last_move=None
            )

            # Add fade effect on moving piece
            if frame < transition_frames // 2:
                # Highlight from square
                draw = ImageDraw.Draw(img)
                alpha = int(128 + 127 * np.sin(progress * np.pi))
                # This is simplified - you could add actual piece movement here
            else:
                # Highlight to square
                pass

            frame_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            video.write(frame_cv)

        # Hold final position
        board_after = board.copy()
        board_after.push(move)
        img_final = self.renderer.render_with_annotation(board_after, annotation, last_move=move)
        frame_final = cv2.cvtColor(np.array(img_final), cv2.COLOR_RGB2BGR)

        for _ in range(hold_frames):
            video.write(frame_final)

    def _add_outro(self, video: cv2.VideoWriter, final_board: chess.Board, duration: float):
        """Add outro with final position"""
        print("Adding outro...")

        # Render final board
        img = self.renderer.render_with_annotation(
            final_board,
            "End of theory demonstration"
        )

        frame_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        num_frames = int(duration * self.fps)

        for _ in range(num_frames):
            video.write(frame_cv)

    def create_thumbnail(self, theory_data: dict, output_path: str):
        """Create a thumbnail image for the video"""
        board = chess.Board()

        # Make a few moves to get an interesting position
        for move_data in theory_data['moves'][:min(5, len(theory_data['moves']))]:
            move = chess.Move.from_uci(move_data['uci'])
            board.push(move)

        img = self.renderer.render_with_annotation(
            board,
            theory_data.get('title', 'Chess Theory')
        )

        img.save(output_path)
        print(f"Thumbnail saved: {output_path}")


if __name__ == '__main__':
    # Test video generation
    from parser import ChessTheoryParser

    test_theory = """
    Opening: Scholar's Mate

    1. e4 - Open with king's pawn
    2. e5 - Black responds symmetrically
    3. Bc4 - Develop bishop to strong square
    4. Nc6 - Black develops knight
    5. Qh5 - Queen attacks f7
    6. Nf6 - Black defends
    7. Qxf7# - Checkmate!
    """

    parser = ChessTheoryParser()
    data = parser.parse_text(test_theory)

    generator = ChessVideoGenerator(size=600, fps=30, style='wood')
    generator.generate_video(data, 'test_video.mp4', move_duration=1.5)
    print("Test video generated!")
