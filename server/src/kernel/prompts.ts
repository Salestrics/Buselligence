import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export interface PromptWorkspace {
  id: string;
  name: string;
  promptType: "system" | "agent" | "tool" | "memory" | "model";
  content: string;
  metadata: Record<string, unknown>;
}

export function listPrompts(userId: string, type?: string): PromptWorkspace[] {
  const query = type
    ? "SELECT * FROM kernel_prompts WHERE user_id = ? AND prompt_type = ? ORDER BY updated_at DESC"
    : "SELECT * FROM kernel_prompts WHERE user_id = ? ORDER BY updated_at DESC";
  const rows = (type
    ? db.prepare(query).all(userId, type)
    : db.prepare(query).all(userId)) as Array<{
    id: string;
    name: string;
    prompt_type: string;
    content: string;
    metadata: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    promptType: r.prompt_type as PromptWorkspace["promptType"],
    content: r.content,
    metadata: parseJson<Record<string, unknown>>(r.metadata, {}),
  }));
}

export function createPrompt(
  userId: string,
  input: { name: string; promptType: PromptWorkspace["promptType"]; content: string; metadata?: Record<string, unknown> }
): PromptWorkspace {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO kernel_prompts (id, user_id, name, prompt_type, content, metadata) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, userId, input.name, input.promptType, input.content, JSON.stringify(input.metadata ?? {}));

  return listPrompts(userId).find((p) => p.id === id)!;
}

export function getDefaultPromptWorkspace(userId: string): PromptWorkspace[] {
  const existing = listPrompts(userId);
  if (existing.length > 0) return existing;

  return [
    createPrompt(userId, {
      name: "System Prompt",
      promptType: "system",
      content: "You are Buselligence — the open-source AI runtime. Mission: Give every person the power of AI.",
    }),
    createPrompt(userId, {
      name: "Agent Instructions",
      promptType: "agent",
      content: "Execute tasks using available skills. Always trace actions. Respect permissions.",
    }),
    createPrompt(userId, {
      name: "Memory Rules",
      promptType: "memory",
      content: "Store decisions and context. Never store secrets. Scope memory to project.",
    }),
    createPrompt(userId, {
      name: "Model Settings",
      promptType: "model",
      content: JSON.stringify({ default: "gpt-4o-mini", reasoning: "gpt-4o", code: "claude-sonnet-4-20250514" }, null, 2),
      metadata: { temperature: 0.7, maxTokens: 4096 },
    }),
  ];
}
