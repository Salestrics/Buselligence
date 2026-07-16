#!/usr/bin/env python3
"""Generate voiceover using Kokoro TTS (preferred) or espeak-ng fallback."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "models"
AUDIO = ROOT / "audio"
SCRIPT = ROOT / "scripts" / "voiceover.txt"
OUTPUT = AUDIO / "voiceover.wav"


def generate_kokoro(text: str) -> bool:
    onnx = MODELS / "kokoro-v1.0.onnx"
    voices = MODELS / "voices-v1.0.bin"
    if not onnx.exists() or not voices.exists():
        return False
    try:
        import numpy as np
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError:
        return False

    kokoro = Kokoro(str(onnx), str(voices))
    samples, sample_rate = kokoro.create(text, voice="am_michael", speed=0.95, lang="en-us")
    sf.write(str(OUTPUT), samples, sample_rate)
    return True


def generate_espeak(text: str) -> None:
    raw = AUDIO / "voiceover_raw.wav"
    subprocess.run(
        ["espeak-ng", "-v", "en-us", "-s", "150", "-p", "20", "-w", str(raw), text],
        check=True,
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(raw),
            "-af", "highpass=f=80,lowpass=f=8000,volume=1.2",
            str(OUTPUT),
        ],
        check=True,
        capture_output=True,
    )
    raw.unlink(missing_ok=True)


def main() -> None:
    AUDIO.mkdir(parents=True, exist_ok=True)
    MODELS.mkdir(parents=True, exist_ok=True)
    text = SCRIPT.read_text().strip().replace("\n\n", " ... ").replace("\n", " ")

    if not (MODELS / "kokoro-v1.0.onnx").exists():
        print("Downloading Kokoro models...")
        subprocess.run(
            ["bash", str(ROOT / "scripts" / "download-kokoro.sh")],
            check=False,
        )

    if generate_kokoro(text):
        print(f"✓ Kokoro voiceover: {OUTPUT}")
        return

    print("Kokoro unavailable — using espeak-ng fallback", file=sys.stderr)
    generate_espeak(text)
    print(f"✓ espeak voiceover: {OUTPUT}")


if __name__ == "__main__":
    main()
