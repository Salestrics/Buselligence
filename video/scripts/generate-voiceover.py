#!/usr/bin/env python3
"""Generate voiceover using Kokoro TTS (preferred) or espeak-ng fallback."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "models"
AUDIO = ROOT / "audio"
SCRIPT = ROOT / "scripts" / "voiceover.txt"
OUTPUT = AUDIO / "voiceover.wav"
TARGET_SECONDS = 43.0  # leave ~2s tail room inside 45s video


def load_narration_text() -> str:
    lines: list[str] = []
    for raw in SCRIPT.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("```"):
            continue
        lines.append(line)
    return " ".join(lines)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def fit_duration(path: Path, target: float = TARGET_SECONDS) -> None:
    duration = probe_duration(path)
    if duration <= 0:
        return

    tmp = path.with_suffix(".fitted.wav")
    if duration > target:
        # Speed up slightly to fit without cutting words
        tempo = min(duration / target, 1.25)
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(path),
                "-af", f"atempo={tempo:.4f},apad=pad_dur={target},atrim=0:{target}",
                "-ar", "48000", "-ac", "2", str(tmp),
            ],
            check=True,
            capture_output=True,
        )
    else:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(path),
                "-af", f"apad=pad_dur={target},atrim=0:{target}",
                "-ar", "48000", "-ac", "2", str(tmp),
            ],
            check=True,
            capture_output=True,
        )

    tmp.replace(path)
    final = probe_duration(path)
    print(f"✓ Voiceover fitted: {duration:.2f}s → {final:.2f}s (target {target}s)")


def generate_kokoro(text: str, speed: float) -> bool:
    onnx = MODELS / "kokoro-v1.0.onnx"
    voices = MODELS / "voices-v1.0.bin"
    if not onnx.exists() or not voices.exists():
        return False
    try:
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError:
        return False

    kokoro = Kokoro(str(onnx), str(voices))
    samples, sample_rate = kokoro.create(text, voice="am_michael", speed=speed, lang="en-us")
    sf.write(str(OUTPUT), samples, sample_rate)
    return True


def generate_espeak(text: str) -> None:
    raw = AUDIO / "voiceover_raw.wav"
    subprocess.run(
        ["espeak-ng", "-v", "en-us", "-s", "165", "-p", "20", "-w", str(raw), text],
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
    text = load_narration_text()
    if not text:
        print("No narration text found in voiceover.txt", file=sys.stderr)
        sys.exit(1)

    if re.search(r"voiceover\.txt|launch trailer|45s|\bhash\b", text, re.I):
        print("Narration text looks contaminated — check voiceover.txt", file=sys.stderr)
        sys.exit(1)

    print(f"Narration ({len(text)} chars)")

    if not (MODELS / "kokoro-v1.0.onnx").exists():
        print("Downloading Kokoro models...")
        subprocess.run(["bash", str(ROOT / "scripts" / "download-kokoro.sh")], check=False)

    ok = generate_kokoro(text, speed=1.02)
    if not ok:
        print("Kokoro unavailable — using espeak-ng fallback", file=sys.stderr)
        generate_espeak(text)

    fit_duration(OUTPUT)
    print(f"✓ Voiceover: {OUTPUT}")


if __name__ == "__main__":
    main()
