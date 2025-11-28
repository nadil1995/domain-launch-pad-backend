#!/usr/bin/env python3
"""
Chess Theory Video Generator - Main Application
Generate realistic videos from chess theory notation
"""

import argparse
import sys
import os
from parser import ChessTheoryParser
from video_generator import ChessVideoGenerator


def validate_file(filepath: str) -> bool:
    """Validate input file exists"""
    if not os.path.exists(filepath):
        print(f"Error: Input file '{filepath}' not found")
        return False
    return True


def main():
    """Main application entry point"""
    parser = argparse.ArgumentParser(
        description='Generate realistic chess theory videos from notation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --input theory.txt --output video.mp4
  %(prog)s -i opening.pgn -o opening.mp4 --style wood --fps 60
  %(prog)s -i theory.txt -o video.mp4 --duration 3 --size 1024

Supported input formats:
  - PGN notation with comments
  - UCI notation
  - Algebraic notation with annotations
  - Structured format (see README.md)
        """
    )

    # Required arguments
    parser.add_argument(
        '-i', '--input',
        required=True,
        help='Input file containing chess theory'
    )

    parser.add_argument(
        '-o', '--output',
        default='output.mp4',
        help='Output video file path (default: output.mp4)'
    )

    # Optional arguments
    parser.add_argument(
        '--fps',
        type=int,
        default=30,
        choices=[24, 30, 60],
        help='Frames per second (default: 30)'
    )

    parser.add_argument(
        '--duration',
        type=float,
        default=2.0,
        help='Duration per move in seconds (default: 2.0)'
    )

    parser.add_argument(
        '--size',
        type=int,
        default=800,
        choices=[600, 800, 1024, 1280],
        help='Board size in pixels (default: 800)'
    )

    parser.add_argument(
        '--style',
        default='default',
        choices=['default', 'wood', 'marble', 'blue', 'green'],
        help='Board color style (default: default)'
    )

    parser.add_argument(
        '--intro-duration',
        type=float,
        default=3.0,
        help='Intro screen duration in seconds (default: 3.0)'
    )

    parser.add_argument(
        '--outro-duration',
        type=float,
        default=2.0,
        help='Outro screen duration in seconds (default: 2.0)'
    )

    parser.add_argument(
        '--thumbnail',
        action='store_true',
        help='Generate thumbnail image alongside video'
    )

    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Verbose output'
    )

    parser.add_argument(
        '--narrator',
        action='store_true',
        help='Enable text-to-speech narration for annotations and text'
    )

    parser.add_argument(
        '--narrator-rate',
        type=int,
        default=150,
        help='Narrator speech rate in words per minute (default: 150)'
    )

    args = parser.parse_args()

    # Validate input
    if not validate_file(args.input):
        sys.exit(1)

    # Print configuration
    print("=" * 60)
    print("Chess Theory Video Generator")
    print("=" * 60)
    print(f"Input file:     {args.input}")
    print(f"Output video:   {args.output}")
    print(f"Board size:     {args.size}x{args.size}")
    print(f"Style:          {args.style}")
    print(f"FPS:            {args.fps}")
    print(f"Move duration:  {args.duration}s")
    if args.narrator:
        print(f"Narrator:       Enabled (rate: {args.narrator_rate} wpm)")
    print("=" * 60)
    print()

    try:
        # Parse chess theory
        print("Step 1: Parsing chess theory...")
        theory_parser = ChessTheoryParser()
        theory_data = theory_parser.parse_file(args.input)

        if theory_data['move_count'] == 0:
            print("Error: No valid moves found in input file")
            sys.exit(1)

        print(f"✓ Successfully parsed {theory_data['move_count']} moves")
        if theory_data['title']:
            print(f"  Title: {theory_data['title']}")
        if theory_data['description']:
            print(f"  Description: {theory_data['description']}")
        print()

        # Generate video
        print("Step 2: Generating video...")
        video_gen = ChessVideoGenerator(
            size=args.size,
            fps=args.fps,
            style=args.style,
            enable_narrator=args.narrator,
            narrator_rate=args.narrator_rate
        )

        video_gen.generate_video(
            theory_data=theory_data,
            output_path=args.output,
            move_duration=args.duration,
            intro_duration=args.intro_duration,
            outro_duration=args.outro_duration
        )

        print(f"✓ Video generated successfully: {args.output}")
        print()

        # Generate thumbnail if requested
        if args.thumbnail:
            thumbnail_path = os.path.splitext(args.output)[0] + '_thumbnail.png'
            print("Step 3: Generating thumbnail...")
            video_gen.create_thumbnail(theory_data, thumbnail_path)
            print(f"✓ Thumbnail generated: {thumbnail_path}")
            print()

        # Calculate video stats
        total_duration = (
            args.intro_duration +
            (theory_data['move_count'] * args.duration) +
            args.outro_duration
        )

        print("=" * 60)
        print("Generation Complete!")
        print("=" * 60)
        print(f"Total moves:      {theory_data['move_count']}")
        print(f"Video duration:   {total_duration:.1f}s")
        print(f"File size:        {os.path.getsize(args.output) / (1024*1024):.2f} MB")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
