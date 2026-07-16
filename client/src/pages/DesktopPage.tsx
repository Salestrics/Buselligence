import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Download,
  FolderGit2,
  GitBranch,
  Loader2,
  Monitor,
  Play,
  Shield,
  Square,
  Terminal,
  Zap,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import { desktopApi, type AIPermissions, type DesktopWorkspace, type GitHubRepo } from "../lib/desktop-api";
import { cn } from "../lib/utils";

type WizardStep = "github" | "repo" | "provision" | "done";
type View = "workspaces" | "permissions" | "local";

export function DesktopPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const [info, setInfo] = useState<{ tagline: string; headline: string; download: Record<string, string> } | null>(null);
  const [workspaces, setWorkspaces] = useState<DesktopWorkspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("workspaces");

  const [wizardStep, setWizardStep] = useState<WizardStep>("github");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionSteps, setProvisionSteps] = useState<Array<{ step: string; status: string }>>([]);

  const [permissions, setPermissions] = useState<AIPermissions | null>(null);
  const [command, setCommand] = useState("npm run dev");
  const [terminal, setTerminal] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Array<{ id: string; label: string; filesChanged: number }>>([]);

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
  const showWizard = workspaces.length <= 1 && wizardStep !== "done";

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in?demo=1&next=/desktop");
  }, [isPending, session, navigate]);

  useEffect(() => {
    if (!session?.user) return;
    Promise.all([desktopApi.getInfo(), desktopApi.listWorkspaces(), desktopApi.getPermissions()])
      .then(([i, ws, p]) => {
        setInfo(i);
        setWorkspaces(ws);
        if (ws.length > 0) {
          setActiveId(ws[0]!.id);
          if (ws.length > 1) setWizardStep("done");
        }
        setPermissions(p.permissions);
      })
      .finally(() => setLoading(false));
  }, [session?.user]);

  useEffect(() => {
    if (!active?.id) return;
    desktopApi.listSnapshots(active.id).then(setSnapshots);
  }, [active?.id]);

  async function connectGitHub() {
    const gh = await desktopApi.getGitHub();
    setRepos(gh.repos);
    setWizardStep("repo");
  }

  async function provisionRepo() {
    if (!selectedRepo) return;
    setProvisioning(true);
    setWizardStep("provision");
    try {
      const { workspace, steps } = await desktopApi.provision(selectedRepo);
      setProvisionSteps(steps);
      const ws = await desktopApi.listWorkspaces();
      setWorkspaces(ws);
      setActiveId(workspace.id);
      setWizardStep("done");
    } finally {
      setProvisioning(false);
    }
  }

  async function toggleWorkspace(ws: DesktopWorkspace) {
    const next = ws.status === "running" ? "stopped" : "running";
    const updated = await desktopApi.setStatus(ws.id, next);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  }

  async function runCommand(approved = false) {
    if (!command.trim()) return;
    setRunning(true);
    setPendingApproval(null);
    try {
      const res = await desktopApi.runCommand(command, active?.id, approved);
      if (res.requiresApproval) {
        setPendingApproval(command);
        return;
      }
      if (res.result) {
        setTerminal((t) => [
          ...t,
          `$ ${res.result!.command}`,
          res.result!.output,
          res.result!.previewUrl ? `Preview: ${res.result!.previewUrl}` : "",
        ].filter(Boolean));
      }
    } finally {
      setRunning(false);
    }
  }

  async function savePerms(next: AIPermissions) {
    const saved = await desktopApi.savePermissions(next);
    setPermissions(saved);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />

      <main className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-brand-400">
              <Monitor className="h-5 w-5" />
              <span className="text-sm font-semibold">Desktop Runtime</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{info?.tagline}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-xs font-medium uppercase text-slate-500">My Workspaces</p>
            <ul className="mt-2 space-y-1">
              {workspaces.map((ws) => (
                <li key={ws.id}>
                  <button
                    onClick={() => setActiveId(ws.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm",
                      active?.id === ws.id ? "bg-brand-500/20 text-brand-200" : "hover:bg-white/5"
                    )}
                  >
                    <span>{ws.name}</span>
                    <span className={cn("text-xs", ws.status === "running" ? "text-emerald-400" : "text-slate-500")}>
                      {ws.status === "running" ? "✓ Running" : "○ Stopped"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setWizardStep("github")}
              className="mt-2 w-full rounded-lg border border-dashed border-white/10 py-2 text-xs text-slate-400 hover:border-brand-400"
            >
              + New workspace
            </button>
          </div>

          <nav className="space-y-1 text-sm">
            {(["workspaces", "permissions", "local"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left capitalize",
                  view === v ? "bg-white/10" : "text-slate-400 hover:text-white"
                )}
              >
                {v}
              </button>
            ))}
          </nav>

          <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-3">
            <Download className="h-4 w-4 text-brand-300" />
            <p className="mt-2 text-xs font-medium">Buselligence.exe</p>
            <p className="text-xs text-slate-400">Tauri · Native runtime</p>
            <p className="mt-2 text-xs text-slate-500">{info?.download?.windows}</p>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{info?.headline}</h1>
            <p className="text-slate-400">Cursor + Codespaces + VS Code + AI Agents — open source and extensible.</p>
          </div>

          {showWizard && view === "workspaces" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-semibold">First launch — zero setup</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {[
                  { id: "github", label: "Connect GitHub", icon: GitBranch },
                  { id: "repo", label: "Choose Repository", icon: FolderGit2 },
                  { id: "provision", label: "Provision Workspace", icon: Zap },
                  { id: "done", label: "Start Building", icon: Play },
                ].map((s, i) => {
                  const done =
                    (s.id === "github" && wizardStep !== "github") ||
                    (s.id === "repo" && wizardStep === "provision") ||
                    (s.id === "provision" && provisionSteps.length > 0) ||
                    (s.id === "done" && provisionSteps.length > 0);
                  const current =
                    (s.id === "github" && wizardStep === "github") ||
                    (s.id === "repo" && wizardStep === "repo") ||
                    (s.id === "provision" && wizardStep === "provision");
                  return (
                    <div key={s.id} className={cn("rounded-xl border p-4", current ? "border-brand-500" : "border-white/10")}>
                      <s.icon className="h-5 w-5 text-brand-400" />
                      <p className="mt-2 text-sm font-medium">{i + 1}. {s.label}</p>
                      {done ? <CheckCircle2 className="mt-2 h-4 w-4 text-emerald-400" /> : <Circle className="mt-2 h-4 w-4 text-slate-600" />}
                    </div>
                  );
                })}
              </div>

              {wizardStep === "github" && (
                <button onClick={connectGitHub} className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium hover:bg-brand-400">
                  Connect GitHub
                </button>
              )}

              {wizardStep === "repo" && (
                <div className="mt-6 space-y-2">
                  {repos.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRepo(r.fullName)}
                      className={cn(
                        "block w-full rounded-xl border p-4 text-left",
                        selectedRepo === r.fullName ? "border-brand-500 bg-brand-500/10" : "border-white/10"
                      )}
                    >
                      <p className="font-medium">{r.fullName}</p>
                      <p className="text-sm text-slate-400">{r.description}</p>
                    </button>
                  ))}
                  <button
                    onClick={provisionRepo}
                    disabled={!selectedRepo || provisioning}
                    className="mt-4 rounded-full bg-brand-500 px-6 py-2.5 text-sm disabled:opacity-50"
                  >
                    {provisioning ? "Provisioning..." : "Provision Workspace?"}
                  </button>
                </div>
              )}

              {wizardStep === "provision" && (
                <ul className="mt-6 space-y-2 text-sm">
                  {provisionSteps.map((s) => (
                    <li key={s.step} className="text-emerald-400">✓ {s.step}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {view === "workspaces" && active && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{active.name}</h2>
                  <p className="text-sm text-slate-400">{active.repoName ?? active.name}</p>
                </div>
                <button
                  onClick={() => toggleWorkspace(active)}
                  className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm"
                >
                  {active.status === "running" ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {active.status === "running" ? "Stop" : "Start"}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-medium text-brand-300">Project Intelligence</h3>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Framework", active.intelligence.framework],
                      ["Language", active.intelligence.language],
                      ["Database", active.intelligence.database],
                      ["Architecture", active.intelligence.architecture],
                      ["Entry points", active.intelligence.entryPoints],
                      ["Important files", active.intelligence.importantFiles],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-xs text-slate-500">Stack: {active.stack.map((s) => `✓ ${s}`).join(" · ")}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-medium text-brand-300">Workspace Snapshots</h3>
                  <button
                    onClick={() => active && desktopApi.createSnapshot(active.id).then(() => desktopApi.listSnapshots(active.id).then(setSnapshots))}
                    className="mt-2 text-xs text-brand-400 hover:underline"
                  >
                    + Create checkpoint
                  </button>
                  <ul className="mt-3 space-y-2 text-sm">
                    {snapshots.map((s) => (
                      <li key={s.id} className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                        <span>{s.label}</span>
                        <span className="text-slate-500">{s.filesChanged} files</span>
                      </li>
                    ))}
                    {snapshots.length === 0 && (
                      <li className="text-slate-500">Checkpoint before AI changes — rollback available</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <Terminal className="h-4 w-4 text-brand-400" />
                  <span className="text-sm font-medium">Local Command Bridge</span>
                </div>
                <div className="h-48 overflow-y-auto p-4 font-mono text-xs leading-6 text-slate-300">
                  {terminal.length === 0 && (
                    <p className="text-slate-500">Agent can run: npm, pnpm, yarn, git, docker, python, cargo, go</p>
                  )}
                  {terminal.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-white/10 p-3">
                  <input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="flex-1 rounded-lg bg-white/5 px-3 py-2 font-mono text-sm outline-none"
                    placeholder="npm run dev"
                  />
                  <button
                    onClick={() => runCommand(false)}
                    disabled={running}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm hover:bg-brand-400 disabled:opacity-50"
                  >
                    Run
                  </button>
                </div>
                {pendingApproval && permissions?.askBeforeExecution && (
                  <div className="border-t border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm">AI wants to run: <code>{pendingApproval}</code></p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => runCommand(true)} className="rounded-full bg-brand-500 px-4 py-1.5 text-xs">Approve</button>
                      <button onClick={() => setPendingApproval(null)} className="rounded-full border px-4 py-1.5 text-xs">Deny</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/studio" className="rounded-full bg-brand-500 px-5 py-2 text-sm hover:bg-brand-400">Open Monaco IDE</Link>
                <Link to="/build" className="rounded-full border border-white/10 px-5 py-2 text-sm hover:border-white/20">Build Anything</Link>
              </div>
            </>
          )}

          {view === "permissions" && permissions && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-400" />
                <h2 className="font-semibold">AI Permissions</h2>
              </div>
              <div className="mt-6 space-y-3">
                {(
                  [
                    ["readFiles", "Read files"],
                    ["modifyFiles", "Modify files"],
                    ["runCommands", "Run commands"],
                    ["installPackages", "Install packages"],
                    ["deploy", "Deploy"],
                    ["askBeforeExecution", "Ask before execution"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={permissions[key]}
                      onChange={(e) => savePerms({ ...permissions, [key]: e.target.checked })}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {view === "local" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-semibold">Offline / Local Mode</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>✓ Local models via Ollama</li>
                <li>✓ llama.cpp support</li>
                <li>✓ Local embeddings (nomic-embed-text)</li>
                <li>✓ Local vector database</li>
                <li>✓ Offline coding with DESKTOP_OFFLINE=true</li>
              </ul>
              <pre className="mt-4 rounded-lg bg-black/30 p-4 text-xs text-slate-400">
{`Buselligence Desktop
      |
 Local AI Runtime
      ├── Ollama
      ├── llama.cpp
      └── Local Models`}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
