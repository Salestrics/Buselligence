import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRAND } from "../styles/brand";

export function Logo({ scale = 1, glow = true }: { scale?: number; glow?: boolean }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const glowOpacity = glow ? interpolate(frame % 90, [0, 45, 90], [0.3, 0.7, 0.3]) : 0;

  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      {glow && (
        <div
          style={{
            position: "absolute",
            inset: -40,
            background: `radial-gradient(circle, ${BRAND.accent}55 0%, transparent 70%)`,
            opacity: glowOpacity,
            filter: "blur(30px)",
          }}
        />
      )}
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 520 * scale,
          height: "auto",
          opacity,
          objectFit: "contain",
        }}
      />
    </div>
  );
}
