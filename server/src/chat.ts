import { randomUUID } from "node:crypto";
import {
  SYSTEM_PROMPT,
  countMessageTokens,
  createConversationTitle,
  estimateTokens,
} from "./chat-utils.js";
import {
  addAnonymousTokens,
  FREE_TOKEN_LIMIT,
  getAnonymousTokens,
  type ChatMessage,
} from "./db.js";
import { listMcpServers, loadMcpTools } from "./mcp/manager.js";
import {
  getProviderAdapter,
  resolveModel,
  type ChatStreamEvent,
  type ProviderCredentials,
} from "./providers/index.js";
import { resolveCredentials } from "./settings.js";

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
  }>;
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
    return { allowed: true, tokensUsed: 0, limit: FREE_TOKEN_LIMIT };
  }

  const tokensUsed = getAnonymousTokens(sessionId);
  return {
    allowed: tokensUsed < FREE_TOKEN_LIMIT,
    tokensUsed,
    limit: FREE_TOKEN_LIMIT,
  };
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
    }),
  };
}

export async function createChatStream(
  options: StreamChatOptions
): Promise<StreamChatResult> {
  const credentials = resolveCredentials(options.userId);

  if (!credentials) {
    const mockReply =
      "Buselligence is a bring-your-own-API BI chatbot. Sign in, open Settings, and add your OpenAI, Anthropic, or Google API key to start chatting. You can also connect MCP servers to query live data sources.";

    const result = await buildMockStream(mockReply);
    const originalGetUsage = result.getUsage;

    return {
      stream: result.stream,
      getUsage: async () => {
        const usage = await originalGetUsage();
        if (!options.isAuthenticated && options.anonymousSessionId) {
          addAnonymousTokens(options.anonymousSessionId, usage.totalTokens);
        }
        return usage;
      },
    };
  }

  const fullMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...options.messages,
  ];

  const providerCredentials: ProviderCredentials = resolveModel({
    provider: credentials.provider,
    apiKey: credentials.apiKey,
    model: credentials.model,
    baseUrl: credentials.baseUrl,
  });

  const adapter = getProviderAdapter(providerCredentials.provider);
  const mcpServers = options.userId ? listMcpServers(options.userId) : [];
  const { tools, executeTool } = await loadMcpTools(mcpServers);

  let completionText = "";

  async function* eventStream(): AsyncGenerator<ChatStreamEvent> {
    for await (const event of adapter.streamChat({
      messages: fullMessages,
      credentials: providerCredentials,
      tools,
      executeTool,
    })) {
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

      return {
        ...usage,
        provider: providerCredentials.provider,
        model: providerCredentials.model ?? null,
        mcpToolCount: tools.length,
      };
    },
  };
}

export function userHasConfiguredApiKey(userId?: string): boolean {
  if (!userId) return false;
  return resolveCredentials(userId)?.source === "user";
}
