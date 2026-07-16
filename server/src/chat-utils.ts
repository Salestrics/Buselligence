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

export const SYSTEM_PROMPT = `You are Buselligence — an open-source AI analyst for business data.

You understand the business through its semantic layer: defined metrics, entity relationships, and business rules. You connect to data sources via first-class connectors and MCP integrations.

You help executives and data teams get insights without vendor lock-in. Be concise, actionable, and business-focused. Never invent data or tool results.`;

export const NO_SQL_MODE_PROMPT = `
## No-SQL Mode (ACTIVE)
The user does NOT want to see SQL unless they explicitly ask for it.
Instead provide:
1. **Answer** — plain-language executive summary
2. **What we checked** — which metrics and data sources (no SQL)
3. **Key findings** — bullets with numbers
4. **Recommendations** — actionable next steps
Hide query complexity. Speak in business terms only.`;

export function createConversationTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.content.trim();
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}
