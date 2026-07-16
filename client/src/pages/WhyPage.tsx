import { Link } from "react-router-dom";
import { ArrowRight, Code2, GitBranch, Layers, Shield, Users, Zap } from "lucide-react";
import { BrandFooter } from "../components/BrandFooter";
import { Navbar } from "../components/Navbar";

const principles = [
  {
    icon: Code2,
    title: "Programmable",
    body: "AI should be code — agents, skills, prompts, and tools you version, test, and deploy like software.",
  },
  {
    icon: Layers,
    title: "Extensible",
    body: "MCP servers, plugins, and the Extension SDK let anyone add capabilities without forking the platform.",
  },
  {
    icon: Shield,
    title: "Owned by everyone",
    body: "Open source, BYOK, local-first. Your data, your models, your infrastructure — not a vendor lock-in.",
  },
];

const comparisons = [
  { them: "200 features in a landing page", us: "One primitive: the AI runtime" },
  { them: "Black-box chatbot", us: "Traced, evaluated, reproducible execution" },
  { them: "Corporate AI teams only", us: "Every developer gets the full stack" },
  { them: "Cloud-only, proprietary", us: "Runs anywhere — local models, offline dev" },
];

export function WhyPage() {
  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-200">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-300">Why Buselligence?</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl leading-tight">
          AI should be programmable, extensible, and owned by everyone
        </h1>

        <p className="mt-8 text-xl leading-8 text-slate-400">
          Not another chatbot. Not a feature checklist. Buselligence is the open-source runtime
          for building, running, and extending AI-powered applications — the way Linux is the
          kernel for operating systems, or Kubernetes is for orchestration.
        </p>

        <blockquote className="mt-10 border-l-4 border-brand-500 pl-6 text-lg italic text-slate-300">
          Give every person the power of AI — without giving up ownership.
        </blockquote>

        <section className="mt-16 space-y-8">
          {principles.map((p) => (
            <div key={p.title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                <p.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{p.title}</h2>
                <p className="mt-2 text-slate-400 leading-7">{p.body}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold text-white">Not this. That.</h2>
          <div className="mt-6 space-y-3">
            {comparisons.map((c) => (
              <div key={c.them} className="grid gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-4 md:grid-cols-2">
                <p className="text-sm text-slate-500 line-through">{c.them}</p>
                <p className="text-sm text-brand-200">{c.us}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex items-center gap-3 text-brand-300">
            <Zap className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-white">The primitive</h2>
          </div>
          <p className="mt-4 text-lg text-slate-300">
            <strong className="text-white">Buselligence Kernel</strong> — Identity, Context, Permissions,
            Memory, Tools, Agents, Models, Events, Execution. Everything flows through one layer.
            Any feature becomes AI-capable automatically.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/start"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-400"
            >
              60-second start
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/kernel"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-300 hover:border-white/20"
            >
              Explore kernel
            </Link>
            <a
              href="https://github.com/Salestrics/Buselligence/blob/main/docs/README.md"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-300 hover:border-white/20"
            >
              <GitBranch className="h-4 w-4" />
              Documentation
            </a>
          </div>
        </section>

        <section className="mt-16 text-center">
          <Users className="mx-auto h-8 w-8 text-brand-400" />
          <p className="mt-4 text-slate-400">
            Built for Cursor users, open-source developers, and anyone who believes
            AI infrastructure should belong to the community.
          </p>
          <Link to="/manifesto" className="mt-4 inline-block text-brand-300 hover:text-white">
            Read the full manifesto →
          </Link>
        </section>
      </main>
      <BrandFooter />
    </div>
  );
}
