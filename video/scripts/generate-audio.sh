#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Installing Python audio deps"
python3 -m pip install -q --upgrade pip 2>/dev/null || true
python3 -m pip install -q kokoro-onnx soundfile numpy 2>/dev/null || true

echo "==> Generating voiceover"
python3 scripts/generate-voiceover.py

echo "==> Generating music"
bash scripts/generate-music.sh

echo "==> Generating subtitles"
python3 scripts/generate-subtitles.py

mkdir -p public/audio
cp audio/voiceover.wav public/audio/
cp audio/music.wav public/audio/

# Normalize voiceover to 45 seconds
ffmpeg -y -i public/audio/voiceover.wav -af "apad=pad_dur=45,atrim=0:45" -ar 48000 -ac 2 public/audio/voiceover.wav 2>/dev/null || true
ffmpeg -y -i public/audio/music.wav -af "atrim=0:45" -ar 48000 -ac 2 public/audio/music.wav 2>/dev/null || true

echo "✓ Audio pipeline complete"
