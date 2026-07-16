import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { NetworkBackground } from "../components/NetworkBackground";
import { BRAND } from "../styles/brand";

const AGENTS = ["Architect Agent", "Developer Agent", "Research Agent", "Automation Agent"];
const MCP = ["Database", "Files", "External Tools", "APIs"];

export function Scene5Ecosystem() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <NetworkBackground intensity={0.7} />
      <AbsoluteFill style={{ padding: 80, flexDirection: "row", gap: 60 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: BRAND.text, fontSize: 44, fontWeight: 600, marginBottom: 32, fontFamily: BRAND.fontFamily }}>
            Agent Registry
          </div>
          {AGENTS.map((agent, i) => {
            const enter = spring({ frame: frame - i * 10, fps, config: { damping: 200 } });
            return (
              <div
                key={agent}
                style={{
                  opacity: enter,
                  marginBottom: 16,
                  padding: "16px 20px",
                  borderLeft: `4px solid ${BRAND.accent}`,
                  color: BRAND.text,
                  fontFamily: BRAND.mono,
                  fontSize: 24,
                  background: "rgba(1,100,255,0.06)",
                }}
              >
                ● {agent}
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: BRAND.text, fontSize: 44, fontWeight: 600, marginBottom: 32, fontFamily: BRAND.fontFamily }}>
            MCP Connections
          </div>
          {MCP.map((item, i) => {
            const enter = spring({ frame: frame - 20 - i * 10, fps, config: { damping: 200 } });
            return (
              <div
                key={item}
                style={{
                  opacity: enter,
                  marginBottom: 16,
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: `1px solid ${BRAND.accent}55`,
                  color: BRAND.text,
                  fontFamily: BRAND.mono,
                  fontSize: 24,
                }}
              >
                ⇄ {item}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
