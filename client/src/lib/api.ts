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

// --- AI Outbound ---

export type LeadStatus = "new" | "qualified" | "converted" | "contacted" | "dismissed";
export type ContactStage = "new" | "researching" | "contacted" | "replied" | "qualified" | "unqualified" | "customer";
export type CampaignStatus = "draft" | "running" | "completed" | "failed";
export type SearchProviderId = "tavily" | "serper" | "brave";
export type ActivityType = "note" | "email" | "call" | "meeting" | "status_change" | "discovered" | "follow_up";

export interface OutboundStats {
  campaigns: number;
  leads: number;
  contacts: number;
  companies: number;
  qualified: number;
  followUps: number;
}

export interface OutboundCampaign {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  keywords: string[];
  geography: string | null;
  targetTitles: string[];
  companySize: string | null;
  customQueries: string[];
  status: CampaignStatus;
  leadsCount: number;
  contactsCount: number;
  lastRunAt: string | null;
  lastRunError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundLead {
  id: string;
  campaignId: string;
  campaignName: string | null;
  companyId: string | null;
  contactId: string | null;
  companyName: string;
  website: string | null;
  contactName: string | null;
  email: string | null;
  linkedin: string | null;
  phone: string | null;
  title: string | null;
  industry: string | null;
  location: string | null;
  snippet: string | null;
  sourceUrl: string;
  relevanceScore: number;
  aiSummary: string;
  qualificationNotes: string | null;
  status: LeadStatus;
  discoveredAt: string;
}

export interface OutboundContact {
  id: string;
  companyId: string | null;
  companyName: string | null;
  leadId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  title: string | null;
  stage: ContactStage;
  tags: string[];
  notes: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  status: string;
  contactsCount: number;
  leadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundActivity {
  id: string;
  contactId: string | null;
  companyId: string | null;
  leadId: string | null;
  type: ActivityType;
  subject: string | null;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface OutboundSettings {
  searchProvider: SearchProviderId;
  hasSearchApiKey: boolean;
  searchApiKeyPreview: string | null;
}

async function outboundFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const outboundApi = {
  getStats: () => outboundFetch<{ stats: OutboundStats }>("/api/outbound/stats").then((d) => d.stats),
  getSearchProviders: () => outboundFetch<{ providers: Array<{ id: SearchProviderId; name: string; description: string; docsUrl: string }> }>("/api/outbound/search-providers").then((d) => d.providers),
  getSettings: () => outboundFetch<{ settings: OutboundSettings }>("/api/outbound/settings").then((d) => d.settings),
  saveSettings: (input: { searchProvider: SearchProviderId; searchApiKey?: string | null }) =>
    outboundFetch<{ settings: OutboundSettings }>("/api/outbound/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((d) => d.settings),
  testSearch: () => outboundFetch<{ ok: boolean; resultCount: number; message?: string }>("/api/outbound/settings/test", { method: "POST" }),
  listCampaigns: () => outboundFetch<{ campaigns: OutboundCampaign[] }>("/api/outbound/campaigns").then((d) => d.campaigns),
  createCampaign: (input: Partial<OutboundCampaign> & { name: string }) =>
    outboundFetch<{ campaign: OutboundCampaign }>("/api/outbound/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((d) => d.campaign),
  runCampaign: (id: string) =>
    outboundFetch<{ ok: boolean; leadsFound: number; searchesRun: number; companiesCreated: number; message?: string }>(
      `/api/outbound/campaigns/${id}/run`,
      { method: "POST" }
    ),
  deleteCampaign: (id: string) =>
    outboundFetch<{ ok: boolean }>(`/api/outbound/campaigns/${id}`, { method: "DELETE" }),
  listLeads: (params?: { campaignId?: string; status?: LeadStatus }) => {
    const q = new URLSearchParams();
    if (params?.campaignId) q.set("campaignId", params.campaignId);
    if (params?.status) q.set("status", params.status);
    return outboundFetch<{ leads: OutboundLead[] }>(`/api/outbound/leads?${q}`).then((d) => d.leads);
  },
  updateLead: (id: string, status: LeadStatus) =>
    outboundFetch<{ lead: OutboundLead }>(`/api/outbound/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((d) => d.lead),
  convertLead: (id: string) =>
    outboundFetch<{ contact: OutboundContact }>(`/api/outbound/leads/${id}/convert`, { method: "POST" }).then((d) => d.contact),
  deleteLead: (id: string) =>
    outboundFetch<{ ok: boolean }>(`/api/outbound/leads/${id}`, { method: "DELETE" }),
  listContacts: (params?: { companyId?: string; stage?: ContactStage }) => {
    const q = new URLSearchParams();
    if (params?.companyId) q.set("companyId", params.companyId);
    if (params?.stage) q.set("stage", params.stage);
    return outboundFetch<{ contacts: OutboundContact[] }>(`/api/outbound/contacts?${q}`).then((d) => d.contacts);
  },
  createContact: (input: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    title?: string;
    companyId?: string | null;
    stage?: ContactStage;
    notes?: string;
  }) =>
    outboundFetch<{ contact: OutboundContact }>("/api/outbound/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((d) => d.contact),
  updateContact: (id: string, input: Partial<OutboundContact>) =>
    outboundFetch<{ contact: OutboundContact }>(`/api/outbound/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((d) => d.contact),
  deleteContact: (id: string) =>
    outboundFetch<{ ok: boolean }>(`/api/outbound/contacts/${id}`, { method: "DELETE" }),
  listCompanies: () =>
    outboundFetch<{ companies: OutboundCompany[] }>("/api/outbound/companies").then((d) => d.companies),
  createCompany: (input: { name: string; website?: string; industry?: string }) =>
    outboundFetch<{ company: OutboundCompany }>("/api/outbound/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((d) => d.company),
  listActivities: (params?: { contactId?: string; companyId?: string }) => {
    const q = new URLSearchParams();
    if (params?.contactId) q.set("contactId", params.contactId);
    if (params?.companyId) q.set("companyId", params.companyId);
    return outboundFetch<{ activities: OutboundActivity[] }>(`/api/outbound/activities?${q}`).then((d) => d.activities);
  },
  addActivity: (input: {
    contactId?: string;
    companyId?: string;
    type: ActivityType;
    subject?: string;
    body: string;
  }) =>
    outboundFetch<{ activity: OutboundActivity }>("/api/outbound/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((d) => d.activity),
};
