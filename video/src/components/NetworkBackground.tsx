import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../styles/brand";

export function NetworkBackground({ intensity = 1 }: { intensity?: number }) {
  const frame = useCurrentFrame();
  const nodes = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 137) % 100,
    y: (i * 89) % 100,
    phase: i * 0.7,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, overflow: "hidden" }}>
      <svg width="100%" height="100%" style={{ opacity: 0.35 * intensity }}>
        {nodes.map((node, i) =>
          nodes.slice(i + 1, i + 4).map((target, j) => {
            const pulse = interpolate(
              (frame + node.phase * 20) % 120,
              [0, 60, 120],
              [0.1, 0.5, 0.1]
            );
            return (
              <line
                key={`${i}-${j}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={BRAND.accent}
                strokeWidth={1}
                opacity={pulse * intensity}
              />
            );
          })
        )}
        {nodes.map((node, i) => {
          const scale = interpolate((frame + i * 8) % 90, [0, 45, 90], [0.6, 1.2, 0.6]);
          return (
            <circle
              key={i}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={3 * scale}
              fill={BRAND.accent}
              opacity={0.6 * intensity}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}
