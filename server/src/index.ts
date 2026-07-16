import "./load-env.js";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth, authHandler } from "./auth.js";
import {
  checkAnonymousLimit,
  createChatStream,
  createConversationTitle,
  userHasConfiguredApiKey,
  type StreamChatOptions,
} from "./chat.js";
import {
  deleteConversation,
  FREE_TOKEN_LIMIT,
  getAnonymousTokens,
  getConversation,
  listConversations,
  saveConversation,
  type ChatMessage,
} from "./db.js";
import {
  createMcpServer,
  deleteMcpServer,
  getMcpServer,
  listMcpServers,
  testMcpServer,
  updateMcpServer,
  type McpServerInput,
} from "./mcp/manager.js";
import { listProviders } from "./providers/index.js";
import {
  getPublicSettings,
  resolveCredentials,
  saveUserSettings,
} from "./settings.js";
import type { AIProviderId } from "./providers/index.js";
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from "./outbound/campaigns.js";
import {
  createActivity,
  deleteActivity,
  listActivities,
} from "./outbound/activities.js";
import {
  convertLeadToContact,
  createContact,
  deleteContact,
  deleteLead,
  getContact,
  getLead,
  getOutboundStats,
  listContacts,
  listLeads,
  updateContact,
  updateLeadStatus,
} from "./outbound/contacts.js";
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "./outbound/companies.js";
import { runOutboundCampaign } from "./outbound/runner.js";
import {
  getPublicOutboundSettings,
  listSearchProviders,
  saveOutboundSettings,
} from "./outbound/settings.js";
import { testSearchConnection } from "./outbound/search.js";
import type {
  OutboundCampaignInput,
  OutboundCompanyInput,
  OutboundContactInput,
  ActivityType,
  ContactStage,
  LeadStatus,
  SearchProviderId,
} from "./outbound/types.js";
import "./outbound/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.all("/api/auth/{*splat}", authHandler);
app.use(express.json());

async function getSession(req: express.Request) {
  return auth.api.getSession({ headers: req.headers as HeadersInit });
}

app.get("/api/health", (_req, res) => {
  const hasServerKey = Boolean(process.env.OPENAI_API_KEY);
  res.json({
    ok: true,
    name: "Buselligence",
    version: "3.0.0",
    license: "MIT",
    features: {
      byok: true,
      mcp: true,
      outbound: true,
      contactManagement: true,
      providers: listProviders().map((provider) => provider.id),
      searchProviders: listSearchProviders().map((provider) => provider.id),
      serverDefaultKey: hasServerKey,
    },
  });
});

app.get("/api/providers", (_req, res) => {
  res.json({ providers: listProviders() });
});

app.get("/api/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  res.json({
    settings: getPublicSettings(session.user.id),
    hasServerDefaultKey: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.put("/api/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const provider = req.body?.provider as AIProviderId | undefined;
  if (!provider) {
    return res.status(400).json({ error: "Provider is required" });
  }

  try {
    const settings = saveUserSettings(session.user.id, {
      provider,
      model: req.body?.model,
      apiKey:
        req.body?.apiKey === null
          ? null
          : typeof req.body?.apiKey === "string"
            ? req.body.apiKey
            : undefined,
      apiBaseUrl:
        req.body?.apiBaseUrl === null
          ? null
          : typeof req.body?.apiBaseUrl === "string"
            ? req.body.apiBaseUrl
            : undefined,
    });

    res.json({ settings });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to save settings",
    });
  }
});

app.get("/api/mcp/servers", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  res.json({ servers: listMcpServers(session.user.id) });
});

app.post("/api/mcp/servers", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const input = req.body as McpServerInput;
  if (!input?.name || !input?.transport || !input?.config) {
    return res.status(400).json({ error: "name, transport, and config are required" });
  }

  const server = createMcpServer(session.user.id, input);
  res.status(201).json({ server });
});

app.put("/api/mcp/servers/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const server = updateMcpServer(
    req.params.id,
    session.user.id,
    req.body as Partial<McpServerInput>
  );

  if (!server) {
    return res.status(404).json({ error: "MCP server not found" });
  }

  res.json({ server });
});

app.delete("/api/mcp/servers/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const deleted = deleteMcpServer(req.params.id, session.user.id);
  if (!deleted) {
    return res.status(404).json({ error: "MCP server not found" });
  }

  res.json({ ok: true });
});

app.post("/api/mcp/servers/:id/test", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const server = getMcpServer(req.params.id, session.user.id);
  if (!server) {
    return res.status(404).json({ error: "MCP server not found" });
  }

  const result = await testMcpServer(server);
  res.json(result);
});

// --- AI Outbound: lead discovery & contact management ---

app.get("/api/outbound/stats", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });
  res.json({ stats: getOutboundStats(session.user.id) });
});

app.get("/api/outbound/search-providers", (_req, res) => {
  res.json({ providers: listSearchProviders() });
});

app.get("/api/outbound/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });
  res.json({ settings: getPublicOutboundSettings(session.user.id) });
});

app.put("/api/outbound/settings", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const searchProvider = req.body?.searchProvider as SearchProviderId | undefined;
  if (!searchProvider) return res.status(400).json({ error: "searchProvider is required" });

  try {
    const settings = saveOutboundSettings(session.user.id, {
      searchProvider,
      searchApiKey:
        req.body?.searchApiKey === null
          ? null
          : typeof req.body?.searchApiKey === "string"
            ? req.body.searchApiKey
            : undefined,
    });
    res.json({ settings });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to save outbound settings",
    });
  }
});

app.post("/api/outbound/settings/test", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const settings = getPublicOutboundSettings(session.user.id);
  if (!settings.hasSearchApiKey) {
    return res.status(400).json({ error: "No search API key configured" });
  }

  const { resolveSearchCredentials } = await import("./outbound/settings.js");
  const creds = resolveSearchCredentials(session.user.id);
  if (!creds) return res.status(400).json({ error: "Search credentials not found" });

  const result = await testSearchConnection(creds.provider, creds.apiKey);
  res.json(result);
});

app.get("/api/outbound/campaigns", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });
  res.json({ campaigns: listCampaigns(session.user.id) });
});

app.post("/api/outbound/campaigns", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const input = req.body as OutboundCampaignInput;
  if (!input?.name) return res.status(400).json({ error: "Campaign name is required" });

  const campaign = createCampaign(session.user.id, input);
  res.status(201).json({ campaign });
});

app.get("/api/outbound/campaigns/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const campaign = getCampaign(req.params.id, session.user.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json({ campaign });
});

app.put("/api/outbound/campaigns/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const campaign = updateCampaign(req.params.id, session.user.id, req.body as Partial<OutboundCampaignInput>);
  if (!campaign) return res.status(404).json({ error: "Campaign not found" });
  res.json({ campaign });
});

app.delete("/api/outbound/campaigns/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const deleted = deleteCampaign(req.params.id, session.user.id);
  if (!deleted) return res.status(404).json({ error: "Campaign not found" });
  res.json({ ok: true });
});

app.post("/api/outbound/campaigns/:id/run", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const result = await runOutboundCampaign(req.params.id, session.user.id);
  res.json(result);
});

app.get("/api/outbound/leads", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const leads = listLeads(session.user.id, {
    campaignId: req.query.campaignId as string | undefined,
    status: req.query.status as LeadStatus | undefined,
  });
  res.json({ leads });
});

app.get("/api/outbound/leads/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const lead = getLead(req.params.id, session.user.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json({ lead });
});

app.patch("/api/outbound/leads/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const status = req.body?.status as LeadStatus | undefined;
  if (!status) return res.status(400).json({ error: "status is required" });

  const lead = updateLeadStatus(req.params.id, session.user.id, status);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json({ lead });
});

app.delete("/api/outbound/leads/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const deleted = deleteLead(req.params.id, session.user.id);
  if (!deleted) return res.status(404).json({ error: "Lead not found" });
  res.json({ ok: true });
});

app.post("/api/outbound/leads/:id/convert", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const contact = convertLeadToContact(req.params.id, session.user.id);
  if (!contact) return res.status(404).json({ error: "Lead not found" });
  res.json({ contact });
});

app.get("/api/outbound/contacts", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const contacts = listContacts(session.user.id, {
    companyId: req.query.companyId as string | undefined,
    stage: req.query.stage as ContactStage | undefined,
  });
  res.json({ contacts });
});

app.post("/api/outbound/contacts", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const input = req.body as OutboundContactInput;
  if (!input?.firstName) return res.status(400).json({ error: "firstName is required" });

  const contact = createContact(session.user.id, input);
  res.status(201).json({ contact });
});

app.get("/api/outbound/contacts/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const contact = getContact(req.params.id, session.user.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json({ contact });
});

app.put("/api/outbound/contacts/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const contact = updateContact(req.params.id, session.user.id, req.body as Partial<OutboundContactInput>);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json({ contact });
});

app.delete("/api/outbound/contacts/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const deleted = deleteContact(req.params.id, session.user.id);
  if (!deleted) return res.status(404).json({ error: "Contact not found" });
  res.json({ ok: true });
});

app.get("/api/outbound/companies", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });
  res.json({ companies: listCompanies(session.user.id) });
});

app.post("/api/outbound/companies", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const input = req.body as OutboundCompanyInput;
  if (!input?.name) return res.status(400).json({ error: "Company name is required" });

  const company = createCompany(session.user.id, input);
  res.status(201).json({ company });
});

app.get("/api/outbound/companies/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const company = getCompany(req.params.id, session.user.id);
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json({ company });
});

app.put("/api/outbound/companies/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const company = updateCompany(req.params.id, session.user.id, req.body as Partial<OutboundCompanyInput>);
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json({ company });
});

app.delete("/api/outbound/companies/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const deleted = deleteCompany(req.params.id, session.user.id);
  if (!deleted) return res.status(404).json({ error: "Company not found" });
  res.json({ ok: true });
});

app.get("/api/outbound/activities", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const activities = listActivities(session.user.id, {
    contactId: req.query.contactId as string | undefined,
    companyId: req.query.companyId as string | undefined,
    leadId: req.query.leadId as string | undefined,
  });
  res.json({ activities });
});

app.post("/api/outbound/activities", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const { contactId, companyId, leadId, type, subject, body, metadata } = req.body as {
    contactId?: string;
    companyId?: string;
    leadId?: string;
    type: ActivityType;
    subject?: string;
    body: string;
    metadata?: Record<string, unknown>;
  };

  if (!type || !body) return res.status(400).json({ error: "type and body are required" });

  const activity = createActivity(session.user.id, {
    contactId,
    companyId,
    leadId,
    type,
    subject,
    body,
    metadata,
  });
  res.status(201).json({ activity });
});

app.delete("/api/outbound/activities/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) return res.status(401).json({ error: "Authentication required" });

  const deleted = deleteActivity(req.params.id, session.user.id);
  if (!deleted) return res.status(404).json({ error: "Activity not found" });
  res.json({ ok: true });
});

app.get("/api/usage", async (req, res) => {
  const session = await getSession(req);
  const anonymousSessionId = req.headers["x-anonymous-session"] as
    | string
    | undefined;

  if (session?.user) {
    const credentials = resolveCredentials(session.user.id);
    return res.json({
      authenticated: true,
      tokensUsed: 0,
      limit: null,
      canSave: true,
      hasApiKey: Boolean(credentials),
      apiKeySource: credentials?.source ?? null,
      provider: credentials?.provider ?? null,
      model: credentials?.model ?? null,
    });
  }

  const tokensUsed = anonymousSessionId
    ? getAnonymousTokens(anonymousSessionId)
    : 0;

  res.json({
    authenticated: false,
    tokensUsed,
    limit: process.env.OPENAI_API_KEY ? FREE_TOKEN_LIMIT : null,
    canSave: false,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
    apiKeySource: process.env.OPENAI_API_KEY ? "server" : null,
    provider: process.env.OPENAI_API_KEY ? "openai" : null,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  });
});

app.post("/api/chat", async (req, res) => {
  const session = await getSession(req);
  const isAuthenticated = Boolean(session?.user);
  const userId = session?.user?.id;
  const anonymousSessionId = req.headers["x-anonymous-session"] as
    | string
    | undefined;
  const messages = req.body?.messages as ChatMessage[] | undefined;

  if (!messages?.length) {
    return res.status(400).json({ error: "Messages are required" });
  }

  const hasUserApiKey = userHasConfiguredApiKey(userId);
  const limitCheck = checkAnonymousLimit(
    anonymousSessionId,
    isAuthenticated,
    hasUserApiKey
  );

  if (!limitCheck.allowed) {
    return res.status(402).json({
      error: "token_limit_reached",
      message:
        "You've used the demo token allowance. Sign in and add your own API key to continue.",
      tokensUsed: limitCheck.tokensUsed,
      limit: limitCheck.limit,
    });
  }

  if (!isAuthenticated && !process.env.OPENAI_API_KEY) {
    return res.status(401).json({
      error: "api_key_required",
      message:
        "Sign in and add your API key in Settings, or configure OPENAI_API_KEY for demo mode.",
    });
  }

  if (isAuthenticated && !resolveCredentials(userId)) {
    return res.status(400).json({
      error: "api_key_required",
      message:
        "Add your API key in Settings before chatting. Buselligence is bring-your-own-API.",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const chatOptions: StreamChatOptions = {
      messages,
      userId,
      anonymousSessionId,
      isAuthenticated,
    };

    const { stream, getUsage } = await createChatStream(chatOptions);

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const usage = await getUsage();
    const updatedTokens = anonymousSessionId
      ? getAnonymousTokens(anonymousSessionId)
      : 0;

    res.write(
      `data: ${JSON.stringify({
        type: "done",
        usage,
        tokensUsed: updatedTokens,
        limit:
          isAuthenticated || hasUserApiKey ? null : FREE_TOKEN_LIMIT,
        requiresSignIn:
          !isAuthenticated &&
          !hasUserApiKey &&
          updatedTokens >= FREE_TOKEN_LIMIT,
        canSave: isAuthenticated,
      })}\n\n`
    );
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Chat failed",
      })}\n\n`
    );
    res.end();
  }
});

app.get("/api/conversations", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const conversations = listConversations(session.user.id).map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  }));

  res.json({ conversations });
});

app.get("/api/conversations/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const conversation = getConversation(req.params.id, session.user.id);
  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  res.json({
    id: conversation.id,
    title: conversation.title,
    messages: JSON.parse(conversation.messages) as ChatMessage[],
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  });
});

app.post("/api/conversations", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const messages = req.body?.messages as ChatMessage[] | undefined;
  const id = (req.body?.id as string | undefined) ?? crypto.randomUUID();
  const title =
    (req.body?.title as string | undefined) ??
    createConversationTitle(messages ?? []);

  if (!messages?.length) {
    return res.status(400).json({ error: "Messages are required" });
  }

  const saved = saveConversation(id, session.user.id, title, messages);
  res.json({
    id: saved.id,
    title: saved.title,
    createdAt: saved.created_at,
    updatedAt: saved.updated_at,
  });
});

app.delete("/api/conversations/:id", async (req, res) => {
  const session = await getSession(req);
  if (!session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const deleted = deleteConversation(req.params.id, session.user.id);
  if (!deleted) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  res.json({ ok: true });
});

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Buselligence server running on http://localhost:${PORT}`);
});
