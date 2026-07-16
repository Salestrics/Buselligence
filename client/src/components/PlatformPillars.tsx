import {
  Bot,
  Brain,
  Code2,
  Database,
  GraduationCap,
  Hammer,
  Lightbulb,
  Palette,
  Workflow,
  Zap,
} from "lucide-react";

const primaryPillars = [
  { icon: GraduationCap, name: "Learn", description: "AI that teaches, adapts, and grows with you" },
  { icon: Palette, name: "Create", description: "Documents, designs, presentations, and media" },
  { icon: Brain, name: "Analyze", description: "Data intelligence across any source" },
  { icon: Hammer, name: "Build", description: "Apps, automations, and software without barriers" },
];

const capabilityPillars = [
  { icon: Code2, name: "Code", description: "AI-native developer studio" },
  { icon: Database, name: "Data", description: "Connect and understand any data" },
  { icon: Workflow, name: "Automate", description: "Workflows, triggers, and agents" },
  { icon: Bot, name: "Agents", description: "Specialized AI workers for every task" },
];

export function PlatformPillars() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
            The Open Source AI Operating System
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Buselligence AI Platform
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Not a chatbot. An AI operating system — learn, create, analyze, build, code, automate, and deploy agents.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryPillars.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-center transition hover:border-brand-500/30"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15">
                <pillar.icon className="h-6 w-6 text-brand-300" />
              </div>
              <h3 className="text-lg font-semibold text-white">{pillar.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{pillar.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilityPillars.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center transition hover:border-brand-500/20"
            >
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                <pillar.icon className="h-5 w-5 text-slate-300" />
              </div>
              <h3 className="font-semibold text-white">{pillar.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Philosophy() {
  const problems = [
    "Enterprise companies have AI teams",
    "Developers have AI coding tools",
    "Data scientists have analytics platforms",
    "Executives have intelligence systems",
    "Everyone else gets a chatbot",
  ];

  const principles = [
    "Open models",
    "Open protocols",
    "Open source",
    "User-owned data",
    "User-controlled AI",
  ];

  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
              Core Philosophy
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              AI should not belong only to large companies
            </h2>
            <ul className="mt-6 space-y-3">
              {problems.map((item, i) => (
                <li
                  key={item}
                  className={`flex items-start gap-3 text-sm ${
                    i === problems.length - 1 ? "text-brand-300 font-medium" : "text-slate-400"
                  }`}
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-lg text-white">
              Buselligence changes that. Every person gets an AI teammate.
            </p>
          </div>

          <div className="rounded-3xl border border-brand-500/20 bg-gradient-to-b from-brand-500/10 to-transparent p-8">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-6 w-6 text-brand-300" />
              <h3 className="text-xl font-semibold text-white">Built around</h3>
            </div>
            <ul className="mt-6 space-y-4">
              {principles.map((p) => (
                <li key={p} className="flex items-center gap-3 text-slate-300">
                  <Zap className="h-4 w-4 text-brand-400" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm leading-6 text-slate-400">
              AI capability should be a <span className="text-white">public utility</span>, not a luxury product.
              Buselligence is the open-source counterpart to closed AI ecosystems.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NotThisCategory() {
  const notList = [
    "Business intelligence chatbot",
    "AI assistant",
    "AI coding tool",
    "No-code builder",
  ];

  return (
    <section className="border-t border-white/5 py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-sm text-slate-500">Not another</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {notList.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-slate-500 line-through decoration-rose-500/50"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="mt-8 text-2xl font-semibold text-white">
          Open AI Empowerment Platform
        </p>
        <p className="mt-2 text-brand-300">The Open Source AI Operating System</p>
      </div>
    </section>
  );
}
