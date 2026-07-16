import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { NetworkBackground } from "../components/NetworkBackground";
import { BRAND } from "../styles/brand";

const MODULES = [
  "AI Chat",
  "Agent Registry",
  "MCP Integrations",
  "Code Generation",
  "Developer Workspace",
];

export function Scene3Platform() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <NetworkBackground intensity={0.5} />
      <AbsoluteFill style={{ padding: 80, justifyContent: "center" }}>
        <div style={{ color: BRAND.text, fontSize: 56, fontWeight: 700, marginBottom: 40, fontFamily: BRAND.fontFamily }}>
          Meet Buselligence
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {MODULES.map((mod, i) => {
            const enter = spring({ frame: frame - i * 8, fps, config: { damping: 200 } });
            return (
              <div
                key={mod}
                style={{
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 30}px)`,
                  padding: "24px 32px",
                  borderRadius: 16,
                  border: `1px solid ${BRAND.accent}66`,
                  background: "rgba(1,100,255,0.08)",
                  color: BRAND.text,
                  fontSize: 28,
                  fontFamily: BRAND.mono,
                  boxShadow: `0 0 30px ${BRAND.accent}22`,
                }}
              >
                {mod}
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 48,
            color: BRAND.accent,
            fontSize: 24,
            fontFamily: BRAND.fontFamily,
            opacity: interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Open-source AI development platform
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
