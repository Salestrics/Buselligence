import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ExternalLink,
  KeyRound,
  Loader2,
  Plug,
  Save,
  Server,
  Trash2,
  Wrench,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import {
  createMcpServer,
  deleteMcpServer,
  fetchProviders,
  fetchSettings,
  listMcpServers,
  saveSettings,
  testMcpServer,
  updateMcpServer,
  type McpServer,
  type McpTransport,
  type ProviderDefinition,
  type UserSettings,
} from "../lib/api";
import { cn } from "../lib/utils";

const MCP_PRESETS = [
  {
    name: "Filesystem",
    transport: "stdio" as const,
    config: {
      transport: "stdio" as const,
      stdio: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/data"],
      },
    },
  },
  {
    name: "PostgreSQL",
    transport: "stdio" as const,
    config: {
      transport: "stdio" as const,
      stdio: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost:5432/db"],
      },
    },
  },
  {
    name: "Remote SSE",
    transport: "sse" as const,
    config: {
      transport: "sse" as const,
      remote: { url: "https://your-mcp-server.example.com/sse" },
    },
  },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [providers, setProviders] = useState<ProviderDefinition[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasServerDefaultKey, setHasServerDefaultKey] = useState(false);
  const [provider, setProvider] = useState<ProviderDefinition["id"]>("openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [autoApproveMcpTools, setAutoApproveMcpTools] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [mcpName, setMcpName] = useState("");
  const [mcpTransport, setMcpTransport] = useState<McpTransport>("stdio");
  const [mcpCommand, setMcpCommand] = useState("npx");
  const [mcpArgs, setMcpArgs] = useState("-y @modelcontextprotocol/server-filesystem /data");
  const [mcpUrl, setMcpUrl] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      navigate("/sign-in");
    }
  }, [isPending, session, navigate]);

  useEffect(() => {
    fetchProviders().then(setProviders);
    fetchSettings()
      .then((data) => {
        setSettings(data.settings);
        setHasServerDefaultKey(data.hasServerDefaultKey);
        setProvider(data.settings.provider);
        setModel(data.settings.model);
        setApiBaseUrl(data.settings.apiBaseUrl ?? "");
        setAutoApproveMcpTools(Boolean(data.settings.autoApproveMcpTools));
      })
      .catch(() => setError("Failed to load settings"));
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    listMcpServers().then(setMcpServers);
  }, [session?.user]);

  const selectedProvider = providers.find((item) => item.id === provider);

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await saveSettings({
        provider,
        model,
        apiKey: apiKey.trim() ? apiKey.trim() : undefined,
        apiBaseUrl: apiBaseUrl.trim() ? apiBaseUrl.trim() : null,
        autoApproveMcpTools,
      });
      setSettings(updated);
      setApiKey("");
      setSuccess("Settings saved. Your API key is encrypted at rest.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMcpServer(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const config =
      mcpTransport === "stdio"
        ? {
            transport: "stdio" as const,
            stdio: {
              command: mcpCommand,
              args: mcpArgs.split(" ").filter(Boolean),
            },
          }
        : {
            transport: mcpTransport,
            remote: { url: mcpUrl },
          };

    try {
      const server = await createMcpServer({
        name: mcpName,
        transport: mcpTransport,
        config,
      });
      setMcpServers((current) => [server, ...current]);
      setMcpName("");
      setSuccess(`MCP server "${server.name}" added.`);
    } catch {
      setError("Failed to add MCP server");
    }
  }

  async function handleToggleServer(server: McpServer) {
    const updated = await updateMcpServer(server.id, {
      enabled: !server.enabled,
    });
    setMcpServers((current) =>
      current.map((item) => (item.id === server.id ? updated : item))
    );
  }

  async function handleDeleteServer(id: string) {
    await deleteMcpServer(id);
    setMcpServers((current) => current.filter((item) => item.id !== id));
  }

  async function handleTestServer(id: string) {
    setTestingId(id);
    const result = await testMcpServer(id);
    setTestingId(null);
    if (result.ok) {
      setSuccess(result.message ?? `Found ${result.toolCount} tools`);
    } else {
      setError(result.message ?? "MCP connection failed");
    }
  }

  function applyPreset(preset: (typeof MCP_PRESETS)[number]) {
    setMcpName(preset.name);
    setMcpTransport(preset.transport);
    if (preset.config.stdio) {
      setMcpCommand(preset.config.stdio.command);
      setMcpArgs((preset.config.stdio.args ?? []).join(" "));
    }
    if (preset.config.remote) {
      setMcpUrl(preset.config.remote.url);
    }
  }

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1020_0%,#10182f_100%)]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Bring your own API
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Buselligence is MIT-licensed and provider-agnostic. Add your own API
            keys and connect MCP servers to query live data from warehouses,
            files, and custom tools.
          </p>
        </div>

        {(error || success) && (
          <div
            className={cn(
              "mb-6 rounded-2xl border px-4 py-3 text-sm",
              error
                ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
            )}
          >
            {error ?? success}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-brand-500/15 p-3 text-brand-300">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI provider</h2>
                <p className="text-sm text-slate-400">
                  Keys are encrypted with AES-256-GCM before storage.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Provider</span>
                <select
                  value={provider}
                  onChange={(e) =>
                    setProvider(e.target.value as ProviderDefinition["id"])
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none"
                >
                  {providers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Model</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none"
                >
                  {(selectedProvider?.models ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  API key
                  {settings?.apiKeyPreview ? (
                    <span className="ml-2 text-slate-500">
                      Current: {settings.apiKeyPreview}
                    </span>
                  ) : null}
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-... or your provider key"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">
                  API base URL (optional)
                </span>
                <input
                  type="url"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none focus:border-brand-500"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3">
                <input
                  type="checkbox"
                  checked={autoApproveMcpTools}
                  onChange={(e) => setAutoApproveMcpTools(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20"
                />
                <span className="text-sm text-slate-300">
                  Auto-approve MCP tool execution in chat (off by default for safety)
                </span>
              </label>

              {selectedProvider?.docsUrl ? (
                <a
                  href={selectedProvider.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-300 hover:text-white"
                >
                  Provider docs
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save provider settings
              </button>
            </form>

            {hasServerDefaultKey ? (
              <p className="mt-4 text-xs text-slate-500">
                Server demo mode is enabled via OPENAI_API_KEY for anonymous
                trials. Signed-in users always use their own key.
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-brand-500/15 p-3 text-brand-300">
                <Plug className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">MCP servers</h2>
                <p className="text-sm text-slate-400">
                  Connect Model Context Protocol tools for live BI data access.
                </p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {MCP_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-brand-500/30 hover:text-white"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddMcpServer} className="space-y-3 border-b border-white/8 pb-5">
              <input
                value={mcpName}
                onChange={(e) => setMcpName(e.target.value)}
                placeholder="Server name"
                required
                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
              />

              <select
                value={mcpTransport}
                onChange={(e) => setMcpTransport(e.target.value as McpTransport)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="stdio">stdio (local process)</option>
                <option value="sse">SSE (remote)</option>
                <option value="http">HTTP streamable (remote)</option>
              </select>

              {mcpTransport === "stdio" ? (
                <>
                  <input
                    value={mcpCommand}
                    onChange={(e) => setMcpCommand(e.target.value)}
                    placeholder="Command"
                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
                  />
                  <input
                    value={mcpArgs}
                    onChange={(e) => setMcpArgs(e.target.value)}
                    placeholder="Arguments (space-separated)"
                    className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
                  />
                </>
              ) : (
                <input
                  value={mcpUrl}
                  onChange={(e) => setMcpUrl(e.target.value)}
                  placeholder="https://your-mcp-server/sse"
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none"
                />
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white hover:border-white/20"
              >
                <Server className="h-4 w-4" />
                Add MCP server
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {mcpServers.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No MCP servers yet. Add one to let the model query your data
                  sources during chat.
                </p>
              ) : (
                mcpServers.map((server) => (
                  <div
                    key={server.id}
                    className="rounded-2xl border border-white/8 bg-[#0b1020] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{server.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {server.transport.toUpperCase()} ·{" "}
                          {server.enabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTestServer(server.id)}
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300"
                        >
                          {testingId === server.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleServer(server)}
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300"
                        >
                          {server.enabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => handleDeleteServer(server.id)}
                          className="rounded-lg border border-white/10 px-2 py-1 text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              to="/chat"
              className="mt-6 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-white"
            >
              <Wrench className="h-4 w-4" />
              Open chat with MCP tools
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
