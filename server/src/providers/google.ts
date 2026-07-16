import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
  type Part,
} from "@google/generative-ai";
import type {
  AIProviderAdapter,
  ChatStreamEvent,
  StreamChatContext,
  ToolCall,
} from "./types.js";
import { countMessageTokens, estimateTokens } from "../chat-utils.js";

function toGeminiTools(
  tools: StreamChatContext["tools"]
): FunctionDeclaration[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: convertSchema(tool.inputSchema),
  }));
}

function convertSchema(schema: Record<string, unknown>): FunctionDeclaration["parameters"] {
  const properties = (schema.properties as Record<string, Record<string, unknown>>) ?? {};
  const required = (schema.required as string[]) ?? [];

  return {
    type: SchemaType.OBJECT,
    properties: Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [
        key,
        {
          type: mapSchemaType(value.type as string),
          description: value.description as string | undefined,
        } as { type: SchemaType; description?: string },
      ])
    ) as FunctionDeclaration["parameters"] extends { properties: infer P } ? P : never,
    required,
  };
}

function mapSchemaType(type: string | undefined): SchemaType {
  switch (type) {
    case "integer":
    case "number":
      return SchemaType.NUMBER;
    case "boolean":
      return SchemaType.BOOLEAN;
    case "array":
      return SchemaType.ARRAY;
    default:
      return SchemaType.STRING;
  }
}

export const googleProvider: AIProviderAdapter = {
  id: "google",

  async *streamChat(context: StreamChatContext): AsyncGenerator<ChatStreamEvent> {
    const genAI = new GoogleGenerativeAI(context.credentials.apiKey);
    const model = genAI.getGenerativeModel({
      model: context.credentials.model ?? "gemini-2.0-flash",
      tools:
        context.tools.length > 0
          ? [{ functionDeclarations: toGeminiTools(context.tools) }]
          : undefined,
      toolConfig:
        context.tools.length > 0
          ? { functionCallingConfig: { mode: FunctionCallingMode.AUTO } }
          : undefined,
    });

    const history = context.messages
      .filter((message) => message.role !== "system")
      .slice(0, -1)
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const latestUserMessage =
      [...context.messages].reverse().find((message) => message.role === "user")
        ?.content ?? "";

    const systemMessage =
      context.messages.find((message) => message.role === "system")?.content ??
      "";

    const chat = model.startChat({
      history,
      systemInstruction: systemMessage || undefined,
    });

    const maxToolRounds = 8;
    let prompt = latestUserMessage;

    for (let round = 0; round < maxToolRounds; round++) {
      const result = await chat.sendMessageStream(prompt);
      const functionCalls: ToolCall[] = [];

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { type: "delta", content: text };
        }

        const calls = chunk.functionCalls();
        if (calls) {
          for (const call of calls) {
            functionCalls.push({
              id: crypto.randomUUID(),
              name: call.name,
              arguments: (call.args ?? {}) as Record<string, unknown>,
            });
          }
        }
      }

      if (functionCalls.length === 0) {
        return;
      }

      const responseParts: Part[] = [];

      for (const call of functionCalls) {
        yield { type: "tool_call", toolCall: call };
        yield { type: "status", status: `Running ${call.name}...` };

        const toolResult = await context.executeTool(call);
        yield { type: "tool_result", toolResult };

        responseParts.push({
          functionResponse: {
            name: call.name,
            response: {
              output: toolResult.content,
              isError: toolResult.isError ?? false,
            },
          },
        });
      }

      const followUp = await chat.sendMessageStream(responseParts);
      for await (const chunk of followUp.stream) {
        const text = chunk.text();
        if (text) {
          yield { type: "delta", content: text };
        }
      }

      return;
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
