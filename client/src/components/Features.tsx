import { BarChart3, Brain, Database, LineChart, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "GPT-5.4-mini powered",
    description:
      "Ask natural-language questions and get analyst-grade answers grounded in business intelligence best practices.",
  },
  {
    icon: Database,
    title: "SQL & data modeling",
    description:
      "Generate queries, explain schemas, and design metrics that leadership teams actually trust.",
  },
  {
    icon: LineChart,
    title: "KPI frameworks",
    description:
      "Build revenue, retention, and funnel dashboards with clear definitions and actionable insights.",
  },
  {
    icon: BarChart3,
    title: "Executive-ready output",
    description:
      "Turn raw analysis into crisp narratives your C-suite can act on in the next meeting.",
  },
  {
    icon: Shield,
    title: "Enterprise access control",
    description:
      "Accounts are provisioned after invoice verification — no self-serve sign-up, no shadow IT.",
  },
  {
    icon: Zap,
    title: "50k free tokens",
    description:
      "Try Buselligence instantly without an account. Sign in to save conversations and keep going.",
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
            Business intelligence, conversational
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Buselligence combines the fluency of ChatGPT with the rigor of a
            seasoned analytics team — purpose-built for operators, founders, and
            data leaders.
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
