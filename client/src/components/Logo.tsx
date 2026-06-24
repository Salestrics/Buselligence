import { ChartColumnIncreasing } from "lucide-react";
import { cn } from "../lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: "h-9 w-9 rounded-xl", icon: "h-[18px] w-[18px]" },
  md: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-16 w-16 rounded-2xl", icon: "h-8 w-8" },
};

export function Logo({ size = "sm", showGlow = false, className }: LogoProps) {
  const { box, icon } = sizes[size];

  return (
    <div className={cn("relative shrink-0", className)}>
      {showGlow && (
        <div className="absolute -inset-2 rounded-2xl bg-brand-500/20 blur-xl" />
      )}
      <div
        className={cn(
          "relative flex items-center justify-center border border-brand-500/30 bg-gradient-to-br from-brand-500/25 via-brand-600/20 to-[#121a2f] shadow-lg shadow-brand-900/30",
          box
        )}
      >
        <ChartColumnIncreasing
          className={cn(icon, "text-brand-200")}
          strokeWidth={2.25}
        />
      </div>
    </div>
  );
}
