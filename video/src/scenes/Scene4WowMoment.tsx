import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "../styles/brand";

const STEPS = [
  { label: "Idea", text: '"Build an inventory management system."' },
  { label: "AI Planning", text: "Architecture + requirements" },
  { label: "Agent Assistance", text: "Collaborative development" },
  { label: "Generated Code", text: "src/ · api/ · schema/" },
  { label: "Application", text: "Working workflow" },
];

export function Scene4WowMoment() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, padding: 80 }}>
      <div style={{ color: BRAND.text, fontSize: 48, fontWeight: 600, fontFamily: BRAND.fontFamily, marginBottom: 48 }}>
        From Idea → AI-Powered Software
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200 }}>
        {STEPS.map((step, i) => {
          const enter = spring({ frame: frame - i * 12, fps, config: { damping: 200 } });
          return (
            <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 24, opacity: enter }}>
              <div
                style={{
                  width: 180,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: BRAND.accent,
                  color: "#fff",
                  fontFamily: BRAND.mono,
                  fontSize: 20,
                  textAlign: "center",
                }}
              >
                {step.label}
              </div>
              <div style={{ color: BRAND.accent, fontSize: 28 }}>→</div>
              <div
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.text}33`,
                  color: BRAND.text,
                  fontFamily: BRAND.mono,
                  fontSize: 22,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {step.text}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 80,
          color: BRAND.text,
          fontSize: 22,
          opacity: interpolate(frame, [120, 150], [0, 1], { extrapolateRight: "clamp" }),
          fontFamily: BRAND.fontFamily,
        }}
      >
        AI helps everyone build faster.
      </div>
    </AbsoluteFill>
  );
}
