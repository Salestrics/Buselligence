import { randomUUID } from "node:crypto";
import {
  SYSTEM_PROMPT,
  NO_SQL_MODE_PROMPT,
  countMessageTokens,
  createConversationTitle,
  estimateTokens,
} from "./chat-utils.js";
import {
  addAnonymousTokens,
  FREE_TOKEN_LIMIT,
  getAnonymousTokens,
  reserveAnonymousTokens,
  type ChatMessage,
} from "./db.js";
import { getAgent, buildAgentWorkflowPrompt, type AgentId } from "./agents/definitions.js";
import { buildSemanticContext } from "./semantic/manager.js";
import { getConnectorSourceNames } from "./connectors/manager.js";
import { logAudit } from "./governance/audit.js";
import { listMcpServers, loadMcpTools } from "./mcp/manager.js";
import {
  getProviderAdapter,
  resolveModel,
  type ChatStreamEvent,
  type ProviderCredentials,
  type ToolCall,
} from "./providers/index.js";
import { resolveCredentials, serverDemoKeyEnabled, userAutoApprovesMcpTools } from "./settings.js";

export {
  countMessageTokens,
  createConversationTitle,
  estimateTokens,
  SYSTEM_PROMPT,
};

export function newConversationId(): string {
  return randomUUID();
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  userId?: string;
  anonymousSessionId?: string;
  isAuthenticated: boolean;
  agentId?: AgentId;
  noSqlMode?: boolean;
  approvedToolCalls?: string[];
  signal?: AbortSignal;
}

export interface StreamChatResult {
  stream: AsyncGenerator<ChatStreamEvent>;
  getUsage: () => Promise<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    provider: string | null;
    model: string | null;
    mcpToolCount: number;
    agentId: string | null;
    simulated: boolean;
  }>;
}

function sanitizeClientMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((message) => message.role !== "system");
}

export function checkAnonymousLimit(
  sessionId: string | undefined,
  isAuthenticated: boolean,
  hasUserApiKey: boolean
): { allowed: boolean; tokensUsed: number; limit: number | null } {
  if (isAuthenticated || hasUserApiKey) {
    return { allowed: true, tokensUsed: 0, limit: null };
  }

  if (!sessionId) {
    return { allowed: false, tokensUsed: 0, limit: FREE_TOKEN_LIMIT };
  }

  const tokensUsed = getAnonymousTokens(sessionId);
  return {
    allowed: tokensUsed < FREE_TOKEN_LIMIT,
    tokensUsed,
    limit: FREE_TOKEN_LIMIT,
  };
}

function buildSystemPrompt(
  userId: string | undefined,
  agentId: AgentId,
  noSqlMode: boolean,
  userQuestion: string
): string {
  const agent = getAgent(agentId);
  const parts = [agent.systemPrompt];

  if (userId) {
    const semantic = buildSemanticContext(userId);
    if (semantic) parts.push(semantic);

    const connectors = getConnectorSourceNames(userId);
    if (connectors.length) {
      parts.push(`## Connected Data Sources\n${connectors.map((c) => `- ${c}`).join("\n")}`);
    }
  }

  if (noSqlMode) parts.push(NO_SQL_MODE_PROMPT);

  if (agentId !== "buselligence" && userQuestion) {
    parts.push(buildAgentWorkflowPrompt(agent, userQuestion));
  }

  return parts.join("\n\n");
}

async function buildMockStream(reply: string): Promise<StreamChatResult> {
  async function* mockStream(): AsyncGenerator<ChatStreamEvent> {
    const words = reply.split(" ");
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      yield { type: "delta", content: `${word} ` };
    }
  }

  return {
    stream: mockStream(),
    getUsage: async () => ({
      promptTokens: 0,
      completionTokens: estimateTokens(reply),
      totalTokens: estimateTokens(reply),
      provider: null,
      model: null,
      mcpToolCount: 0,
      agentId: null,
      simulated: true,
    }),
  };
}

export async function createChatStream(
  options: StreamChatOptions
): Promise<StreamChatResult> {
  const allowServerKey =
    !options.isAuthenticated && serverDemoKeyEnabled();
  const credentials = resolveCredentials(options.userId, { allowServerKey });
  const agentId = options.agentId ?? "buselligence";
  const noSqlMode = options.noSqlMode ?? false;
  const clientMessages = sanitizeClientMessages(options.messages);
  const lastUserMessage =
    [...clientMessages].reverse().find((m) => m.role === "user")?.content ?? "";
  const approvedToolIds = new Set(options.approvedToolCalls ?? []);

  if (!credentials) {
    const mockReply =
      "Buselligence is your self-hosted AI runtime. Sign in and add your API key in Settings to start building with real models.";

    const result = await buildMockStream(mockReply);
    const originalGetUsage = result.getUsage;

    return {
      stream: result.stream,
      getUsage: async () => {
        const usage = await originalGetUsage();
        if (
          !options.isAuthenticated &&
          options.anonymousSessionId &&
          usage.totalTokens > 0
        ) {
          addAnonymousTokens(options.anonymousSessionId, usage.totalTokens);
        }
        return usage;
      },
    };
  }

  const systemContent = buildSystemPrompt(options.userId, agentId, noSqlMode, lastUserMessage);

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...clientMessages,
  ];

  const providerCredentials: ProviderCredentials = resolveModel({
    provider: credentials.provider,
    apiKey: credentials.apiKey,
    model: credentials.model,
    baseUrl: credentials.baseUrl,
  });

  const adapter = getProviderAdapter(providerCredentials.provider);
  const mcpServers = options.userId ? listMcpServers(options.userId) : [];
  const autoApproveTools =
    userAutoApprovesMcpTools(options.userId) || approvedToolIds.size > 0;
  const { tools, executeTool: baseExecuteTool } = await loadMcpTools(
    mcpServers,
    options.userId ?? "anonymous",
    { autoApproveTools }
  );

  const executeTool = async (call: ToolCall) => {
    if (!autoApproveTools && !approvedToolIds.has(call.id)) {
      return {
        toolCallId: call.id,
        content:
          "Tool execution blocked pending approval. Re-send the chat with approvedToolCalls including this tool call id.",
        isError: true,
      };
    }
    return baseExecuteTool(call);
  };

  const dataSources = options.userId
    ? [
        ...getConnectorSourceNames(options.userId),
        ...mcpServers.filter((s) => s.enabled).map((s) => `mcp:${s.name}`),
      ]
    : [];

  if (options.userId) {
    logAudit(options.userId, {
      action: "ai_query",
      resourceType: "chat",
      resourceName: lastUserMessage.slice(0, 100),
      dataSources,
      agentId,
      metadata: { noSqlMode, mcpToolCount: tools.length },
    });
  }

  let completionText = "";

  async function* eventStream(): AsyncGenerator<ChatStreamEvent> {
    for await (const event of adapter.streamChat({
      messages: fullMessages,
      credentials: providerCredentials,
      tools,
      executeTool: async (call) => {
        if (options.userId) {
          logAudit(options.userId, {
            action: "tool_call",
            resourceType: "mcp_tool",
            resourceName: call.name,
            dataSources: [call.name],
            agentId,
            metadata: {
              toolCallId: call.id,
              argumentKeys: Object.keys(call.arguments ?? {}),
            },
          });
        }
        return executeTool(call);
      },
      signal: options.signal,
    })) {
      if (options.signal?.aborted) return;
      if (event.type === "delta" && event.content) {
        completionText += event.content;
      }
      yield event;
    }
  }

  return {
    stream: eventStream(),
    getUsage: async () => {
      const usage = adapter.estimateUsage(fullMessages, completionText);

      if (
        credentials.source === "server" &&
        !options.isAuthenticated &&
        options.anonymousSessionId
      ) {
        addAnonymousTokens(options.anonymousSessionId, usage.totalTokens);
      }

      if (options.userId) {
        logAudit(options.userId, {
          action: "ai_response",
          resourceType: "chat",
          dataSources,
          agentId,
          metadata: { tokens: usage.totalTokens },
        });
      }

      return {
        ...usage,
        provider: providerCredentials.provider,
        model: providerCredentials.model ?? null,
        mcpToolCount: tools.length,
        agentId,
        simulated: false,
      };
    },
  };
}

export function userHasConfiguredApiKey(userId?: string): boolean {
  if (!userId) return false;
  return resolveCredentials(userId)?.source === "user";
}
