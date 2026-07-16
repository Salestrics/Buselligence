import { anthropicProvider } from "./anthropic.js";
import { googleProvider } from "./google.js";
import { OPENAI_DEFAULT_MODEL, OPENAI_MODELS } from "./openai-models.js";
import { openaiProvider } from "./openai.js";
import type {
  AIProviderAdapter,
  AIProviderId,
  ProviderCredentials,
  ProviderDefinition,
} from "./types.js";

export const PROVIDER_DEFINITIONS: ProviderDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    description:
      "Use GPT models with your own OpenAI API key. Supports tool calling and MCP integrations.",
    defaultModel: OPENAI_DEFAULT_MODEL,
    models: [
      { id: OPENAI_MODELS.sol, name: "GPT-5.6 Sol", description: "Fast and cost-effective" },
      { id: OPENAI_MODELS.luna, name: "GPT-5.6 Luna", description: "Balanced quality and speed" },
      { id: OPENAI_MODELS.terra, name: "GPT-5.6 Terra", description: "Deep reasoning and tool use" },
    ],
    supportsTools: true,
    docsUrl: "https://platform.openai.com/docs",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description:
      "Use Claude models with your own Anthropic API key for analysis-heavy BI workflows.",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        description: "Balanced speed and quality",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        description: "Fast responses",
      },
    ],
    supportsTools: true,
    docsUrl: "https://docs.anthropic.com",
  },
  {
    id: "google",
    name: "Google AI",
    description:
      "Use Gemini models with your own Google AI Studio API key.",
    defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
    ],
    supportsTools: true,
    docsUrl: "https://ai.google.dev/docs",
  },
];

const adapters: Record<AIProviderId, AIProviderAdapter> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
};

export function listProviders(): ProviderDefinition[] {
  return PROVIDER_DEFINITIONS;
}

export function getProviderAdapter(
  provider: AIProviderId
): AIProviderAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return adapter;
}

export function getProviderDefinition(
  provider: AIProviderId
): ProviderDefinition {
  const definition = PROVIDER_DEFINITIONS.find((item) => item.id === provider);
  if (!definition) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return definition;
}

export function resolveModel(
  credentials: ProviderCredentials
): ProviderCredentials {
  const definition = getProviderDefinition(credentials.provider);
  return {
    ...credentials,
    model: credentials.model ?? definition.defaultModel,
  };
}

export type {
  AIProviderAdapter,
  AIProviderId,
  ChatStreamEvent,
  ProviderCredentials,
  ProviderDefinition,
  StreamChatContext,
  ToolCall,
  ToolDefinition,
  ToolResult,
} from "./types.js";
