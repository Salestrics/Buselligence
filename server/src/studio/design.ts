export interface DesignTheme {
  name: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  borderRadius: string;
  shadows: string[];
}

export interface DesignResult {
  theme: DesignTheme;
  components: string;
  layout: string;
  styles: string;
}

const STRIPE_THEME: DesignTheme = {
  name: "Stripe-inspired",
  colors: {
    primary: "#635BFF",
    background: "#F6F9FC",
    surface: "#FFFFFF",
    text: "#0A2540",
    textMuted: "#425466",
    border: "#E3E8EE",
    success: "#32D583",
    warning: "#F5A623",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    headingWeight: "600",
    bodySize: "15px",
  },
  borderRadius: "8px",
  shadows: [
    "0 1px 3px rgba(0,0,0,0.08)",
    "0 4px 12px rgba(0,0,0,0.05)",
  ],
};

export function generateDesign(prompt: string): DesignResult {
  const lower = prompt.toLowerCase();
  const theme = lower.includes("stripe") ? STRIPE_THEME : {
    ...STRIPE_THEME,
    name: "Custom",
    colors: { ...STRIPE_THEME.colors, primary: "#6366F1" },
  };

  return {
    theme,
    layout: `<div className="min-h-screen bg-[${theme.colors.background}]">
  <header className="border-b bg-white px-6 py-4">
    <nav className="flex items-center justify-between max-w-6xl mx-auto">
      <Logo />
      <NavLinks />
    </nav>
  </header>
  <main className="max-w-6xl mx-auto p-6">
    <MetricsGrid />
    <ChartsSection />
  </main>
</div>`,
    components: `// MetricCard.tsx
export function MetricCard({ label, value, change }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm" style={{ borderRadius: "${theme.borderRadius}" }}>
      <p className="text-sm" style={{ color: "${theme.colors.textMuted}" }}>{label}</p>
      <p className="text-3xl font-semibold mt-1" style={{ color: "${theme.colors.text}" }}>{value}</p>
      {change && <span className="text-sm" style={{ color: "${theme.colors.success}" }}>{change}</span>}
    </div>
  );
}`,
    styles: `:root {
  --color-primary: ${theme.colors.primary};
  --color-bg: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text: ${theme.colors.text};
  --font-family: ${theme.typography.fontFamily};
  --radius: ${theme.borderRadius};
}`,
  };
}
