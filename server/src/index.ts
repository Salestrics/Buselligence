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
    version: "2.0.0",
    license: "MIT",
    features: {
      byok: true,
      mcp: true,
      providers: listProviders().map((provider) => provider.id),
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
