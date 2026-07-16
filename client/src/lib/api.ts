export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolEvents?: ToolEvent[];
}

export interface ToolEvent {
  type: "tool_call" | "tool_result" | "status";
  name?: string;
  content?: string;
  isError?: boolean;
}

export interface UsageInfo {
  authenticated: boolean;
  tokensUsed: number;
  limit: number | null;
  canSave: boolean;
  hasApiKey?: boolean;
  apiKeySource?: "user" | "server" | null;
  provider?: string | null;
  model?: string | null;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderDefinition {
  id: "openai" | "anthropic" | "google";
  name: string;
  description: string;
  defaultModel: string;
  models: Array<{ id: string; name: string; description?: string }>;
  supportsTools: boolean;
  docsUrl: string;
}

export interface UserSettings {
  provider: ProviderDefinition["id"];
  model: string;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  apiBaseUrl: string | null;
}

export type McpTransport = "stdio" | "sse" | "http";

export interface McpServerConfig {
  transport: McpTransport;
  stdio?: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  };
  remote?: {
    url: string;
    headers?: Record<string, string>;
  };
}

export interface McpServer {
  id: string;
  name: string;
  transport: McpTransport;
  config: McpServerConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function getHeaders(anonymousSessionId?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (anonymousSessionId) {
    headers["x-anonymous-session"] = anonymousSessionId;
  }

  return headers;
}

export async function fetchUsage(
  anonymousSessionId: string
): Promise<UsageInfo> {
  const res = await fetch("/api/usage", {
    headers: getHeaders(anonymousSessionId),
    credentials: "include",
  });
  return res.json();
}

export async function fetchProviders(): Promise<ProviderDefinition[]> {
  const res = await fetch("/api/providers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.providers;
}

export async function fetchSettings(): Promise<{
  settings: UserSettings;
  hasServerDefaultKey: boolean;
}> {
  const res = await fetch("/api/settings", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

export async function saveSettings(input: {
  provider: ProviderDefinition["id"];
  model?: string;
  apiKey?: string | null;
  apiBaseUrl?: string | null;
}): Promise<UserSettings> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to save settings");
  }
  const data = await res.json();
  return data.settings;
}

export async function listMcpServers(): Promise<McpServer[]> {
  const res = await fetch("/api/mcp/servers", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.servers;
}

export async function createMcpServer(input: {
  name: string;
  transport: McpTransport;
  config: McpServerConfig;
  enabled?: boolean;
}): Promise<McpServer> {
  const res = await fetch("/api/mcp/servers", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create MCP server");
  const data = await res.json();
  return data.server;
}

export async function updateMcpServer(
  id: string,
  input: Partial<{
    name: string;
    transport: McpTransport;
    config: McpServerConfig;
    enabled: boolean;
  }>
): Promise<McpServer> {
  const res = await fetch(`/api/mcp/servers/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update MCP server");
  const data = await res.json();
  return data.server;
}

export async function deleteMcpServer(id: string): Promise<void> {
  await fetch(`/api/mcp/servers/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function testMcpServer(id: string): Promise<{
  ok: boolean;
  toolCount: number;
  tools: Array<{ name: string; description?: string }>;
  message?: string;
}> {
  const res = await fetch(`/api/mcp/servers/${id}/test`, {
    method: "POST",
    credentials: "include",
  });
  return res.json();
}

export async function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  anonymousSessionId: string,
  handlers: {
    onDelta: (content: string) => void;
    onToolEvent: (event: ToolEvent) => void;
    onDone: (payload: {
      tokensUsed: number;
      limit: number | null;
      requiresSignIn: boolean;
      canSave: boolean;
      provider?: string | null;
      model?: string | null;
    }) => void;
    onError: (message: string) => void;
  }
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: getHeaders(anonymousSessionId),
    credentials: "include",
    body: JSON.stringify({ messages }),
  });

  if (res.status === 402 || res.status === 401 || res.status === 400) {
    const data = await res.json().catch(() => ({}));
    handlers.onError(data.message ?? "Unable to start chat");
    return;
  }

  if (!res.ok || !res.body) {
    handlers.onError("Failed to start chat");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;

      try {
        const data = JSON.parse(payload);
        if (data.type === "delta") {
          handlers.onDelta(data.content);
        } else if (data.type === "tool_call") {
          handlers.onToolEvent({
            type: "tool_call",
            name: data.toolCall?.name,
          });
        } else if (data.type === "tool_result") {
          handlers.onToolEvent({
            type: "tool_result",
            name: data.toolResult?.toolCallId,
            content: data.toolResult?.content,
            isError: data.toolResult?.isError,
          });
        } else if (data.type === "status") {
          handlers.onToolEvent({
            type: "status",
            content: data.status,
          });
        } else if (data.type === "done") {
          handlers.onDone({
            tokensUsed: data.tokensUsed,
            limit: data.limit,
            requiresSignIn: data.requiresSignIn,
            canSave: data.canSave,
            provider: data.usage?.provider,
            model: data.usage?.model,
          });
        } else if (data.type === "error") {
          handlers.onError(data.message);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await fetch("/api/conversations", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations;
}

export async function loadConversation(id: string): Promise<{
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
}> {
  const res = await fetch(`/api/conversations/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function saveConversation(
  id: string,
  title: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<void> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, title, messages }),
  });
  if (!res.ok) throw new Error("Failed to save conversation");
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`/api/conversations/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}
