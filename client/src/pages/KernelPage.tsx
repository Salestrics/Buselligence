import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  Box,
  Cpu,
  DollarSign,
  FileCode2,
  Layers,
  Loader2,
  Lock,
  Play,
  Puzzle,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import {
  kernelApi,
  type BuselligenceLock,
  type Evaluation,
  type PromptWorkspace,
  type RegisteredAgent,
  type Skill,
  type TraceDetail,
  type TraceSummary,
} from "../lib/kernel-api";
import { cn } from "../lib/utils";

type Tab =
  | "overview"
  | "skills"
  | "registry"
  | "traces"
  | "costs"
  | "prompts"
  | "lockfile"
  | "sdk"
  | "templates"
  | "local";

const SUBSYSTEMS = [
  "Identity",
  "Context",
  "Permissions",
  "Memory",
  "Tools",
  "Agents",
  "Models",
  "Events",
  "Execution",
];

export function KernelPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  const [info, setInfo] = useState<{ primitive: string; goal: string } | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [installed, setInstalled] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetail | null>(null);
  const [prompts, setPrompts] = useState<PromptWorkspace[]>([]);
  const [lockfile, setLockfile] = useState<BuselligenceLock | null>(null);
  const [sdkExample, setSdkExample] = useState("");
  const [templates, setTemplates] = useState<Array<{ slug: string; name: string; description: string }>>([]);
  const [localMessage, setLocalMessage] = useState("");
  const [costs, setCosts] = useState<{ totalCostUsd: number; totalTokens: number } | null>(null);

  const [evalTask, setEvalTask] = useState("Generate REST API");
  const [evalAgent, setEvalAgent] = useState("software_engineer");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in");
  }, [isPending, session, navigate]);

  useEffect(() => {
    if (!session?.user) return;
    Promise.all([
      kernelApi.getInfo(),
      kernelApi.listSkills(),
      kernelApi.listAgents(),
      kernelApi.listEvaluations(),
      kernelApi.listTraces(),
      kernelApi.listPrompts(),
      kernelApi.getLockfile(),
      kernelApi.getSdk(),
      kernelApi.listTemplates(),
      kernelApi.getLocalConfig(),
      kernelApi.getCosts(),
    ])
      .then(([i, sk, ag, ev, tr, pr, lf, sdk, tpl, loc, co]) => {
        setInfo(i);
        setSkills(sk.skills);
        setInstalled(sk.installed);
        setAgents(ag);
        setEvaluations(ev.evaluations);
        setTraces(tr);
        setPrompts(pr.prompts);
        setLockfile(lf.lock);
        setSdkExample(sdk.sdk.example);
        setTemplates(tpl);
        setLocalMessage(loc.message);
        setCosts({ totalCostUsd: co.costs.totalCostUsd, totalTokens: co.costs.totalTokens });
      })
      .finally(() => setLoading(false));
  }, [session?.user]);

  async function installSkill(id: string) {
    const result = await kernelApi.installSkill(id);
    setInstalled(result.skills);
  }

  async function runEvaluation(e: FormEvent) {
    e.preventDefault();
    setRunning(true);
    try {
      const { evaluation } = await kernelApi.runEvaluation(evalAgent, evalTask);
      setEvaluations((prev) => [evaluation, ...prev]);
    } finally {
      setRunning(false);
    }
  }

  async function runKernelDemo() {
    setRunning(true);
    try {
      await kernelApi.execute("demo_task", { message: "Kernel execution demo" }, evalAgent);
      const [tr, co] = await Promise.all([kernelApi.listTraces(), kernelApi.getCosts()]);
      setTraces(tr);
      setCosts({ totalCostUsd: co.costs.totalCostUsd, totalTokens: co.costs.totalTokens });
    } finally {
      setRunning(false);
    }
  }

  async function viewTrace(id: string) {
    const trace = await kernelApi.getTrace(id);
    setSelectedTrace(trace);
    setTab("traces");
  }

  async function regenerateLockfile() {
    const { lock } = await kernelApi.generateLockfile();
    setLockfile(lock);
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof Cpu }> = [
    { id: "overview", label: "Kernel", icon: Cpu },
    { id: "skills", label: "Skills", icon: Wrench },
    { id: "registry", label: "Agents", icon: Bot },
    { id: "traces", label: "Traces", icon: Activity },
    { id: "costs", label: "Costs", icon: DollarSign },
    { id: "prompts", label: "Prompts", icon: FileCode2 },
    { id: "lockfile", label: "Lockfile", icon: Lock },
    { id: "sdk", label: "SDK", icon: Puzzle },
    { id: "templates", label: "Templates", icon: Box },
    { id: "local", label: "Local", icon: Layers },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1020] text-white">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-brand-400">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Buselligence Kernel v1.0</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Unified AI Runtime</h1>
          <p className="mt-2 max-w-3xl text-slate-400">{info?.primitive}</p>
          <p className="mt-1 text-sm text-slate-500">{info?.goal}</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                tab === t.id
                  ? "bg-brand-500 text-white"
                  : "border border-white/10 text-slate-300 hover:border-white/20"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {SUBSYSTEMS.map((s) => (
                <div key={s} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-medium text-brand-300">{s}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {s === "Execution" ? "Unified layer — all features run through the kernel" : `Kernel ${s.toLowerCase()} subsystem`}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Execute through the kernel</h2>
              <p className="mt-1 text-sm text-slate-400">
                Any feature can become AI-capable automatically. Run a demo execution to generate a trace and cost record.
              </p>
              <button
                onClick={runKernelDemo}
                disabled={running}
                className="mt-4 flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-medium hover:bg-brand-400 disabled:opacity-50"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run kernel execution
              </button>
            </div>
          </div>
        )}

        {tab === "skills" && (
          <div className="grid gap-4 md:grid-cols-2">
            {skills.map((skill) => {
              const isInstalled = installed.some((s) => s.id === skill.id);
              return (
                <div key={skill.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{skill.name}</h3>
                      <p className="text-xs text-slate-500">{skill.slug} · v{skill.version}</p>
                    </div>
                    {skill.builtin && (
                      <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-300">builtin</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{skill.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{skill.installs} installs · {skill.category}</span>
                    {!isInstalled && (
                      <button
                        onClick={() => installSkill(skill.id)}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs hover:border-brand-400"
                      >
                        Install
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "registry" && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <p className="text-xs text-slate-500">v{agent.version} · {agent.slug}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      {agent.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Capabilities</p>
                      <ul className="mt-1 text-sm text-slate-300">
                        {agent.capabilities.map((c) => (
                          <li key={c}>· {c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">Permissions</p>
                      <ul className="mt-1 text-sm text-slate-300">
                        {agent.permissions.map((p) => (
                          <li key={p}>· {p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={runEvaluation} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-semibold">Agent Evaluation</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={evalAgent}
                  onChange={(e) => setEvalAgent(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  placeholder="Agent slug"
                />
                <input
                  value={evalTask}
                  onChange={(e) => setEvalTask(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
                  placeholder="Task"
                />
              </div>
              <button
                type="submit"
                disabled={running}
                className="mt-4 rounded-full bg-brand-500 px-5 py-2 text-sm font-medium hover:bg-brand-400 disabled:opacity-50"
              >
                Run benchmark
              </button>
              {evaluations.length > 0 && (
                <div className="mt-4 space-y-2">
                  {evaluations.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-white/5 bg-black/20 p-3 text-sm">
                      <p>
                        <span className="text-brand-300">{ev.task}</span> — Score: {ev.score}%
                      </p>
                      {ev.issues.map((issue) => (
                        <p key={issue} className="text-xs text-amber-300">· {issue}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}

        {tab === "traces" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              AI Trace: User Request → Agent Planner → Tool Calls → Model Responses → Final Output
            </p>
            {selectedTrace && (
              <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5">
                <h3 className="font-medium">{selectedTrace.request}</h3>
                <div className="mt-3 space-y-2">
                  {selectedTrace.spans.map((span, i) => (
                    <div key={span.id} className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">{i + 1}.</span>
                      <span className="text-brand-300">{span.name}</span>
                      <span className="text-xs text-slate-500">({span.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {traces.map((trace) => (
              <button
                key={trace.id}
                onClick={() => viewTrace(trace.id)}
                className="block w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{trace.request}</span>
                  <span className="text-xs text-slate-500">{trace.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {trace.durationMs ?? "—"}ms · {trace.createdAt}
                </p>
              </button>
            ))}
            {traces.length === 0 && (
              <p className="text-sm text-slate-500">No traces yet. Run a kernel execution from the overview tab.</p>
            )}
          </div>
        )}

        {tab === "costs" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Total cost</p>
                <p className="text-2xl font-bold">${costs?.totalCostUsd.toFixed(2) ?? "0.00"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Total tokens</p>
                <p className="text-2xl font-bold">{costs?.totalTokens ?? 0}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-medium">Cost optimization</h3>
              <p className="mt-2 text-sm text-slate-400">
                Could reduce ~42% using gpt-4o-mini for non-reasoning steps. Relevant for BYOK users tracking spend per task.
              </p>
            </div>
          </div>
        )}

        {tab === "prompts" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">IDE for AI behavior — system prompts, agent instructions, tool definitions, memory rules, model settings.</p>
            {prompts.map((prompt) => (
              <div key={prompt.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{prompt.name}</h3>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{prompt.promptType}</span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-slate-300">
                  {prompt.content}
                </pre>
              </div>
            ))}
          </div>
        )}

        {tab === "lockfile" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                <code className="text-brand-300">buselligence.lock</code> — reproducible AI environments
              </p>
              <button
                onClick={regenerateLockfile}
                className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-brand-400"
              >
                Regenerate
              </button>
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-5 text-xs text-slate-300">
              {lockfile ? JSON.stringify(lockfile, null, 2) : "No lockfile yet. Click Regenerate."}
            </pre>
          </div>
        )}

        {tab === "sdk" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Extension SDK — build plugins that extend the kernel with custom tools and agents.
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-5 text-xs text-slate-300">
              {sdkExample}
            </pre>
          </div>
        )}

        {tab === "templates" && (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((tpl) => (
              <div key={tpl.slug} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-medium">{tpl.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{tpl.description}</p>
                <p className="mt-2 text-xs text-slate-500">examples/{tpl.slug}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "local" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-brand-300">{localMessage}</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>· Local models via Ollama, llama.cpp, vLLM</li>
              <li>· Local embeddings (nomic-embed-text)</li>
              <li>· Local vector DB (SQLite-backed)</li>
              <li>· Offline development with KERNEL_OFFLINE=true</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
