import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth, authHandler } from "./auth.js";
import {
  checkAnonymousLimit,
  createChatStream,
  createConversationTitle,
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
  res.json({ ok: true, model: "BizzyB" });
});

app.get("/api/usage", async (req, res) => {
  const session = await getSession(req);
  const anonymousSessionId = req.headers["x-anonymous-session"] as
    | string
    | undefined;

  if (session?.user) {
    return res.json({
      authenticated: true,
      tokensUsed: 0,
      limit: null,
      canSave: true,
    });
  }

  const tokensUsed = anonymousSessionId
    ? getAnonymousTokens(anonymousSessionId)
    : 0;

  res.json({
    authenticated: false,
    tokensUsed,
    limit: FREE_TOKEN_LIMIT,
    canSave: false,
  });
});

app.post("/api/chat", async (req, res) => {
  const session = await getSession(req);
  const isAuthenticated = Boolean(session?.user);
  const anonymousSessionId = req.headers["x-anonymous-session"] as
    | string
    | undefined;
  const messages = req.body?.messages as ChatMessage[] | undefined;

  if (!messages?.length) {
    return res.status(400).json({ error: "Messages are required" });
  }

  const limitCheck = checkAnonymousLimit(anonymousSessionId, isAuthenticated);
  if (!limitCheck.allowed) {
    return res.status(402).json({
      error: "token_limit_reached",
      message:
        "You've used your 50,000 free tokens. Sign in to continue chatting.",
      tokensUsed: limitCheck.tokensUsed,
      limit: limitCheck.limit,
      signupFormUrl: process.env.VITE_SIGNUP_FORM_URL,
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const chatOptions: StreamChatOptions = {
      messages,
      anonymousSessionId,
      isAuthenticated,
    };

    const { stream, getUsage } = await createChatStream(chatOptions);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`);
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
        limit: isAuthenticated ? null : FREE_TOKEN_LIMIT,
        requiresSignIn:
          !isAuthenticated && updatedTokens >= FREE_TOKEN_LIMIT,
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

  const conversations = listConversations(session.user.id).map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
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
