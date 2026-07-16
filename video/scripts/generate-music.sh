#!/usr/bin/env bash
# Generate minimal cinematic ambient music with FFmpeg (open-source synthesis)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/audio/music.wav"
mkdir -p "$ROOT/audio"

ffmpeg -y \
  -f lavfi -i "sine=frequency=110:duration=45" \
  -f lavfi -i "sine=frequency=165:duration=45" \
  -f lavfi -i "sine=frequency=220:duration=45" \
  -filter_complex "\
[0:a]volume=0.08[a0];\
[1:a]volume=0.05[a1];\
[2:a]volume=0.03[a2];\
[a0][a1][a2]amix=inputs=3:duration=first,\
afade=t=in:st=0:d=2,\
afade=t=out:st=42:d=3,\
lowpass=f=1200,\
highpass=f=60,\
volume=0.35" \
  -ar 48000 -ac 2 "$OUT"

echo "✓ Music: $OUT"
