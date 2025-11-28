"""
Text-to-speech narrator for chess theory videos
Converts text annotations and display text to audio narration
"""

import os
import tempfile
from typing import Optional, List, Tuple
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False


class ChessNarrator:
    """Generate narration for chess theory videos"""

    def __init__(self, rate: int = 150, voice_id: int = 0):
        """
        Initialize narrator

        Args:
            rate: Speech rate in words per minute (default: 150)
            voice_id: Voice ID (0 for male, 1 for female if available)
        """
        if not PYTTSX3_AVAILABLE:
            raise ImportError(
                "pyttsx3 is required for narrator support. "
                "Install with: pip install pyttsx3"
            )

        self.rate = rate
        self.voice_id = voice_id
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', rate)
        self._set_voice(voice_id)

    def _set_voice(self, voice_id: int):
        """Set the narrator voice"""
        try:
            voices = self.engine.getProperty('voices')
            if voice_id < len(voices):
                self.engine.setProperty('voices', voices[voice_id].id)
        except:
            pass

    def text_to_speech(self, text: str, output_file: str) -> bool:
        """
        Convert text to speech and save to file

        Args:
            text: Text to convert
            output_file: Output audio file path

        Returns:
            True if successful, False otherwise
        """
        try:
            self.engine.save_to_file(text, output_file)
            self.engine.runAndWait()
            return os.path.exists(output_file) and os.path.getsize(output_file) > 0
        except Exception as e:
            print(f"Error generating narration: {e}")
            return False

    def generate_narration(self, text: str, temp_dir: str = None) -> Optional[str]:
        """
        Generate narration from text

        Args:
            text: Text to narrate
            temp_dir: Temporary directory for audio file

        Returns:
            Path to generated audio file or None if failed
        """
        if not text or not text.strip():
            return None

        try:
            if temp_dir is None:
                temp_dir = tempfile.gettempdir()

            # Create temp audio file
            temp_file = os.path.join(temp_dir, f'narration_{id(text)}.wav')

            if self.text_to_speech(text, temp_file):
                return temp_file
            else:
                return None
        except Exception as e:
            print(f"Error in generate_narration: {e}")
            return None

    @staticmethod
    def estimate_duration(text: str, wpm: int = 150) -> float:
        """
        Estimate narration duration for text

        Args:
            text: Text to estimate
            wpm: Words per minute (default: 150)

        Returns:
            Estimated duration in seconds
        """
        word_count = len(text.split())
        minutes = word_count / wpm
        return max(minutes * 60, 2.0)  # Minimum 2 seconds


class SimpleNarrator:
    """Simple text-to-speech narrator without external dependencies"""

    def __init__(self, rate: int = 150):
        """Initialize simple narrator with fallback support"""
        self.rate = rate
        self.pyttsx3_available = PYTTSX3_AVAILABLE
        self.narrator = None

        if PYTTSX3_AVAILABLE:
            try:
                self.narrator = ChessNarrator(rate=rate)
            except Exception as e:
                print(f"Warning: Could not initialize pyttsx3: {e}")
                self.narrator = None

    def generate_narration(self, text: str, temp_dir: str = None) -> Optional[str]:
        """
        Generate narration with fallback to pyttsx3

        Args:
            text: Text to narrate
            temp_dir: Temporary directory

        Returns:
            Path to audio file or None
        """
        if self.narrator:
            return self.narrator.generate_narration(text, temp_dir)
        else:
            print("Warning: Narrator not available. Install pyttsx3 for narration support.")
            return None

    @staticmethod
    def estimate_duration(text: str, wpm: int = 150) -> float:
        """Estimate narration duration"""
        return ChessNarrator.estimate_duration(text, wpm)


if __name__ == '__main__':
    # Test the narrator
    try:
        narrator = ChessNarrator(rate=150)

        # Test text
        test_text = "The Ruy Lopez is one of the oldest and most popular chess openings"

        # Generate narration
        output_file = "test_narration.wav"
        if narrator.text_to_speech(test_text, output_file):
            print(f"✓ Narration generated: {output_file}")
            print(f"  Estimated duration: {ChessNarrator.estimate_duration(test_text):.1f} seconds")
        else:
            print("✗ Failed to generate narration")

    except ImportError as e:
        print(f"Error: {e}")
        print("\nTo use narrator, install pyttsx3:")
        print("  pip install pyttsx3")
