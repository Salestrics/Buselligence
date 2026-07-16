# Buselligence Launch Trailer

45-second Product Hunt launch video for **The Buselligence Project**.

## Quick start

```bash
cd video
bash scripts/render.sh
```

Output: `output/buselligence-launch-trailer.mp4` (1920×1080, 60fps, H.264)

## Regenerate after UI changes

```bash
cd video
npm start                    # preview in Remotion Studio
bash scripts/render.sh       # full pipeline: audio + render
```

Visual-only (no audio re-generation):

```bash
npx remotion render src/index.tsx LaunchTrailer output/buselligence-launch-trailer.mp4
```

## Dependencies

| Tool | Purpose |
|------|---------|
| Node.js 20+ | Remotion |
| FFmpeg | Music synthesis, audio processing, final mux |
| Python 3.10+ | Kokoro TTS voiceover |
| espeak-ng | TTS fallback if Kokoro unavailable |

Install system deps (Ubuntu/Debian):

```bash
sudo apt-get install -y ffmpeg espeak-ng
```

Python packages (installed automatically by scripts):

```bash
pip install kokoro-onnx soundfile numpy
```

## Pipeline

1. `scripts/generate-voiceover.py` — Kokoro TTS (preferred) or espeak-ng, fitted to 43s
2. `scripts/generate-music.sh` — FFmpeg ambient score (45s)
3. `npx remotion render` — 1920×1080 @ 60fps, no burned-in captions

## Asset locations

| Asset | Path |
|-------|------|
| Logo | `public/logo.png` |
| Voiceover script | `scripts/voiceover.txt` |
| Audio (generated) | `public/audio/voiceover.wav`, `public/audio/music.wav` |
| Final MP4 | `output/buselligence-launch-trailer.mp4` |

## Scenes

| Time | Scene |
|------|-------|
| 0–5s | Opening — logo + network activation |
| 5–10s | Problem — fragmented AI tools |
| 10–17s | Platform reveal |
| 17–25s | Idea → software workflow |
| 25–32s | Agent + MCP ecosystem |
| 32–38s | Open source moment |
| 38–45s | CTA — GitHub |

## Brand

- Background: `#000000`
- Text: `#c0c0c0`
- Accent: `#0164ff`
- Logo: `Buselligence_Logo` (do not modify)

© [Salestrics Inc.](https://www.salestrics.com)
