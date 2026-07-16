import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProviderAdapter,
  ChatStreamEvent,
  StreamChatContext,
  ToolCall,
} from "./types.js";
import { countMessageTokens, estimateTokens } from "../chat-utils.js";

function parseToolInput(input: unknown): Record<string, unknown> {
  if (typeof input === "object" && input !== null) {
    return input as Record<string, unknown>;
  }
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as Record<string, unknown>;
    } catch {
      return { raw: input };
    }
  }
  return {};
}

export const anthropicProvider: AIProviderAdapter = {
  id: "anthropic",

  async *streamChat(context: StreamChatContext): AsyncGenerator<ChatStreamEvent> {
    const client = new Anthropic({
      apiKey: context.credentials.apiKey,
      baseURL: context.credentials.baseUrl,
    });

    const systemMessage =
      context.messages.find((message) => message.role === "system")?.content ??
      "";
    const conversation = context.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      })) as Anthropic.MessageParam[];

    const tools =
      context.tools.length > 0
        ? context.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
          }))
        : undefined;

    const maxToolRounds = 8;

    for (let round = 0; round < maxToolRounds; round++) {
      if (context.signal?.aborted) return;

      const stream = client.messages.stream({
        model: context.credentials.model ?? "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemMessage,
        messages: conversation,
        tools,
      });

      let stopReason: string | null = null;
      const toolUses: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];
      let currentTool: {
        id: string;
        name: string;
        inputJson: string;
      } | null = null;

      for await (const event of stream) {
        if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            yield { type: "delta", content: event.delta.text };
          } else if (event.delta.type === "input_json_delta" && currentTool) {
            currentTool.inputJson += event.delta.partial_json;
          }
        }

        if (event.type === "content_block_start") {
          if (event.content_block.type === "tool_use") {
            currentTool = {
              id: event.content_block.id,
              name: event.content_block.name,
              inputJson: "",
            };
          }
        }

        if (event.type === "content_block_stop" && currentTool) {
          toolUses.push({
            id: currentTool.id,
            name: currentTool.name,
            input: parseToolInput(
              currentTool.inputJson
                ? JSON.parse(currentTool.inputJson)
                : {}
            ),
          });
          currentTool = null;
        }

        if (event.type === "message_delta") {
          stopReason = event.delta.stop_reason ?? stopReason;
        }
      }

      if (stopReason !== "tool_use" || toolUses.length === 0) {
        return;
      }

      const assistantContent: Anthropic.ContentBlockParam[] = toolUses.map(
        (tool) => ({
          type: "tool_use",
          id: tool.id,
          name: tool.name,
          input: tool.input,
        })
      );

      conversation.push({
        role: "assistant",
        content: assistantContent,
      });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const tool of toolUses) {
        const call: ToolCall = {
          id: tool.id,
          name: tool.name,
          arguments: tool.input,
        };

        yield { type: "tool_call", toolCall: call };
        yield { type: "status", status: `Running ${call.name}...` };

        const result = await context.executeTool(call);
        yield { type: "tool_result", toolResult: result };

        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: result.content,
          is_error: result.isError,
        });
      }

      conversation.push({
        role: "user",
        content: toolResults,
      });
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
