import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  KeyRound,
  Loader2,
  MessageSquare,
  Plug,
  Plus,
  Save,
  Send,
  Settings,
  Trash2,
  Wrench,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { Navbar } from "../components/Navbar";
import { useSession } from "../lib/auth-client";
import {
  deleteConversation,
  fetchUsage,
  listConversations,
  loadConversation,
  saveConversation,
  streamChat,
  type ChatMessage,
  type ConversationSummary,
  type ToolEvent,
} from "../lib/api";
import {
  cn,
  formatTokenCount,
  FREE_TOKEN_LIMIT,
  getAnonymousSessionId,
} from "../lib/utils";
import { biApi, type AnalystAgent } from "../lib/bi-api";

function createMessage(
  role: "user" | "assistant",
  content: string
): ChatMessage {
  return { id: crypto.randomUUID(), role, content, toolEvents: [] };
}

function ToolEvents({ events }: { events?: ToolEvent[] }) {
  if (!events?.length) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
      {events.map((event, index) => (
        <div
          key={`${event.type}-${index}`}
          className={cn(
            "rounded-xl px-3 py-2 text-xs",
            event.type === "tool_call"
              ? "bg-brand-500/10 text-brand-200"
              : event.type === "tool_result"
                ? event.isError
                  ? "bg-rose-500/10 text-rose-200"
                  : "bg-emerald-500/10 text-emerald-200"
                : "bg-white/[0.04] text-slate-400"
          )}
        >
          {event.type === "tool_call" && (
            <span className="inline-flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Calling {event.name}
            </span>
          )}
          {event.type === "status" && event.content}
          {event.type === "tool_result" && (
            <span>
              Tool result
              {event.content ? `: ${event.content.slice(0, 180)}` : ""}
              {event.content && event.content.length > 180 ? "…" : ""}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [limit, setLimit] = useState<number | null>(FREE_TOKEN_LIMIT);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<AnalystAgent[]>([]);
  const [agentId, setAgentId] = useState("buselligence");
  const [noSqlMode, setNoSqlMode] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const anonymousSessionId = getAnonymousSessionId();
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    async function loadUsage() {
      const usage = await fetchUsage(anonymousSessionId);
      setTokensUsed(usage.tokensUsed);
      setLimit(usage.limit);
      setHasApiKey(Boolean(usage.hasApiKey));
      setProvider(usage.provider ?? null);
      setModel(usage.model ?? null);
      if (!usage.authenticated && usage.limit && usage.tokensUsed >= usage.limit) {
        setRequiresSignIn(true);
      }
    }
    loadUsage();
  }, [anonymousSessionId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    listConversations().then(setConversations);
    biApi.listAgents().then(setAgents);
  }, [isAuthenticated]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (!isAuthenticated && requiresSignIn) {
      setError(
        "Demo token limit reached. Sign up and add your API key to continue."
      );
      return;
    }

    setError(null);
    setInput("");

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      { id: assistantId, role: "assistant", content: "", toolEvents: [] },
    ]);

    let assistantContent = "";
    const toolEvents: ToolEvent[] = [];

    await streamChat(
      nextMessages.map(({ role, content }) => ({ role, content })),
      anonymousSessionId,
      {
        onDelta: (delta) => {
          assistantContent += delta;
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: assistantContent, toolEvents: [...toolEvents] }
                : message
            )
          );
        },
        onToolEvent: (event) => {
          toolEvents.push(event);
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: assistantContent,
                    toolEvents: [...toolEvents],
                  }
                : message
            )
          );
        },
        onDone: ({ tokensUsed: used, limit: usageLimit, requiresSignIn: needsSignIn, provider: activeProvider, model: activeModel }) => {
          setTokensUsed(used);
          setLimit(usageLimit);
          setRequiresSignIn(needsSignIn);
          setProvider(activeProvider ?? null);
          setModel(activeModel ?? null);
          setLoading(false);
        },
        onError: (message) => {
          setError(message);
          if (!isAuthenticated) setRequiresSignIn(true);
          setLoading(false);
        },
      },
      { agentId, noSqlMode }
    );
  }

  async function handleSave() {
    if (!isAuthenticated || messages.length === 0) return;
    setSaving(true);
    try {
      const id = activeConversationId ?? crypto.randomUUID();
      const title =
        messages.find((m) => m.role === "user")?.content.slice(0, 48) ??
        "New conversation";
      await saveConversation(
        id,
        title,
        messages.map(({ role, content }) => ({ role, content }))
      );
      setActiveConversationId(id);
      const updated = await listConversations();
      setConversations(updated);
    } catch {
      setError("Failed to save conversation");
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadConversation(id: string) {
    try {
      const conversation = await loadConversation(id);
      setActiveConversationId(conversation.id);
      setMessages(
        conversation.messages.map((message) =>
          createMessage(message.role, message.content)
        )
      );
    } catch {
      setError("Failed to load conversation");
    }
  }

  async function handleDeleteConversation(id: string) {
    await deleteConversation(id);
    setConversations((current) => current.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setActiveConversationId(null);
    setError(null);
  }

  const tokenProgress = limit
    ? Math.min((tokensUsed / limit) * 100, 100)
    : 0;

  const needsApiKey = isAuthenticated && !hasApiKey;

  return (
    <div className="flex min-h-screen flex-col bg-[#0b1020]">
      <Navbar />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 px-4 py-4 md:px-6">
        {isAuthenticated && (
          <aside className="hidden w-72 shrink-0 flex-col rounded-2xl border border-white/8 bg-white/[0.03] p-4 lg:flex">
            <button
              onClick={handleNewChat}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/20"
            >
              <Plus className="h-4 w-4" />
              New chat
            </button>

            <Link
              to="/settings"
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm text-brand-200 transition hover:border-brand-500/30"
            >
              <Settings className="h-4 w-4" />
              API & MCP settings
            </Link>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    activeConversationId === conversation.id
                      ? "bg-brand-500/15 text-white"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  )}
                >
                  <button
                    onClick={() => handleLoadConversation(conversation.id)}
                    className="flex-1 truncate text-left"
                  >
                    {conversation.title}
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(conversation.id)}
                    className="opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        <section className="flex min-h-[calc(100vh-6rem)] flex-1 flex-col rounded-2xl border border-white/8 bg-[#10182f]">
          <div className="border-b border-white/8 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-brand-300" />
                  <h1 className="text-sm font-medium text-white">
                    Buselligence Chat
                  </h1>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {agents.find((a) => a.id === agentId)?.name ?? "Buselligence"}
                  {provider && model ? ` · ${provider} · ${model}` : ""}
                  {noSqlMode ? " · No-SQL mode" : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isAuthenticated && agents.length > 0 && (
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0b1020] px-2 py-1.5 text-xs text-white"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                )}
                <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={noSqlMode}
                    onChange={(e) => setNoSqlMode(e.target.checked)}
                    className="accent-brand-500"
                  />
                  No SQL
                </label>
              </div>

              <div className="flex items-center gap-3">
                {!isAuthenticated && limit !== null && (
                  <div className="min-w-[180px]">
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>Demo tokens</span>
                      <span>
                        {formatTokenCount(tokensUsed)} /{" "}
                        {formatTokenCount(limit)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          tokenProgress >= 100
                            ? "bg-rose-500"
                            : "bg-brand-500"
                        )}
                        style={{ width: `${tokenProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {isAuthenticated && messages.length > 0 && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 transition hover:border-white/20"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save chat
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            {needsApiKey ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <KeyRound className="h-10 w-10 text-brand-300" />
                <h2 className="mt-6 text-2xl font-semibold text-white">
                  Add your API key to start
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                  Buselligence is bring-your-own-API. Add your OpenAI,
                  Anthropic, or Google key in Settings, then optionally connect
                  MCP servers for live data access.
                </p>
                <Link
                  to="/settings"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-medium text-white"
                >
                  <Settings className="h-4 w-4" />
                  Open Settings
                </Link>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Logo size="lg" showGlow />
                <h2 className="mt-6 text-2xl font-semibold text-white">
                  What can I help you accomplish?
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                  Your AI companion — learn, create, analyze, build, automate, and solve
                  problems. Pick an agent or just start talking.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Explain quantum physics like I'm a beginner",
                    "Create an inventory system for my small business",
                    "What should I focus on this week?",
                    "Build me a website for my bakery",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-300 transition hover:border-brand-500/30 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                {isAuthenticated ? (
                  <Link
                    to="/settings"
                    className="mt-8 inline-flex items-center gap-2 text-sm text-brand-300 hover:text-white"
                  >
                    <Plug className="h-4 w-4" />
                    Configure MCP integrations
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7",
                        message.role === "user"
                          ? "bg-brand-500 text-white"
                          : "border border-white/8 bg-white/[0.03] text-slate-200"
                      )}
                    >
                      <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                        {message.role === "user" ? "You" : "Buselligence"}
                      </p>
                      <div className="markdown whitespace-pre-wrap">
                        {message.content ||
                          (loading && message.role === "assistant" ? (
                            <span className="inline-flex items-center gap-2 text-slate-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Thinking...
                            </span>
                          ) : null)}
                      </div>
                      {message.role === "assistant" ? (
                        <ToolEvents events={message.toolEvents} />
                      ) : null}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-white/8 p-4">
            {(error || requiresSignIn) && !isAuthenticated && (
              <div className="mx-auto mb-3 flex max-w-3xl items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>
                    {error ??
                      "Demo token limit reached. Sign up and add your own API key for unlimited usage."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      to="/sign-up"
                      className="rounded-full bg-brand-500 px-4 py-2 text-xs font-medium text-white"
                    >
                      Sign up free
                    </Link>
                    <Link
                      to="/sign-in"
                      className="rounded-full border border-white/10 px-4 py-2 text-xs text-white"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!isAuthenticated && messages.length > 0 && (
              <p className="mx-auto mb-3 max-w-3xl text-center text-xs text-slate-500">
                Guest chats are not saved. Sign up to use your own API keys and
                MCP integrations.
              </p>
            )}

            <div className="mx-auto flex max-w-3xl items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={
                  needsApiKey
                    ? "Add your API key in Settings to chat..."
                    : requiresSignIn && !isAuthenticated
                      ? "Sign up to continue chatting..."
                      : "Ask about KPIs, SQL, forecasts, or MCP-connected data..."
                }
                disabled={
                  loading ||
                  needsApiKey ||
                  (requiresSignIn && !isAuthenticated)
                }
                className="max-h-40 min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={
                  loading ||
                  needsApiKey ||
                  !input.trim() ||
                  (requiresSignIn && !isAuthenticated)
                }
                className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand-500 text-white transition hover:bg-brand-400 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
