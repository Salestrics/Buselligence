import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Database,
  Download,
  Layers,
  Loader2,
  Play,
  Shield,
  Sparkles,
  Store,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import { biApi } from "../lib/bi-api";
import { cn } from "../lib/utils";

type Tab = "semantic" | "connectors" | "dashboards" | "marketplace" | "intelligence" | "governance";

export function BiPlatformPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState<Tab>("semantic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof biApi.listMetrics>>>([]);
  const [relationships, setRelationships] = useState<Awaited<ReturnType<typeof biApi.listRelationships>>>([]);
  const [rules, setRules] = useState<Awaited<ReturnType<typeof biApi.listRules>>>([]);
  const [connectors, setConnectors] = useState<Awaited<ReturnType<typeof biApi.listConnectors>>>([]);
  const [definitions, setDefinitions] = useState<Awaited<ReturnType<typeof biApi.getConnectorDefinitions>>>([]);
  const [dashboards, setDashboards] = useState<Awaited<ReturnType<typeof biApi.listDashboards>>>([]);
  const [presets, setPresets] = useState<Awaited<ReturnType<typeof biApi.listMarketplace>>>([]);
  const [briefings, setBriefings] = useState<Awaited<ReturnType<typeof biApi.listBriefings>>>([]);
  const [auditLogs, setAuditLogs] = useState<Awaited<ReturnType<typeof biApi.listAuditLogs>>>([]);

  const [dashboardPrompt, setDashboardPrompt] = useState("Build me a SaaS executive dashboard");
  const [generating, setGenerating] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState("");
  const [connectorConfig, setConnectorConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isPending && !session?.user) navigate("/sign-in");
  }, [isPending, session, navigate]);

  async function load() {
    setLoading(true);
    try {
      const [m, r, ru, c, d, db, mp, br, al] = await Promise.all([
        biApi.listMetrics(),
        biApi.listRelationships(),
        biApi.listRules(),
        biApi.listConnectors(),
        biApi.getConnectorDefinitions(),
        biApi.listDashboards(),
        biApi.listMarketplace(),
        biApi.listBriefings(),
        biApi.listAuditLogs(),
      ]);
      setMetrics(m);
      setRelationships(r);
      setRules(ru);
      setConnectors(c);
      setDefinitions(d);
      setDashboards(db);
      setPresets(mp);
      setBriefings(br);
      setAuditLogs(al);
    } catch {
      setError("Failed to load BI platform data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user) load();
  }, [session?.user]);

  async function handleSeed() {
    const result = await biApi.seedSemantic();
    setSuccess(`Seeded ${result.metrics} metrics, ${result.relationships} relationships, ${result.rules} rules`);
    await load();
  }

  async function handleGenerateDashboard(e: FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const dashboard = await biApi.generateDashboard(dashboardPrompt);
      setDashboards((prev) => [dashboard, ...prev]);
      setSuccess(`Dashboard "${dashboard.title}" generated with ${dashboard.widgets.length} widgets`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddConnector(e: FormEvent) {
    e.preventDefault();
    const def = definitions.find((d) => d.id === selectedConnector);
    if (!def) return;
    try {
      await biApi.createConnector({
        name: def.name,
        connectorType: def.id,
        config: connectorConfig,
      });
      setSuccess(`${def.name} connector added`);
      setConnectorConfig({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add connector");
    }
  }

  async function handleInstallPreset(presetId: string) {
    try {
      await biApi.installMarketplacePreset(presetId);
      setSuccess("Installed from marketplace");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Install failed");
    }
  }

  async function handleGenerateBriefing() {
    try {
      const briefing = await biApi.generateBriefing();
      setBriefings((prev) => [briefing, ...prev]);
      setSuccess("Briefing generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Briefing failed");
    }
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Layers }[] = [
    { id: "semantic", label: "Semantic Layer", icon: Layers },
    { id: "connectors", label: "Connectors", icon: Database },
    { id: "dashboards", label: "Dashboards", icon: BarChart3 },
    { id: "marketplace", label: "Marketplace", icon: Store },
    { id: "intelligence", label: "Scheduled Intel", icon: Sparkles },
    { id: "governance", label: "Audit Log", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#0b1020]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">BI Platform</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Business intelligence that understands your business</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Define what metrics mean, connect data sources, deploy analyst agents, and generate dashboards — the semantic layer turns AI from SQL generator into a real analyst.
          </p>
        </div>

        {(error || success) && (
          <div className={cn("mb-6 rounded-2xl border px-4 py-3 text-sm", error ? "border-rose-500/20 bg-rose-500/10 text-rose-100" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100")}>
            {error ?? success}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setTab(id); setError(null); setSuccess(null); }} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition", tab === id ? "bg-brand-500 text-white" : "border border-white/10 text-slate-400 hover:text-white")}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-300" /></div>
        ) : tab === "semantic" ? (
          <div className="space-y-6">
            <div className="flex gap-3">
              <button onClick={handleSeed} className="rounded-full bg-brand-500 px-4 py-2 text-sm text-white">Seed default metrics & rules</button>
              <Link to="/chat" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">Ask about metrics in Chat →</Link>
            </div>
            <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white">Metrics</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {metrics.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-white/8 bg-[#0b1020] p-4">
                    <p className="font-medium text-white">{m.displayName}</p>
                    <p className="mt-1 font-mono text-xs text-brand-300">{m.formula}</p>
                    <p className="mt-2 text-xs text-slate-500">{m.description}</p>
                    <p className="mt-2 text-xs text-slate-600">Sources: {m.sources.join(", ") || "—"}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white">Entity Relationships</h2>
              <div className="mt-4 space-y-2">
                {relationships.map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/8 bg-[#0b1020] px-4 py-3 text-sm text-slate-300">
                    <span className="text-white">{r.fromEntity}</span> → <span className="text-white">{r.toEntity}</span>
                    <span className="ml-2 text-slate-500">({r.relationshipType})</span>
                    {r.joinKey && <p className="mt-1 font-mono text-xs text-slate-600">{r.joinKey}</p>}
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h2 className="text-lg font-semibold text-white">Business Rules</h2>
              <div className="mt-4 space-y-2">
                {rules.map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/8 bg-[#0b1020] px-4 py-3">
                    <p className="text-sm font-medium text-white">{r.name} <span className="text-xs text-slate-500">[{r.ruleType}]</span></p>
                    <p className="mt-1 font-mono text-xs text-amber-200/80">{r.expression}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : tab === "connectors" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <form onSubmit={handleAddConnector} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6 space-y-3">
              <h2 className="text-lg font-semibold text-white">Add connector</h2>
              <select value={selectedConnector} onChange={(e) => setSelectedConnector(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white">
                <option value="">Select connector...</option>
                {definitions.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.category}</option>)}
              </select>
              {definitions.find((d) => d.id === selectedConnector)?.configFields.map((field) => (
                <input key={field.key} type={field.type === "password" ? "password" : "text"} placeholder={field.placeholder ?? field.label} onChange={(e) => setConnectorConfig({ ...connectorConfig, [field.key]: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              ))}
              <button type="submit" disabled={!selectedConnector} className="rounded-full bg-brand-500 px-4 py-2 text-sm text-white disabled:opacity-50">Connect</button>
            </form>
            <div className="space-y-3">
              {connectors.length === 0 ? <p className="text-sm text-slate-500">No connectors yet. MCP remains available as the extension layer.</p> : connectors.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex justify-between">
                  <div>
                    <p className="font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.connectorType} · {c.lastTestOk === true ? "✓ tested" : c.lastTestOk === false ? "✗ failed" : "not tested"}</p>
                  </div>
                  <button onClick={() => biApi.testConnector(c.id).then(load)} className="text-xs text-brand-300">Test</button>
                </div>
              ))}
            </div>
          </div>
        ) : tab === "dashboards" ? (
          <div className="space-y-6">
            <form onSubmit={handleGenerateDashboard} className="flex gap-3">
              <input value={dashboardPrompt} onChange={(e) => setDashboardPrompt(e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white" />
              <button type="submit" disabled={generating} className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm text-white disabled:opacity-50">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Generate
              </button>
            </form>
            {dashboards.map((db) => (
              <div key={db.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
                <div className="flex justify-between">
                  <h2 className="text-lg font-semibold text-white">{db.title}</h2>
                  <div className="flex gap-2">
                    {db.exportFormats.map((f) => (
                      <button key={f} onClick={() => biApi.exportDashboard(db.id, f)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400">
                        <Download className="h-3 w-3" />{f}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-400">{db.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {db.widgets.map((w) => (
                    <div key={w.id} className={cn("rounded-2xl border border-white/8 bg-[#0b1020] p-4", w.type === "chart" && "sm:col-span-2")}>
                      <p className="text-xs text-slate-500">{w.title}</p>
                      {w.type === "metric" && <p className="mt-2 text-2xl font-semibold text-white">{w.value} <span className="text-sm text-emerald-400">{w.change}</span></p>}
                      {w.type === "chart" && <div className="mt-3 h-24 rounded-lg bg-brand-500/10 flex items-center justify-center text-xs text-slate-500">{w.chartType} chart</div>}
                      {w.type === "text" && <p className="mt-2 text-sm text-slate-300">{w.content}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : tab === "marketplace" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((p) => (
              <div key={p.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                {p.featured && <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs text-brand-200">Featured</span>}
                <p className="mt-2 font-medium text-white">{p.name}</p>
                <p className="mt-1 text-sm text-slate-400">{p.description}</p>
                <p className="mt-2 text-xs text-slate-600">{p.installs.toLocaleString()} installs · {p.author}</p>
                <button onClick={() => handleInstallPreset(p.id)} className="mt-4 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-xs text-brand-200">Install</button>
              </div>
            ))}
          </div>
        ) : tab === "intelligence" ? (
          <div className="space-y-6">
            <button onClick={handleGenerateBriefing} className="rounded-full bg-brand-500 px-4 py-2 text-sm text-white">Generate weekly briefing now</button>
            {briefings.map((b) => (
              <div key={b.id} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
                <h2 className="text-lg font-semibold text-white">{b.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{new Date(b.createdAt).toLocaleString()}</p>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">{b.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.length === 0 ? <p className="text-sm text-slate-500">No audit events yet. Queries and data access are logged automatically.</p> : auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{log.action}</span>
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                {log.resourceName && <p className="mt-1 text-sm text-white">{log.resourceName}</p>}
                {log.dataSources.length > 0 && <p className="mt-1 text-xs text-slate-400">Data accessed: {log.dataSources.map((s) => `✓ ${s}`).join(", ")}</p>}
                {log.rowsReturned !== null && <p className="text-xs text-slate-500">Rows: {log.rowsReturned}</p>}
                {log.agentId && <p className="text-xs text-brand-300">Agent: {log.agentId}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
