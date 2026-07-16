import type { ChatMessage } from "./db.js";

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function countMessageTokens(messages: ChatMessage[]): number {
  return messages.reduce(
    (sum, message) => sum + estimateTokens(message.content) + 4,
    0
  );
}

export const SYSTEM_PROMPT = `You are Buselligence — an open-source business intelligence copilot.

You help users analyze data, build dashboards, write SQL, interpret KPIs, forecast trends, and make data-driven decisions. You can call MCP (Model Context Protocol) tools when they are connected to access live data sources, warehouses, files, and external systems.

Be concise, actionable, and business-focused. When tools are unavailable, explain what analysis you would run and what insights to look for. Never invent tool results — only report what tools return.`;

export function createConversationTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.content.trim();
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}
