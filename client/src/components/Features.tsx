import { BarChart3, Brain, KeyRound, LineChart, Plug, Shield } from "lucide-react";

const features = [
  {
    icon: KeyRound,
    title: "Bring your own API",
    description:
      "Use your OpenAI, Anthropic, or Google API keys. No vendor lock-in — you control cost, models, and data residency.",
  },
  {
    icon: Plug,
    title: "MCP integrations",
    description:
      "Connect Model Context Protocol servers to query warehouses, files, APIs, and custom tools during chat.",
  },
  {
    icon: Brain,
    title: "BI-native copilot",
    description:
      "Ask natural-language questions and get analyst-grade answers for KPIs, SQL, forecasting, and executive narratives.",
  },
  {
    icon: LineChart,
    title: "KPI frameworks",
    description:
      "Build revenue, retention, and funnel dashboards with clear definitions and actionable insights.",
  },
  {
    icon: BarChart3,
    title: "Tool-augmented analysis",
    description:
      "When MCP tools are connected, the model can run live queries and ground answers in your actual data.",
  },
  {
    icon: Shield,
    title: "Open source MIT",
    description:
      "Self-host, fork, and extend freely. API keys are encrypted at rest and never shared across users.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
            Features
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Open BI chat, your keys, your data
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Buselligence is an open-source business intelligence chatbot built
            for freedom of AI usage. Connect any supported provider and extend
            capabilities with MCP.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-brand-500/30 hover:bg-white/[0.05]"
            >
              <div className="mb-4 inline-flex rounded-xl bg-brand-500/15 p-3 text-brand-300">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
