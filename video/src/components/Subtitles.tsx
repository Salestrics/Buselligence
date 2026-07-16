import subtitles from "../../public/subtitles.json";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../styles/brand";

interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

export function Subtitles() {
  const frame = useCurrentFrame();
  const time = frame / 60;
  const active = (subtitles as SubtitleSegment[]).find((s) => time >= s.start && time < s.end);

  if (!active) return null;

  const localFrame = (time - active.start) * 60;
  const opacity = interpolate(localFrame, [0, 8, (active.end - active.start) * 60 - 8, (active.end - active.start) * 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80 }}>
      <div
        style={{
          opacity,
          maxWidth: 1400,
          padding: "16px 32px",
          borderRadius: 12,
          background: "rgba(0,0,0,0.75)",
          border: `1px solid ${BRAND.accent}44`,
          color: BRAND.text,
          fontFamily: BRAND.fontFamily,
          fontSize: 32,
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
}
