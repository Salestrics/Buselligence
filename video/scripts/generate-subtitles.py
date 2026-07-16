#!/usr/bin/env python3
"""Generate subtitles from voiceover using OpenAI Whisper (open-source)."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICEOVER = ROOT / "audio" / "voiceover.wav"
OUTPUT = ROOT / "public" / "subtitles.json"


def whisper_segments() -> list[dict]:
    try:
        import whisper
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "openai-whisper"], check=True)
        import whisper

    model = whisper.load_model("base")
    result = model.transcribe(str(VOICEOVER), word_timestamps=False)
    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "start": round(seg["start"], 2),
            "end": round(seg["end"], 2),
            "text": seg["text"].strip(),
        })
    return segments


def fallback_segments() -> list[dict]:
    return json.loads((ROOT / "public" / "subtitles.json").read_text())


def main() -> None:
    if not VOICEOVER.exists():
        print("Voiceover missing — using scripted subtitles", file=sys.stderr)
        return

    try:
        segments = whisper_segments()
        if len(segments) < 3:
            raise RuntimeError("Too few segments")
    except Exception as exc:
        print(f"Whisper failed ({exc}) — keeping scripted subtitles", file=sys.stderr)
        segments = fallback_segments()

    OUTPUT.write_text(json.dumps(segments, indent=2) + "\n")
    print(f"✓ Subtitles: {OUTPUT} ({len(segments)} segments)")


if __name__ == "__main__":
    main()
