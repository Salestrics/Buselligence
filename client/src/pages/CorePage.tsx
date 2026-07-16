import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Bot,
  CheckCircle2,
  Cpu,
  GitBranch,
  Loader2,
  Play,
  Shield,
  Sparkles,
  Store,
  TestTube,
  Users,
  Zap,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import {
  coreApi,
  type AgentTeam,
  type ManagedProject,
  type ModeConfig,
  type NLOSResult,
  type SecurityScan,
  type TestResult,
} from "../lib/core-api";
import { studioApi } from "../lib/studio-api";
import { cn } from "../lib/utils";

type Tab = "brain" | "projects" | "teams" | "nlos" | "lifecycle" | "marketplace" | "modes";

export function CorePage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>("brain");
  const [loading, setLoading] = useState(true);
  const [studioProjectId, setStudioProjectId] = useState<string | null>(null);

  const [runtime, setRuntime] = useState<unknown>(null);
  const [projects, setProjects] = useState<ManagedProject[]>([]);
  const [teams, setTeams] = useState<AgentTeam[]>([]);
  const [modes, setModes] = useState<ModeConfig[]>([]);
  const [nlosResult, setNlosResult] = useState<NLOSResult | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [securityScan, setSecurityScan] = useState<SecurityScan | null>(null);

  const [projectPrompt, setProjectPrompt] = useState("Build a SaaS CRM for small businesses");
  const [nlosCommand, setNlosCommand] = useState(
    "Optimize the checkout flow and deploy the improvement"
  );
  const [codeQuestion, setCodeQuestion] = useState("Why is authentication structured this way?");
  const [codeAnswer, setCodeAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in");
  }, [isPending, session, navigate]);

  useEffect(() => {
    if (!session?.user) return;
    Promise.all([
      coreApi.getRuntime(),
      coreApi.listManagedProjects(),
      coreApi.listTeams(),
      coreApi.getModes(),
      studioApi.listProjects(),
    ])
      .then(([rt, p, t, m, sp]) => {
        setRuntime(rt.runtime);
        setProjects(p);
        setTeams(t);
        setModes(m);
        if (sp.length > 0) setStudioProjectId(sp[0]!.id);
      })
      .finally(() => setLoading(false));
  }, [session?.user]);

  async function createProject(e: FormEvent) {
    e.preventDefault();
    const p = await coreApi.createManagedProject(projectPrompt);
    setProjects([p, ...projects]);
  }

  async function runNLOS(e: FormEvent) {
    e.preventDefault();
    const r = await coreApi.runNLOS(nlosCommand);
    setNlosResult(r);
  }

  const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
    { id: "brain", label: "AI Brain", icon: Brain },
    { id: "projects", label: "Project Manager", icon: Cpu },
    { id: "teams", label: "Agent Teams", icon: Users },
    { id: "nlos", label: "NL OS", icon: Sparkles },
    { id: "lifecycle", label: "Lifecycle", icon: GitBranch },
    { id: "marketplace", label: "Marketplace 2.0", icon: Store },
    { id: "modes", label: "Modes", icon: Zap },
  ];

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-200">
      <Navbar />

      <div className="border-b border-white/5 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-brand-300">
              Buselligence Core
            </p>
            <h1 className="text-xl font-semibold text-white">AI Operating Layer</h1>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition",
                  tab === t.id ? "bg-brand-500/20 text-brand-200" : "text-slate-400 hover:text-white"
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "brain" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/8 p-6">
              <h2 className="font-semibold text-white">AI Runtime Engines</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["Context Engine", "Memory Engine", "Reasoning Engine", "Planning Engine", "Execution Engine"].map(
                  (engine) => (
                    <div key={engine} className="rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-3 text-sm">
                      <Bot className="mb-1 h-4 w-4 text-brand-400" />
                      {engine}
                    </div>
                  )
                )}
              </div>
              {runtime !== null && (
                <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-slate-400">
                  {JSON.stringify(runtime, null, 2)}
                </pre>
              )}
            </div>

            {studioProjectId && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/8 p-6">
                  <h2 className="font-semibold text-white">Codebase Understanding</h2>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const r = await coreApi.explainCodebase(studioProjectId, codeQuestion);
                      setCodeAnswer(r.answer);
                    }}
                    className="mt-3 space-y-2"
                  >
                    <input
                      value={codeQuestion}
                      onChange={(e) => setCodeQuestion(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    />
                    <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">
                      Ask codebase
                    </button>
                  </form>
                  {codeAnswer && <p className="mt-3 text-sm text-slate-300">{codeAnswer}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={async () => setTestResult(await coreApi.runTests(studioProjectId))}
                    className="rounded-xl border border-white/8 p-4 text-left hover:border-emerald-500/30"
                  >
                    <TestTube className="h-5 w-5 text-emerald-400" />
                    <p className="mt-2 font-medium">Testing Engineer</p>
                    {testResult && (
                      <p className="mt-1 text-xs text-emerald-400">
                        ✓ {testResult.passed_count}/{testResult.total} passed · {testResult.created} created
                      </p>
                    )}
                  </button>
                  <button
                    onClick={async () => setSecurityScan(await coreApi.runSecurity(studioProjectId))}
                    className="rounded-xl border border-white/8 p-4 text-left hover:border-amber-500/30"
                  >
                    <Shield className="h-5 w-5 text-amber-400" />
                    <p className="mt-2 font-medium">Security Engineer</p>
                    {securityScan && (
                      <p className="mt-1 text-xs text-amber-400">
                        Critical: {securityScan.critical} · Warnings: {securityScan.warnings}
                      </p>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "projects" && (
          <div>
            <form onSubmit={createProject} className="mb-6 flex gap-2">
              <input
                value={projectPrompt}
                onChange={(e) => setProjectPrompt(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm"
                placeholder="Build this product..."
              />
              <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">
                Plan & Create
              </button>
            </form>

            <div className="space-y-4">
              {projects.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/8 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-500">{p.status} · {p.progress}%</p>
                    </div>
                    <button
                      onClick={() => coreApi.executeProject(p.id)}
                      className="flex items-center gap-1 rounded-lg bg-brand-500/20 px-3 py-1 text-xs text-brand-200"
                    >
                      <Play className="h-3 w-3" /> Execute
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {p.sprints.map((s) => (
                      <div key={s.number} className="rounded-lg bg-white/[0.03] p-3">
                        <p className="text-sm font-medium text-brand-300">Sprint {s.number}: {s.name}</p>
                        <ul className="mt-2 space-y-1">
                          {s.tasks.map((t) => (
                            <li key={t} className="flex items-center gap-1 text-xs text-slate-400">
                              <CheckCircle2 className="h-3 w-3 text-slate-600" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "teams" && (
          <div className="space-y-6">
            {teams.map((team) => (
              <div key={team.id} className="rounded-2xl border border-white/8 p-6">
                <h3 className="font-semibold text-white">{team.name}</h3>
                <p className="text-sm text-slate-400">{team.description}</p>
                <div className="mt-4 flex flex-col items-center">
                  <div className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-200">
                    {team.lead.title}
                  </div>
                  <div className="my-2 h-6 w-px bg-white/10" />
                  <div className="flex flex-wrap justify-center gap-2">
                    {team.members.map((m) => (
                      <div key={m.role} className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
                        {m.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "nlos" && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-white">Natural Language Operating System</h2>
            <p className="mt-2 text-sm text-slate-400">
              Say what you want. Buselligence finds code, creates a plan, executes, tests, and deploys.
            </p>
            <form onSubmit={runNLOS} className="mt-4 space-y-3">
              <textarea
                value={nlosCommand}
                onChange={(e) => setNlosCommand(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
              />
              <button type="submit" className="rounded-lg bg-brand-500 px-6 py-2 text-sm text-white">
                Execute
              </button>
            </form>
            {nlosResult && (
              <div className="mt-6 rounded-2xl border border-white/8 p-6">
                <p className="text-sm text-brand-300">Status: {nlosResult.status}</p>
                <ol className="mt-3 space-y-1 text-sm text-slate-400">
                  {nlosResult.plan.map((step, i) => (
                    <li key={i}>{i + 1}. {step}</li>
                  ))}
                </ol>
                {nlosResult.results.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm text-emerald-400">
                    {nlosResult.results.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "lifecycle" && (
          <div className="rounded-2xl border border-white/8 p-6">
            <h2 className="font-semibold text-white">AI Software Lifecycle</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Idea", "Planning", "Architecture", "Development", "Testing", "Security", "Deploy", "Monitor", "Optimize"].map(
                (stage, i) => (
                  <div key={stage} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-xs",
                        i <= 4 ? "bg-brand-500/20 text-brand-200" : "bg-white/5 text-slate-500"
                      )}
                    >
                      {stage}
                    </div>
                    {i < 8 && <span className="text-slate-600">→</span>}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {tab === "marketplace" && (
          <MarketplaceTab />
        )}

        {tab === "modes" && (
          <div className="grid gap-4 md:grid-cols-3">
            {modes.map((m) => (
              <div key={m.mode} className="rounded-2xl border border-white/8 p-6">
                <h3 className="font-semibold text-white">{m.label}</h3>
                <p className="mt-2 text-sm text-slate-400">{m.description}</p>
                <ul className="mt-4 space-y-1">
                  {m.examples.map((ex) => (
                    <li key={ex} className="text-xs text-slate-500">"{ex}"</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function MarketplaceTab() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof coreApi.getMarketplace>> | null>(null);

  useEffect(() => {
    coreApi.getMarketplace().then(setItems);
  }, []);

  if (!items) return <Loader2 className="h-6 w-6 animate-spin text-brand-400" />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {items.categories.map((c) => (
          <span key={c} className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-slate-400">
            {c}
          </span>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.items.map((item) => (
          <div key={item.id} className="rounded-xl border border-white/8 p-4">
            <p className="text-xs capitalize text-brand-400">{item.category}</p>
            <p className="font-medium text-white">{item.name}</p>
            <p className="mt-1 text-sm text-slate-400">{item.description}</p>
            <p className="mt-2 text-xs text-slate-500">{item.installs} installs</p>
          </div>
        ))}
      </div>
    </div>
  );
}
