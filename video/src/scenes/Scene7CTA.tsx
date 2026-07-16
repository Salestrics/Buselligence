import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "../components/Logo";
import { NetworkBackground } from "../components/NetworkBackground";
import { BRAND } from "../styles/brand";

export function Scene7CTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = spring({ frame, fps, config: { damping: 200 } });
  const ctaOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <NetworkBackground intensity={0.8} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 36,
          transform: `scale(${0.9 + zoom * 0.1})`,
        }}
      >
        <Logo scale={0.9} />
        <div style={{ color: BRAND.text, fontSize: 48, fontWeight: 600, fontFamily: BRAND.fontFamily, textAlign: "center" }}>
          The Buselligence Project
        </div>
        <div style={{ color: BRAND.text, fontSize: 28, fontFamily: BRAND.fontFamily, opacity: 0.9 }}>
          Open Source AI Development Platform
        </div>
        <div
          style={{
            opacity: ctaOpacity,
            color: BRAND.accent,
            fontSize: 32,
            fontFamily: BRAND.mono,
            marginTop: 20,
          }}
        >
          github.com/Salestrics/Buselligence
        </div>
        <div style={{ opacity: ctaOpacity, color: BRAND.text, fontSize: 22, fontFamily: BRAND.fontFamily }}>
          Give everyone the power of AI.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
