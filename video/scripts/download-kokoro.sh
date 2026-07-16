#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODELS="$ROOT/models"
mkdir -p "$MODELS"
cd "$MODELS"
if [ ! -f kokoro-v1.0.onnx ]; then
  curl -fsSL -o kokoro-v1.0.onnx \
    "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
fi
if [ ! -f voices-v1.0.bin ]; then
  curl -fsSL -o voices-v1.0.bin \
    "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"
fi
echo "✓ Kokoro models ready"
