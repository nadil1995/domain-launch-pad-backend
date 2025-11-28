#!/usr/bin/env python3
"""
Test suite for Chess Theory Video Generator
Run this to verify the installation
"""

import sys
import os

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")
    try:
        import chess
        import PIL
        import cv2
        import numpy
        import cairosvg
        print("✓ All required packages are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing package: {e}")
        return False

def test_parser():
    """Test the chess theory parser"""
    print("\nTesting parser...")
    try:
        from parser import ChessTheoryParser

        test_theory = """
        Opening: Test Opening
        1. e4 - First move
        2. e5 - Second move
        """

        parser = ChessTheoryParser()
        result = parser.parse_text(test_theory)

        assert result['move_count'] == 2, "Expected 2 moves"
        assert result['title'] == "Test Opening", "Title not parsed correctly"
        assert len(result['moves']) == 2, "Moves not parsed correctly"

        print("✓ Parser working correctly")
        return True
    except Exception as e:
        print(f"✗ Parser test failed: {e}")
        return False

def test_renderer():
    """Test the board renderer"""
    print("\nTesting board renderer...")
    try:
        from board_renderer import ChessBoardRenderer
        import chess

        renderer = ChessBoardRenderer(size=400, style='default')
        board = chess.Board()

        # Test rendering
        img = renderer.render_board(board)
        assert img.size == (400, 400), "Image size incorrect"

        # Test with annotation
        img = renderer.render_with_annotation(board, "Test annotation")
        assert img.size == (400, 500), "Annotated image size incorrect"

        print("✓ Board renderer working correctly")
        return True
    except Exception as e:
        print(f"✗ Renderer test failed: {e}")
        return False

def test_video_generator():
    """Test video generation capabilities"""
    print("\nTesting video generator initialization...")
    try:
        from video_generator import ChessVideoGenerator

        generator = ChessVideoGenerator(size=400, fps=30, style='default')
        assert generator.size == 400, "Generator size incorrect"
        assert generator.fps == 30, "Generator FPS incorrect"

        print("✓ Video generator initialized correctly")
        return True
    except Exception as e:
        print(f"✗ Video generator test failed: {e}")
        return False

def test_integration():
    """Test full integration"""
    print("\nTesting integration...")
    try:
        from parser import ChessTheoryParser
        from video_generator import ChessVideoGenerator

        theory = "1. e4 e5 2. Nf3 Nc6"

        parser = ChessTheoryParser()
        data = parser.parse_text(theory)

        generator = ChessVideoGenerator(size=400, fps=30)

        print("✓ Integration test passed")
        return True
    except Exception as e:
        print(f"✗ Integration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Chess Theory Video Generator - Test Suite")
    print("=" * 60)

    tests = [
        test_imports,
        test_parser,
        test_renderer,
        test_video_generator,
        test_integration
    ]

    results = []
    for test in tests:
        results.append(test())

    print("\n" + "=" * 60)
    print("Test Results")
    print("=" * 60)

    passed = sum(results)
    total = len(results)

    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("\n✓ All tests passed! The application is ready to use.")
        print("\nTry running:")
        print("  python main.py -i examples/ruy_lopez.txt -o test.mp4")
        return 0
    else:
        print("\n✗ Some tests failed. Please check your installation.")
        print("\nTry running:")
        print("  pip install -r requirements.txt")
        return 1

if __name__ == '__main__':
    sys.exit(main())
