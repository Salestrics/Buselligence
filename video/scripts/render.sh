#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Audio pipeline"
bash scripts/generate-audio.sh

echo "==> Installing Remotion deps"
npm install --silent

echo "==> Rendering 1920x1080 @ 60fps (45s)"
mkdir -p output
npx remotion render src/index.tsx LaunchTrailer output/buselligence-launch-trailer.mp4 \
  --codec=h264 \
  --crf=18 \
  --pixel-format=yuv420p \
  --concurrency=4

echo ""
echo "============================================"
echo "✓ FINAL MP4: $ROOT/output/buselligence-launch-trailer.mp4"
echo "============================================"
