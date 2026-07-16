import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "../components/Logo";
import { BRAND } from "../styles/brand";

const FRAGMENTS = [
  "AI Chat",
  "OpenAI",
  "Anthropic",
  "Dev Tools",
  "Workflows",
  "Vendor Lock-in",
  "Complex Setup",
];

export function Scene2Problem() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const converge = spring({ frame: frame - 3 * fps, fps, config: { damping: 180 } });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg }}>
      <AbsoluteFill style={{ padding: 80 }}>
        <div style={{ color: BRAND.text, fontSize: 52, fontWeight: 600, fontFamily: BRAND.fontFamily }}>
          AI is powerful. But access is fragmented.
        </div>
        <div style={{ position: "relative", flex: 1, marginTop: 60, minHeight: 500 }}>
          {FRAGMENTS.map((label, i) => {
            const angle = (i / FRAGMENTS.length) * Math.PI * 2;
            const spread = interpolate(converge, [0, 1], [320, 0]);
            const x = Math.cos(angle) * spread;
            const y = Math.sin(angle) * spread;
            const opacity = interpolate(converge, [0, 0.7, 1], [1, 0.6, 0]);
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                  padding: "14px 22px",
                  border: `1px solid ${BRAND.text}44`,
                  borderRadius: 12,
                  background: "#111",
                  color: BRAND.text,
                  fontFamily: BRAND.mono,
                  fontSize: 20,
                  opacity,
                }}
              >
                {label}
              </div>
            );
          })}
          <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", opacity: converge }}>
            <Logo scale={0.7} glow />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
