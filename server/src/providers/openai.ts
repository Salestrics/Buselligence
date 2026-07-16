import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type {
  AIProviderAdapter,
  ChatStreamEvent,
  StreamChatContext,
  ToolCall,
} from "./types.js";
import { countMessageTokens, estimateTokens } from "../chat-utils.js";

function toOpenAIMessages(
  messages: StreamChatContext["messages"]
): ChatCompletionMessageParam[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function toOpenAITools(tools: StreamChatContext["tools"]): ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

export const openaiProvider: AIProviderAdapter = {
  id: "openai",

  async *streamChat(context: StreamChatContext): AsyncGenerator<ChatStreamEvent> {
    const client = new OpenAI({
      apiKey: context.credentials.apiKey,
      baseURL: context.credentials.baseUrl,
    });

    const conversation: ChatCompletionMessageParam[] = toOpenAIMessages(
      context.messages
    );
    const tools = context.tools.length > 0 ? toOpenAITools(context.tools) : undefined;
    const maxToolRounds = 8;

    for (let round = 0; round < maxToolRounds; round++) {
      if (context.signal?.aborted) return;

      const stream = await client.chat.completions.create({
        model: context.credentials.model ?? "gpt-4o-mini",
        messages: conversation,
        tools,
        stream: true,
        stream_options: { include_usage: true },
      });

      let assistantText = "";
      const pendingToolCalls = new Map<
        number,
        { id: string; name: string; arguments: string }
      >();

      for await (const chunk of stream) {
        if (context.signal?.aborted) return;
        const choice = chunk.choices[0];
        const delta = choice?.delta;

        if (delta?.content) {
          assistantText += delta.content;
          yield { type: "delta", content: delta.content };
        }

        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index ?? 0;
            const existing = pendingToolCalls.get(index) ?? {
              id: toolCall.id ?? crypto.randomUUID(),
              name: toolCall.function?.name ?? "",
              arguments: "",
            };

            if (toolCall.id) existing.id = toolCall.id;
            if (toolCall.function?.name) existing.name = toolCall.function.name;
            if (toolCall.function?.arguments) {
              existing.arguments += toolCall.function.arguments;
            }

            pendingToolCalls.set(index, existing);
          }
        }
      }

      if (pendingToolCalls.size === 0) {
        return;
      }

      const toolCalls: ToolCall[] = [...pendingToolCalls.values()].map(
        (call) => ({
          id: call.id,
          name: call.name,
          arguments: parseToolArguments(call.arguments),
        })
      );

      conversation.push({
        role: "assistant",
        content: assistantText || null,
        tool_calls: toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.name,
            arguments: JSON.stringify(call.arguments),
          },
        })),
      });

      for (const call of toolCalls) {
        yield { type: "tool_call", toolCall: call };
        yield { type: "status", status: `Running ${call.name}...` };

        const result = await context.executeTool(call);
        yield { type: "tool_result", toolResult: result };

        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          content: result.content,
        });
      }
    }
  },

  estimateUsage(messages, completionText) {
    const promptTokens = countMessageTokens(messages);
    const completionTokens = estimateTokens(completionText);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  },
};
