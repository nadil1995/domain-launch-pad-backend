"""
Chess theory notation parser
Supports multiple input formats: PGN, UCI, and algebraic notation with annotations
"""

import re
import chess
import chess.pgn
from io import StringIO
from typing import List, Tuple, Optional


class ChessTheoryParser:
    """Parse chess theory from various notation formats"""

    def __init__(self):
        self.board = chess.Board()
        self.moves = []
        self.annotations = []
        self.timings = {}  # Move index -> duration in seconds
        self.title = ""
        self.description = ""
        self.display_text = []  # List of text to display (independent of moves)

    def parse_file(self, filepath: str) -> dict:
        """Parse chess theory from a file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        return self.parse_text(content)

    def parse_text(self, text: str) -> dict:
        """Parse chess theory from text and return structured data"""
        self.board = chess.Board()
        self.moves = []
        self.annotations = []
        self.timings = {}
        self.display_text = []
        self.title = ""
        self.description = ""

        # Try to detect format
        if 'MOVES:' in text.upper() or 'TITLE:' in text.upper():
            return self._parse_structured_format(text)
        elif re.search(r'\{[^}]+\}', text):
            return self._parse_pgn_with_comments(text)
        elif '-' in text and any(move in text for move in ['e4', 'e5', 'Nf3']):
            return self._parse_annotated_format(text)
        else:
            return self._parse_simple_pgn(text)

    def _parse_structured_format(self, text: str) -> dict:
        """Parse structured format with TITLE, DESCRIPTION, MOVES, TEXT, and TIMING markers"""
        lines = text.strip().split('\n')
        current_section = None
        moves_section = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.upper().startswith('TITLE:'):
                self.title = line.split(':', 1)[1].strip()
            elif line.upper().startswith('DESCRIPTION:'):
                self.description = line.split(':', 1)[1].strip()
            elif line.upper().startswith('MOVES:'):
                current_section = 'moves'
            elif line.upper().startswith('TEXT:'):
                annotation = line.split(':', 1)[1].strip()
                self.annotations.append((len(self.moves), annotation))
                self.display_text.append(annotation)
            elif line.upper().startswith('TIMING:'):
                # Parse TIMING: move_number duration
                # Example: TIMING: 1 3 (show move 1 for 3 seconds)
                timing_part = line.split(':', 1)[1].strip()
                try:
                    parts = timing_part.split()
                    if len(parts) >= 2:
                        move_num = int(parts[0]) - 1  # Convert to 0-indexed
                        duration = float(parts[1])
                        self.timings[move_num] = duration
                except (ValueError, IndexError):
                    pass
            elif line.upper().startswith('DISPLAY:'):
                # Standalone text display (not tied to a specific move)
                text_content = line.split(':', 1)[1].strip()
                self.display_text.append(text_content)
            elif current_section == 'moves':
                moves_section.append(line)

        # Parse moves
        moves_text = ' '.join(moves_section)
        self._parse_moves_from_text(moves_text)

        return self._build_result()

    def _parse_pgn_with_comments(self, text: str) -> dict:
        """Parse PGN format with comments in curly braces"""
        try:
            # Try parsing as PGN
            pgn = StringIO(text)
            game = chess.pgn.read_game(pgn)

            if game:
                # Extract headers
                self.title = game.headers.get('Event', '')
                self.description = game.headers.get('Opening', '')

                # Extract moves and comments
                board = game.board()
                move_count = 0
                for node in game.mainline():
                    move = node.move
                    self.moves.append({
                        'san': board.san(move),
                        'uci': move.uci(),
                        'from': chess.square_name(move.from_square),
                        'to': chess.square_name(move.to_square),
                        'fen': board.fen()
                    })
                    board.push(move)

                    if node.comment:
                        self.annotations.append((move_count, node.comment))
                    move_count += 1

                return self._build_result()
        except:
            pass

        # Fallback to simple parsing
        return self._parse_simple_pgn(text)

    def _parse_annotated_format(self, text: str) -> dict:
        """Parse format with move numbers and annotations after dashes"""
        lines = text.strip().split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.lower().startswith('opening:'):
                self.title = line.split(':', 1)[1].strip()
                continue

            # Match pattern like "1. e4 - King's pawn opening"
            match = re.match(r'^\d+\.\s*([a-hO-]+[0-9]?[+#]?)\s*-\s*(.+)$', line)
            if match:
                move_san = match.group(1)
                annotation = match.group(2)

                try:
                    move = self.board.parse_san(move_san)
                    self.moves.append({
                        'san': move_san,
                        'uci': move.uci(),
                        'from': chess.square_name(move.from_square),
                        'to': chess.square_name(move.to_square),
                        'fen': self.board.fen()
                    })
                    self.board.push(move)
                    self.annotations.append((len(self.moves) - 1, annotation))
                except:
                    continue

        return self._build_result()

    def _parse_simple_pgn(self, text: str) -> dict:
        """Parse simple move notation (PGN or UCI)"""
        # Extract title from first line if it looks like a title
        lines = text.strip().split('\n')
        if lines and not any(char.isdigit() for char in lines[0][:10]):
            self.title = lines[0].strip()
            text = '\n'.join(lines[1:])

        self._parse_moves_from_text(text)
        return self._build_result()

    def _parse_moves_from_text(self, text: str):
        """Extract and parse moves from text"""
        # Remove comments in curly braces
        text = re.sub(r'\{[^}]+\}', '', text)

        # Extract all potential moves
        tokens = text.split()

        for token in tokens:
            token = token.strip('.,;')
            if not token or token.isdigit() or token.endswith('.'):
                continue

            try:
                # Try parsing as SAN
                move = self.board.parse_san(token)
                self.moves.append({
                    'san': self.board.san(move),
                    'uci': move.uci(),
                    'from': chess.square_name(move.from_square),
                    'to': chess.square_name(move.to_square),
                    'fen': self.board.fen()
                })
                self.board.push(move)
            except:
                # Try parsing as UCI
                try:
                    move = chess.Move.from_uci(token)
                    if move in self.board.legal_moves:
                        self.moves.append({
                            'san': self.board.san(move),
                            'uci': move.uci(),
                            'from': chess.square_name(move.from_square),
                            'to': chess.square_name(move.to_square),
                            'fen': self.board.fen()
                        })
                        self.board.push(move)
                except:
                    continue

    def _build_result(self) -> dict:
        """Build the final result dictionary"""
        return {
            'title': self.title,
            'description': self.description,
            'moves': self.moves,
            'annotations': self.annotations,
            'timings': self.timings,  # Move index -> duration mapping
            'display_text': self.display_text,  # Standalone text displays
            'starting_fen': chess.Board().fen(),
            'move_count': len(self.moves)
        }


if __name__ == '__main__':
    # Test the parser
    test_text = """
    Opening: Ruy Lopez

    1. e4 - King's pawn opening
    2. e5 - Black mirrors
    3. Nf3 - Develop knight
    4. Nc6 - Black develops
    5. Bb5 - The Ruy Lopez begins
    """

    parser = ChessTheoryParser()
    result = parser.parse_text(test_text)

    print(f"Title: {result['title']}")
    print(f"Moves: {result['move_count']}")
    for i, move in enumerate(result['moves']):
        print(f"{i+1}. {move['san']} ({move['from']} -> {move['to']})")
