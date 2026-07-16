import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "../components/Logo";
import { NetworkBackground } from "../components/NetworkBackground";
import { BRAND } from "../styles/brand";

export function Scene1Opening() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = spring({ frame: frame - 1.5 * fps, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <NetworkBackground intensity={interpolate(frame, [0, 60], [0.2, 1], { extrapolateRight: "clamp" })} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: 48,
        }}
      >
        <Logo scale={1} />
        <div
          style={{
            opacity: titleOpacity,
            color: BRAND.text,
            fontFamily: BRAND.fontFamily,
            fontSize: 42,
            fontWeight: 500,
            letterSpacing: 2,
          }}
        >
          The Buselligence Project
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
