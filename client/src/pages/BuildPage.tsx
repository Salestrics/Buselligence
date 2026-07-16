import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bot,
  CheckCircle2,
  FileCode2,
  Loader2,
  Rocket,
  Terminal,
  Zap,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import { genesisApi, type BuildEvent, type GenesisBuild } from "../lib/genesis-api";
import { cn } from "../lib/utils";

const EXAMPLE_PROMPT =
  "I want to build a platform that helps local restaurants manage inventory, suppliers, employees, and customer loyalty.";

export function BuildPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [build, setBuild] = useState<GenesisBuild | null>(null);
  const [events, setEvents] = useState<BuildEvent[]>([]);
  const [building, setBuilding] = useState(false);
  const [complete, setComplete] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in?demo=1&next=/build");
  }, [isPending, session, navigate]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [events]);

  useEffect(() => () => cleanupRef.current?.(), []);

  async function handleBuild(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || building) return;

    setBuilding(true);
    setComplete(false);
    setEvents([]);
    setBuild(null);

    try {
      const newBuild = await genesisApi.startBuild(prompt.trim());
      setBuild(newBuild);

      cleanupRef.current = genesisApi.streamBuild(
        newBuild.id,
        (event) => {
          if (event.type !== "build") {
            setEvents((prev) => [...prev, event]);
          }
          if (event.progress !== undefined && build) {
            setBuild((b) => (b ? { ...b, progress: event.progress! } : b));
          }
          if (event.build) {
            setBuild(event.build);
          }
          if (event.type === "file" && event.file) {
            setBuild((b) =>
              b
                ? {
                    ...b,
                    currentFile: event.file,
                    currentAgent: event.agent,
                    progress: event.progress ?? b.progress,
                    stats: {
                      ...b.stats,
                      filesCreated: b.stats.filesCreated + 1,
                    },
                  }
                : b
            );
          }
          if (event.type === "test") {
            setBuild((b) =>
              b
                ? {
                    ...b,
                    stats: {
                      ...b.stats,
                      testsPassing: parseInt(event.message.match(/\d+/)?.[0] ?? "0", 10),
                    },
                  }
                : b
            );
          }
          if (event.type === "decision") {
            setBuild((b) =>
              b ? { ...b, stats: { ...b.stats, aiDecisions: b.stats.aiDecisions + 1 } } : b
            );
          }
          if (event.type === "agent" || event.type === "phase") {
            setBuild((b) =>
              b
                ? {
                    ...b,
                    currentAgent: event.agent,
                    progress: event.progress ?? b.progress,
                  }
                : b
            );
          }
          if (event.type === "complete") {
            setComplete(true);
            setBuilding(false);
            genesisApi.getBuild(newBuild.id).then(setBuild);
          }
        },
        async () => {
          setBuilding(false);
          setComplete(true);
          const final = await genesisApi.getBuild(newBuild.id);
          setBuild(final);
        },
        () => {
          setBuilding(false);
          genesisApi.getBuild(newBuild.id).then(setBuild);
        }
      );
    } catch {
      setBuilding(false);
    }
  }

  const progress = build?.progress ?? 0;
  const stats = build?.stats ?? { filesCreated: 0, testsPassing: 0, aiDecisions: 0 };

  return (
    <div className="min-h-screen bg-[#060a14] text-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {!build && !building && (
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300">
              <Zap className="h-4 w-4" />
              Build Anything Mode
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
              Describe it. Watch it come alive.
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              From idea to application in minutes. AI architects, plans, engineers, and ships — live.
            </p>

            <form onSubmit={handleBuild} className="mt-10 text-left">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-200 outline-none focus:border-brand-500"
                placeholder="Describe what you want to build..."
              />
              <button
                type="submit"
                disabled={building}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 py-4 text-sm font-semibold hover:bg-brand-400 disabled:opacity-60"
              >
                <Rocket className="h-5 w-5" />
                Build Anything
              </button>
            </form>
          </div>
        )}

        {(build || building) && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-400">
                  Buselligence Build Room
                </p>
                <h1 className="text-2xl font-bold md:text-3xl">
                  Project: {build?.projectName ?? "..."}
                </h1>
              </div>
              {complete && build?.studioProjectId && (
                <Link
                  to={`/studio`}
                  className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium hover:bg-emerald-400"
                >
                  Open in Studio →
                </Link>
              )}
            </div>

            {/* Progress bar */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Build progress</span>
                <span className="font-mono text-brand-300">{progress}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Current</span>
                  <p className="font-medium text-white">{build?.currentAgent ?? "Initializing..."}</p>
                </div>
                <div>
                  <span className="text-slate-500">Creating</span>
                  <p className="font-mono text-xs text-brand-200">{build?.currentFile ?? "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tests</span>
                  <p className="font-medium text-emerald-400">{stats.testsPassing} passing</p>
                </div>
                <div>
                  <span className="text-slate-500">Files</span>
                  <p className="font-medium">{stats.filesCreated}</p>
                </div>
                <div>
                  <span className="text-slate-500">AI Decisions</span>
                  <p className="font-medium">{stats.aiDecisions}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Live log */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-white/10 bg-black/40">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    <Terminal className="h-4 w-4 text-brand-400" />
                    <span className="text-sm font-medium">Live Build</span>
                    {building && <Loader2 className="ml-auto h-4 w-4 animate-spin text-brand-400" />}
                  </div>
                  <div ref={logRef} className="h-80 overflow-y-auto p-4 font-mono text-xs leading-6">
                    {events.map((ev, i) => (
                      <div
                        key={i}
                        className={cn(
                          "py-0.5",
                          ev.type === "file" && "text-brand-300",
                          ev.type === "test" && "text-emerald-400",
                          ev.type === "complete" && "text-emerald-300 font-bold",
                          ev.type === "decision" && "text-slate-400"
                        )}
                      >
                        {ev.agentEmoji && <span className="mr-1">{ev.agentEmoji}</span>}
                        {ev.message}
                      </div>
                    ))}
                    {events.length === 0 && building && (
                      <span className="text-slate-500">Starting AI engineering team...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Blueprint + Roadmap */}
              <div className="space-y-4">
                {build?.blueprint && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-300">
                      <Bot className="h-4 w-4" />
                      Project Blueprint
                    </div>
                    <p className="mt-2 text-lg font-semibold">{build.blueprint.name}</p>
                    <p className="mt-3 text-xs font-medium uppercase text-slate-500">Architecture</p>
                    <ul className="mt-1 space-y-1 text-sm text-slate-300">
                      {build.blueprint.architecture.map((a) => (
                        <li key={a}>✓ {a}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs font-medium uppercase text-slate-500">Modules</p>
                    <ul className="mt-1 space-y-1 text-sm text-slate-300">
                      {build.blueprint.modules.map((m) => (
                        <li key={m}>✓ {m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {build?.roadmap?.sprints && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-300">
                      <FileCode2 className="h-4 w-4" />
                      Product Roadmap
                    </div>
                    {build.roadmap.sprints.map((sprint) => (
                      <div key={sprint.number} className="mt-3">
                        <p className="text-sm font-medium">{sprint.name}</p>
                        <ul className="mt-1 text-xs text-slate-400">
                          {sprint.tasks.map((t) => (
                            <li key={t}>✓ {t}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {complete && build?.preview && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h2 className="mt-4 text-2xl font-bold">Your application is ready.</h2>
                <p className="mt-2 text-slate-400">{build.projectName} — {stats.filesCreated} files created</p>

                <div className="mx-auto mt-8 max-w-sm rounded-xl border border-white/10 bg-black/30 p-6 text-left">
                  <p className="text-sm font-semibold text-brand-300">{build.preview.title}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {build.preview.navigation.map((nav) => (
                      <li key={nav.label} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                        {nav.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/studio"
                    className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium hover:bg-brand-400"
                  >
                    Open in Studio
                  </Link>
                  <Link
                    to="/kernel"
                    className="rounded-full border border-white/10 px-6 py-2.5 text-sm hover:border-white/20"
                  >
                    View kernel trace
                  </Link>
                  <button
                    onClick={() => {
                      setBuild(null);
                      setEvents([]);
                      setComplete(false);
                    }}
                    className="rounded-full border border-white/10 px-6 py-2.5 text-sm hover:border-white/20"
                  >
                    Build another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
