#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
TARGET=45

echo "==> Installing Python audio deps"
python3 -m pip install -q --upgrade pip 2>/dev/null || true
python3 -m pip install -q kokoro-onnx soundfile numpy 2>/dev/null || true

echo "==> Generating voiceover"
python3 scripts/generate-voiceover.py

echo "==> Generating music"
bash scripts/generate-music.sh

mkdir -p public/audio
cp audio/voiceover.wav public/audio/voiceover.wav
cp audio/music.wav public/audio/music.wav

# Trim music to exact video length
ffmpeg -y -i public/audio/music.wav -af "atrim=0:${TARGET}" -ar 48000 -ac 2 public/audio/music-trim.wav 2>/dev/null
mv public/audio/music-trim.wav public/audio/music.wav

VO_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/audio/voiceover.wav || echo "?")
echo "✓ Voiceover duration: ${VO_DUR}s (video: ${TARGET}s)"
echo "✓ Audio pipeline complete (no subtitles)"
