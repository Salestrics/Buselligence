import type { ChatMessage } from "../db.js";
import { getProviderAdapter, resolveModel } from "../providers/index.js";
import type { AIProviderId } from "../providers/index.js";
import { resolveCredentials } from "../settings.js";

export interface LlmCompletionResult {
  text: string;
  provider: AIProviderId;
  model: string;
  simulated: boolean;
}

export async function completeWithUserCredentials(
  userId: string | undefined,
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number }
): Promise<LlmCompletionResult | null> {
  const credentials = resolveCredentials(userId, { allowServerKey: false });
  if (!credentials) return null;

  const providerCredentials = resolveModel({
    provider: credentials.provider,
    apiKey: credentials.apiKey,
    model: credentials.model,
    baseUrl: credentials.baseUrl,
  });

  const adapter = getProviderAdapter(providerCredentials.provider);
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let text = "";
  for await (const event of adapter.streamChat({
    messages,
    credentials: providerCredentials,
    tools: [],
    executeTool: async (call) => ({
      toolCallId: call.id,
      content: "Tool execution disabled",
      isError: true,
    }),
  })) {
    if (event.type === "delta" && event.content) {
      text += event.content;
      if (options?.maxTokens && text.length > options.maxTokens * 4) break;
    }
  }

  return {
    text: text.trim(),
    provider: providerCredentials.provider,
    model: providerCredentials.model ?? credentials.model,
    simulated: false,
  };
}

export async function completeWithOptionalCredentials(
  userId: string | undefined,
  systemPrompt: string,
  userPrompt: string,
  fallback: () => string
): Promise<LlmCompletionResult> {
  const live = await completeWithUserCredentials(userId, systemPrompt, userPrompt);
  if (live?.text) return live;

  return {
    text: fallback(),
    provider: "openai",
    model: "template",
    simulated: true,
  };
}
