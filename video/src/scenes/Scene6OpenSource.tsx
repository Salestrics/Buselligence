import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../styles/brand";

const NODES = ["GitHub", "Community", "Extensions", "Self-hosted"];

export function Scene6OpenSource() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotate = interpolate(frame, [0, 180], [0, 90]);

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, padding: 80, justifyContent: "center", alignItems: "center" }}>
      <div style={{ color: BRAND.text, fontSize: 56, fontWeight: 700, marginBottom: 60, fontFamily: BRAND.fontFamily }}>
        AI Should Be Open
      </div>
      <div style={{ position: "relative", width: 700, height: 700 }}>
        {NODES.map((node, i) => {
          const angle = (i / NODES.length) * Math.PI * 2 + (rotate * Math.PI) / 180;
          const x = Math.cos(angle) * 260;
          const y = Math.sin(angle) * 260;
          const enter = spring({ frame: frame - i * 8, fps, config: { damping: 200 } });
          return (
            <div
              key={node}
              style={{
                position: "absolute",
                left: 350 + x,
                top: 350 + y,
                transform: "translate(-50%, -50%)",
                opacity: enter,
                padding: "20px 28px",
                borderRadius: 999,
                border: `2px solid ${BRAND.accent}`,
                color: BRAND.text,
                fontFamily: BRAND.mono,
                fontSize: 22,
                background: "#0a0a0a",
              }}
            >
              {node}
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: BRAND.accent,
            fontFamily: BRAND.fontFamily,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          MIT Licensed
        </div>
      </div>
      <div style={{ marginTop: 40, display: "flex", gap: 32, color: BRAND.text, fontSize: 24, fontFamily: BRAND.fontFamily }}>
        {["Open Source", "Self Hosted", "Extensible"].map((t) => (
          <span key={t}>✓ {t}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
}
