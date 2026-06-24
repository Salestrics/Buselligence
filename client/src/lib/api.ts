export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface UsageInfo {
  authenticated: boolean;
  tokensUsed: number;
  limit: number | null;
  canSave: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

function getHeaders(anonymousSessionId?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (anonymousSessionId) {
    headers["x-anonymous-session"] = anonymousSessionId;
  }

  return headers;
}

export async function fetchUsage(
  anonymousSessionId: string
): Promise<UsageInfo> {
  const res = await fetch("/api/usage", {
    headers: getHeaders(anonymousSessionId),
    credentials: "include",
  });
  return res.json();
}

export async function streamChat(
  messages: { role: "user" | "assistant"; content: string }[],
  anonymousSessionId: string,
  onDelta: (content: string) => void,
  onDone: (payload: {
    tokensUsed: number;
    limit: number | null;
    requiresSignIn: boolean;
    canSave: boolean;
  }) => void,
  onError: (message: string) => void
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: getHeaders(anonymousSessionId),
    credentials: "include",
    body: JSON.stringify({ messages }),
  });

  if (res.status === 402) {
    const data = await res.json();
    onError(data.message ?? "Token limit reached. Please sign in.");
    return;
  }

  if (!res.ok || !res.body) {
    onError("Failed to start chat");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;

      try {
        const data = JSON.parse(payload);
        if (data.type === "delta") {
          onDelta(data.content);
        } else if (data.type === "done") {
          onDone({
            tokensUsed: data.tokensUsed,
            limit: data.limit,
            requiresSignIn: data.requiresSignIn,
            canSave: data.canSave,
          });
        } else if (data.type === "error") {
          onError(data.message);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await fetch("/api/conversations", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations;
}

export async function loadConversation(id: string): Promise<{
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
}> {
  const res = await fetch(`/api/conversations/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function saveConversation(
  id: string,
  title: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<void> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, title, messages }),
  });
  if (!res.ok) throw new Error("Failed to save conversation");
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`/api/conversations/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}
