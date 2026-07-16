import { cn } from "../lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
  className?: string;
}

const heights = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
};

export function Logo({ size = "sm", showGlow = false, className }: LogoProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      {showGlow && (
        <div className="absolute -inset-3 rounded-2xl bg-brand-500/15 blur-xl" />
      )}
      <img
        src="/buselligence-logo.png"
        alt="Buselligence — Unlocking the Power of AI"
        className={cn("relative w-auto object-contain object-left", heights[size])}
      />
    </div>
  );
}
