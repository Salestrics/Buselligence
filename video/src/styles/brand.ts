export const BRAND = {
  bg: "#000000",
  text: "#c0c0c0",
  accent: "#0164ff",
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  mono: "JetBrains Mono, SF Mono, Consolas, monospace",
} as const;

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_SECONDS = 45;
export const DURATION_FRAMES = FPS * DURATION_SECONDS;

export const SCENES = {
  scene1: { start: 0, end: 5 },
  scene2: { start: 5, end: 10 },
  scene3: { start: 10, end: 17 },
  scene4: { start: 17, end: 25 },
  scene5: { start: 25, end: 32 },
  scene6: { start: 32, end: 38 },
  scene7: { start: 38, end: 45 },
} as const;
