import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  Code2,
  Database,
  FolderTree,
  GitBranch,
  Loader2,
  Play,
  Rocket,
  Search,
  Sparkles,
  Store,
  Workflow,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import {
  languageForPath,
  studioApi,
  type CodeReviewResult,
  type StudioFile,
  type StudioPackage,
  type StudioProject,
} from "../lib/studio-api";
import { cn } from "../lib/utils";

type StudioTab = "editor" | "database" | "automations" | "marketplace" | "deploy";

export function StudioPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<StudioTab>("editor");
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<StudioFile[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotOutput, setCopilotOutput] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [review, setReview] = useState<CodeReviewResult | null>(null);
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Database studio
  const [schema, setSchema] = useState<Array<{ name: string; columns: Array<{ name: string; type: string }> }>>([]);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM customers LIMIT 10;");
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[] | null>(null);

  // Marketplace
  const [packages, setPackages] = useState<StudioPackage[]>([]);
  const [installedPkgs, setInstalledPkgs] = useState<string[]>([]);

  // Deploy
  const [deployment, setDeployment] = useState<{ status: string; url?: string; logs: string[] } | null>(null);

  // Automations
  const [automations, setAutomations] = useState<Array<{ id: string; name: string; triggerType: string }>>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in");
  }, [isPending, session, navigate]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const list = await studioApi.listProjects();
      setProjects(list);
      if (list.length > 0 && !projectId) {
        setProjectId(list[0]!.id);
      } else if (list.length === 0) {
        const p = await studioApi.createProject({
          name: "My App",
          description: "Built with Buselligence Studio",
        });
        setProjects([p]);
        setProjectId(p.id);
      }
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadFiles = useCallback(async () => {
    if (!projectId) return;
    try {
      const { files: f } = await studioApi.listFiles(projectId);
      setFiles(f);
      if (f.length > 0 && !activeFile) {
        const first = f[0]!;
        setActiveFile(first.path);
        setOpenTabs([first.path]);
        setEditorContent(first.content);
      }
    } catch {
      setError("Failed to load files");
    }
  }, [projectId, activeFile]);

  useEffect(() => {
    if (session?.user) loadProjects();
  }, [session?.user, loadProjects]);

  useEffect(() => {
    if (projectId) loadFiles();
  }, [projectId, loadFiles]);

  useEffect(() => {
    if (tab === "database") {
      studioApi.getSchema().then(setSchema).catch(() => {});
    }
    if (tab === "marketplace") {
      studioApi.listPackages().then(({ packages: p, installed }) => {
        setPackages(p);
        setInstalledPkgs(installed);
      }).catch(() => {});
    }
    if (tab === "automations") {
      studioApi.listAutomations().then(setAutomations).catch(() => {});
    }
  }, [tab]);

  function openFile(path: string) {
    const file = files.find((f) => f.path === path);
    if (!file) return;
    setActiveFile(path);
    setEditorContent(file.content);
    if (!openTabs.includes(path)) setOpenTabs([...openTabs, path]);
  }

  async function saveFile() {
    if (!projectId || !activeFile) return;
    setSaving(true);
    try {
      await studioApi.saveFile(projectId, activeFile, editorContent);
      setSuccess("Saved");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function runEngineer(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !copilotInput.trim()) return;
    setCopilotLoading(true);
    setCopilotOutput(null);
    try {
      const { plan } = await studioApi.engineer(projectId, copilotInput);
      setCopilotOutput(
        `**${plan.summary}**\n\n${plan.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n✓ ${plan.files.length} files generated`
      );
      await loadFiles();
      setSuccess("AI Engineer completed");
    } catch {
      setError("Engineer failed");
    } finally {
      setCopilotLoading(false);
    }
  }

  async function runReview() {
    if (!projectId) return;
    try {
      const r = await studioApi.review(projectId);
      setReview(r);
    } catch {
      setError("Review failed");
    }
  }

  async function runPreview() {
    if (!projectId) return;
    try {
      const rt = await studioApi.startRuntime(projectId);
      setRuntimeLogs(rt.logs);
      setTimeout(async () => {
        const updated = await studioApi.startRuntime(projectId);
        setRuntimeLogs(updated.logs);
      }, 800);
    } catch {
      setError("Runtime failed");
    }
  }

  async function runDeploy() {
    if (!projectId) return;
    try {
      const d = await studioApi.deploy(projectId, { environment: "production" });
      setDeployment(d);
      setTimeout(async () => {
        const updated = await studioApi.deploy(projectId);
        setDeployment(updated);
      }, 2500);
    } catch {
      setError("Deploy failed");
    }
  }

  const filteredFiles = searchQuery
    ? files.filter((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  const tabs: { id: StudioTab; label: string; icon: typeof Code2 }[] = [
    { id: "editor", label: "Code Studio", icon: Code2 },
    { id: "database", label: "Database", icon: Database },
    { id: "automations", label: "Automations", icon: Workflow },
    { id: "marketplace", label: "Marketplace", icon: Store },
    { id: "deploy", label: "Deploy", icon: Rocket },
  ];

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1020] text-slate-200">
      <Navbar />

      <div className="border-b border-white/5 px-4 py-2">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">Buselligence Studio</h1>
            <select
              value={projectId ?? ""}
              onChange={(e) => {
                setProjectId(e.target.value);
                setActiveFile(null);
                setOpenTabs([]);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition",
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

      {(error || success) && (
        <div className={cn("mx-4 mt-2 rounded-lg px-4 py-2 text-sm", error ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300")}>
          {error ?? success}
        </div>
      )}

      {tab === "editor" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Explorer */}
          <div className="w-56 shrink-0 border-r border-white/5 bg-[#0d1328] p-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <FolderTree className="h-3.5 w-3.5" /> Explorer
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full rounded border border-white/10 bg-white/5 py-1.5 pl-7 pr-2 text-xs"
              />
            </div>
            <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-200px)]">
              {filteredFiles.map((f) => (
                <button
                  key={f.path}
                  onClick={() => openFile(f.path)}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs",
                    activeFile === f.path ? "bg-brand-500/20 text-brand-200" : "text-slate-400 hover:bg-white/5"
                  )}
                >
                  <FileCode className="h-3 w-3 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {openTabs.length > 0 && (
              <div className="flex border-b border-white/5 bg-[#0d1328]">
                {openTabs.map((path) => (
                  <button
                    key={path}
                    onClick={() => openFile(path)}
                    className={cn(
                      "border-r border-white/5 px-3 py-1.5 text-xs",
                      activeFile === path ? "bg-[#121a2f] text-white" : "text-slate-500"
                    )}
                  >
                    {path.split("/").pop()}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1">
              {activeFile ? (
                <Editor
                  height="100%"
                  language={languageForPath(activeFile)}
                  value={editorContent}
                  onChange={(v) => setEditorContent(v ?? "")}
                  theme="vs-dark"
                  options={{ fontSize: 13, minimap: { enabled: false }, wordWrap: "on" }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  Select a file to edit
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-white/5 bg-[#0d1328] px-4 py-2">
              <button onClick={saveFile} disabled={saving} className="rounded bg-brand-500 px-3 py-1 text-xs text-white hover:bg-brand-400 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={runPreview} className="flex items-center gap-1 rounded border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
                <Play className="h-3 w-3" /> Preview
              </button>
              <button onClick={runReview} className="flex items-center gap-1 rounded border border-white/10 px-3 py-1 text-xs hover:bg-white/5">
                <GitBranch className="h-3 w-3" /> Review
              </button>
            </div>
          </div>

          {/* Copilot + Preview */}
          <div className="flex w-80 shrink-0 flex-col border-l border-white/5 bg-[#0d1328]">
            <div className="border-b border-white/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5" /> AI Copilot
              </div>
              <form onSubmit={runEngineer} className="mt-2 space-y-2">
                <textarea
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  placeholder='e.g. "Create a customer churn prediction dashboard"'
                  rows={3}
                  className="w-full rounded border border-white/10 bg-white/5 p-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={copilotLoading}
                  className="w-full rounded bg-brand-500 py-1.5 text-xs font-medium text-white hover:bg-brand-400 disabled:opacity-50"
                >
                  {copilotLoading ? "Building..." : "AI Engineer"}
                </button>
              </form>
              {copilotOutput && (
                <pre className="mt-2 whitespace-pre-wrap rounded bg-white/5 p-2 text-xs text-slate-300">
                  {copilotOutput}
                </pre>
              )}
            </div>

            {review && (
              <div className="border-b border-white/5 p-3">
                <p className="text-xs font-medium text-slate-400">Code Review</p>
                <ReviewSection title="Security" checks={review.security} />
                <ReviewSection title="Performance" checks={review.performance} />
                <ReviewSection title="Quality" checks={review.quality} />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-xs font-medium text-slate-500">Preview Runtime</p>
              {runtimeLogs.length > 0 ? (
                <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-400">
                  {runtimeLogs.join("\n")}
                </pre>
              ) : (
                <p className="mt-1 text-xs text-slate-600">Click Preview to start sandbox</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "database" && (
        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 p-6">
          <div className="w-64 shrink-0">
            <h2 className="mb-3 text-sm font-medium text-slate-400">Schema Explorer</h2>
            {schema.map((table) => (
              <div key={table.name} className="mb-3 rounded-lg border border-white/5 p-3">
                <p className="font-mono text-sm text-brand-300">{table.name}</p>
                {table.columns.map((col) => (
                  <p key={col.name} className="ml-3 font-mono text-xs text-slate-500">
                    ├── {col.name} <span className="text-slate-600">{col.type}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex gap-2">
              <input
                placeholder='AI: "Create a monthly revenue report"'
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    const q = await studioApi.generateQuery((e.target as HTMLInputElement).value);
                    setSqlQuery(q);
                  }
                }}
              />
            </div>
            <Editor
              height="200px"
              language="sql"
              value={sqlQuery}
              onChange={(v) => setSqlQuery(v ?? "")}
              theme="vs-dark"
              options={{ fontSize: 13, minimap: { enabled: false } }}
            />
            <button
              onClick={async () => {
                const r = await studioApi.executeQuery(sqlQuery);
                setQueryResult(r.rows);
              }}
              className="self-start rounded bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-400"
            >
              Run Query
            </button>
            {queryResult && (
              <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      {Object.keys(queryResult[0] ?? {}).map((k) => (
                        <th key={k} className="px-3 py-2 text-left">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-2">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "automations" && (
        <div className="mx-auto w-full max-w-4xl flex-1 p-6">
          <h2 className="mb-4 text-lg font-semibold">AI Automation Builder</h2>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {(["salesforce_lead", "cron", "webhook"] as const).map((type) => (
              <button
                key={type}
                onClick={async () => {
                  const t = await studioApi.getAutomationTemplate(type) as { name: string; triggerType: string; steps: unknown[] };
                  await studioApi.createAutomation({
                    name: t.name,
                    triggerType: t.triggerType,
                    steps: t.steps,
                  });
                  const list = await studioApi.listAutomations();
                  setAutomations(list);
                  setSuccess(`Created: ${t.name}`);
                }}
                className="rounded-xl border border-white/10 p-4 text-left hover:border-brand-500/30"
              >
                <Workflow className="mb-2 h-5 w-5 text-brand-400" />
                <p className="font-medium capitalize">{type.replace("_", " ")}</p>
                <p className="mt-1 text-xs text-slate-500">Use template</p>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {automations.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 p-4">
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-slate-500">Trigger: {a.triggerType}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "marketplace" && (
        <div className="mx-auto w-full max-w-6xl flex-1 p-6">
          <h2 className="mb-4 text-lg font-semibold">Buselligence Marketplace</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-xs text-brand-400 capitalize">{pkg.category}</p>
                  </div>
                  <span className="text-xs text-slate-500">{pkg.installs} installs</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{pkg.description}</p>
                <button
                  onClick={async () => {
                    await studioApi.installPackage(pkg.id);
                    setInstalledPkgs([...installedPkgs, pkg.id]);
                    setSuccess(`Installed ${pkg.name}`);
                  }}
                  disabled={installedPkgs.includes(pkg.id)}
                  className="mt-3 rounded bg-brand-500 px-3 py-1 text-xs text-white hover:bg-brand-400 disabled:opacity-50"
                >
                  {installedPkgs.includes(pkg.id) ? "Installed" : "Install"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "deploy" && (
        <div className="mx-auto w-full max-w-2xl flex-1 p-6">
          <h2 className="mb-4 text-lg font-semibold">Deployment</h2>
          <div className="rounded-xl border border-white/10 p-6">
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-500">Environment:</span> Production</p>
              <p><span className="text-slate-500">Stack:</span> React + Node + PostgreSQL</p>
              <p><span className="text-slate-500">Domain:</span> app.buselligence.dev</p>
            </div>
            <button
              onClick={runDeploy}
              className="mt-4 flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-400"
            >
              <Rocket className="h-4 w-4" /> Deploy
            </button>
            {deployment && (
              <div className="mt-4 rounded-lg bg-white/5 p-4">
                <p className={cn("font-medium", deployment.status === "live" ? "text-emerald-400" : "text-amber-400")}>
                  Status: {deployment.status === "live" ? "✓ Live" : deployment.status}
                </p>
                {deployment.url && <p className="mt-1 text-sm text-brand-300">{deployment.url}</p>}
                <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-400">
                  {deployment.logs.join("\n")}
                </pre>
              </div>
            )}
          </div>
          <div className="mt-6">
            <button
              onClick={async () => {
                if (!projectId) return;
                const docs = await studioApi.generateDocs(projectId);
                setCopilotOutput(`README generated (${docs.readme.length} chars)\nAPI docs: ${docs.apiDocs.length} chars`);
              }}
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              Generate Documentation →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewSection({
  title,
  checks,
}: {
  title: string;
  checks: Array<{ status: string; message: string }>;
}) {
  return (
    <div className="mt-2">
      <p className="text-xs text-slate-500">{title}</p>
      {checks.map((c, i) => (
        <div key={i} className="mt-1 flex items-start gap-1 text-xs">
          {c.status === "pass" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
          {c.status === "warn" && <AlertTriangle className="h-3 w-3 text-amber-400" />}
          {c.status === "fail" && <XCircle className="h-3 w-3 text-rose-400" />}
          <span className="text-slate-400">{c.message}</span>
        </div>
      ))}
    </div>
  );
}
