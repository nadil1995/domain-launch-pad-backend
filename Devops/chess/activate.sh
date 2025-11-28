#!/bin/bash
# Source this file to activate the virtual environment
# Usage: source activate.sh

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "$SCRIPT_DIR/.venv/bin/activate" ]; then
    source "$SCRIPT_DIR/.venv/bin/activate"
    echo "✓ Virtual environment activated!"
    echo ""
    echo "You can now run:"
    echo "  python test_app.py"
    echo "  python main.py -i examples/ruy_lopez.txt -o video.mp4"
    echo ""
    echo "To deactivate, run: deactivate"
else
    echo "Error: Virtual environment not found at $SCRIPT_DIR/.venv"
    echo "Run ./setup.sh first to create it"
fi
