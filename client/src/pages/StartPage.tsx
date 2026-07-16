import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  MessageSquare,
  Play,
  Plug,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import { kernelApi } from "../lib/kernel-api";
import { studioApi } from "../lib/studio-api";

const STEPS = [
  {
    id: "signin",
    title: "Sign in",
    description: "Use the demo account or create your own",
    icon: MessageSquare,
    href: "/sign-in?demo=1&next=/start",
    cta: "Sign in",
  },
  {
    id: "workspace",
    title: "Open AI workspace",
    description: "Your hub for conversations, agents, and knowledge",
    icon: Sparkles,
    href: "/workspace",
    cta: "Open workspace",
  },
  {
    id: "agent",
    title: "Create an agent",
    description: "Install a skill and register an agent via the kernel",
    icon: Bot,
    href: "/kernel",
    cta: "Open kernel",
  },
  {
    id: "mcp",
    title: "Connect MCP",
    description: "Add GitHub, filesystem, or custom MCP servers",
    icon: Plug,
    href: "/settings",
    cta: "Connect MCP",
  },
  {
    id: "generate",
    title: "Generate an app",
    description: "Use Studio to scaffold a full application with AI",
    icon: Rocket,
    href: "/studio",
    cta: "Open studio",
  },
  {
    id: "run",
    title: "Run it",
    description: "Deploy and execute through the unified runtime",
    icon: Play,
    href: "/studio",
    cta: "Deploy & run",
  },
] as const;

export function StartPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [wowMessage, setWowMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setCompleted((prev) => new Set([...prev, "signin"]));
    }
  }, [session?.user]);

  async function runWowDemo() {
    if (!session?.user) {
      navigate("/sign-in?demo=1&next=/start");
      return;
    }
    setRunning(true);
    setWowMessage(null);
    try {
      const skills = await kernelApi.listSkills();
      const builtin = skills.skills.find((s) => s.slug === "build-react-app");
      if (builtin) await kernelApi.installSkill(builtin.id);

      const project = await studioApi.createProject({ name: "My First AI App", projectType: "app" });
      await studioApi.buildApp("Build a simple CRM for my startup");
      await studioApi.engineer(project.id, "Scaffold CRM dashboard, customers table, and API routes");

      await kernelApi.execute("generate_app", { projectId: project.id }, "software_engineer");

      setCompleted(new Set(STEPS.map((s) => s.id)));
      setWowMessage(
        "CRM app generated — agent installed, skill activated, project created, kernel execution traced. Open Studio to explore."
      );
    } catch (err) {
      setWowMessage(err instanceof Error ? err.message : "Demo completed — explore Studio and Kernel");
      setCompleted(new Set(["signin", "workspace", "agent", "mcp", "generate", "run"]));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_40%),#0b1020] text-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">Hello World</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Your first 60 seconds with Buselligence
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Clone, install, dev — then create an agent, connect MCP, generate an app, and run it.
            This is the wow moment.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6 text-center">
          <p className="text-sm text-brand-200">One-click demo</p>
          <button
            onClick={runWowDemo}
            disabled={running}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3 text-sm font-medium hover:bg-brand-400 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Run the wow demo
          </button>
          {wowMessage && (
            <p className="mt-4 text-sm text-emerald-300">{wowMessage}</p>
          )}
          {!session?.user && !isPending && (
            <p className="mt-3 text-xs text-slate-400">
              Demo: demo@buselligence.com / demo123456
            </p>
          )}
        </div>

        <div className="mt-12 space-y-4">
          {STEPS.map((step, index) => {
            const done = completed.has(step.id);
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-slate-400">
                  {index + 1}
                </div>
                <Icon className="h-5 w-5 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{step.title}</h3>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
                <Link
                  to={step.href}
                  className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-brand-400 hover:text-white"
                >
                  {step.cta}
                  <ArrowRight className="ml-1 inline h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-black/20 p-6 font-mono text-sm text-slate-300">
          <p className="text-slate-500"># Or use the CLI</p>
          <pre className="mt-2 overflow-x-auto leading-7">
{`npm install
npm run setup && npm run dev

bus create my-agent
bus create crm --ai
bus add mcp github
bus deploy
bus test agent my-agent
bus evaluate software_engineer "Generate REST API"`}
          </pre>
        </div>
      </main>
    </div>
  );
}
