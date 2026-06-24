import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import {
  addAnonymousTokens,
  FREE_TOKEN_LIMIT,
  getAnonymousTokens,
  type ChatMessage,
} from "./db.js";

const SYSTEM_PROMPT = `You are BizzyB, the Buselligence AI — an expert business intelligence assistant. You help users analyze data, build dashboards, write SQL, interpret KPIs, forecast trends, and make data-driven decisions. Be concise, actionable, and business-focused. When you don't have access to the user's actual data, explain what analysis you would run and what insights to look for.`;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function countMessageTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg.content) + 4, 0);
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  anonymousSessionId?: string;
  isAuthenticated: boolean;
}

export interface StreamChatResult {
  stream: AsyncGenerator<string>;
  getUsage: () => Promise<{ promptTokens: number; completionTokens: number; totalTokens: number }>;
}

export function checkAnonymousLimit(
  sessionId: string | undefined,
  isAuthenticated: boolean
): { allowed: boolean; tokensUsed: number; limit: number } {
  if (isAuthenticated) {
    return { allowed: true, tokensUsed: 0, limit: FREE_TOKEN_LIMIT };
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

export async function createChatStream(
  options: StreamChatOptions
): Promise<StreamChatResult> {
  const openai = getOpenAIClient();
  const fullMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...options.messages,
  ];

  let promptTokens = countMessageTokens(fullMessages);
  let completionTokens = 0;
  let fullContent = "";

  if (!openai) {
    const mockReply =
      "I'm BizzyB, the Buselligence AI. Configure `OPENAI_API_KEY` to enable live responses. Meanwhile, I can help you think through KPI frameworks, dashboard design, and SQL patterns for revenue, churn, and funnel analysis.";

    async function* mockStream() {
      const words = mockReply.split(" ");
      for (const word of words) {
        await new Promise((r) => setTimeout(r, 25));
        yield word + " ";
      }
    }

    return {
      stream: mockStream(),
      getUsage: async () => {
        completionTokens = estimateTokens(mockReply);
        const totalTokens = promptTokens + completionTokens;

        if (!options.isAuthenticated && options.anonymousSessionId) {
          addAnonymousTokens(options.anonymousSessionId, totalTokens);
        }

        return { promptTokens, completionTokens, totalTokens };
      },
    };
  }

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: fullMessages,
    stream: true,
    stream_options: { include_usage: true },
  });

  async function* openaiStream() {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        yield delta;
      }

      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? promptTokens;
        completionTokens = chunk.usage.completion_tokens ?? completionTokens;
      }
    }
  }

  return {
    stream: openaiStream(),
    getUsage: async () => {
      if (completionTokens === 0) {
        completionTokens = estimateTokens(fullContent);
      }

      const totalTokens = promptTokens + completionTokens;

      if (!options.isAuthenticated && options.anonymousSessionId) {
        addAnonymousTokens(options.anonymousSessionId, totalTokens);
      }

      return { promptTokens, completionTokens, totalTokens };
    },
  };
}

export function createConversationTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.content.trim();
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

export function newConversationId(): string {
  return randomUUID();
}
