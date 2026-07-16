import type { ChatMessage } from "../db.js";

export type AIProviderId = "openai" | "anthropic" | "google";

export interface ProviderModel {
  id: string;
  name: string;
  description?: string;
}

export interface ProviderDefinition {
  id: AIProviderId;
  name: string;
  description: string;
  defaultModel: string;
  models: ProviderModel[];
  supportsTools: boolean;
  docsUrl: string;
}

export interface ProviderCredentials {
  provider: AIProviderId;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface ChatStreamEvent {
  type: "delta" | "tool_call" | "tool_result" | "status";
  content?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  status?: string;
}

export interface StreamUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChatContext {
  messages: ChatMessage[];
  credentials: ProviderCredentials;
  tools: ToolDefinition[];
  executeTool: (call: ToolCall) => Promise<ToolResult>;
}

export interface AIProviderAdapter {
  id: AIProviderId;
  streamChat(context: StreamChatContext): AsyncGenerator<ChatStreamEvent>;
  estimateUsage(
    messages: ChatMessage[],
    completionText: string
  ): StreamUsage;
}
