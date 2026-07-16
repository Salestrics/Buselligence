async function platformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface WorkspaceStats {
  conversations: number;
  projects: number;
  knowledge: number;
  automations: number;
  connectors: number;
  agents: number;
  installedPackages: number;
}

export interface WorkspaceSection {
  count: number;
  href: string;
}

export const platformApi = {
  getManifesto: () =>
    platformFetch<{
      tagline: string;
      mission: string;
      category: string;
      philosophy: string[];
      manifesto: string;
    }>("/api/platform/manifesto"),

  getPillars: () =>
    platformFetch<{
      primary: Array<{ id: string; name: string; description: string }>;
      capabilities: Array<{ id: string; name: string; description: string }>;
    }>("/api/platform/pillars"),

  getWorkspace: () =>
    platformFetch<{
      workspace: Record<string, WorkspaceSection>;
      stats: WorkspaceStats;
      learningProfile: { level: string; learningStyle: string; topics: string[] };
      learningSessions: Array<{ id: string; topic: string; level: string; content: string }>;
    }>("/api/workspace"),

  listKnowledge: () =>
    platformFetch<{ items: Array<{ id: string; title: string; content: string; sourceType: string }> }>(
      "/api/knowledge"
    ).then((r) => r.items),

  createKnowledge: (data: { title: string; content?: string; sourceType?: string }) =>
    platformFetch<{ item: unknown }>("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteKnowledge: (id: string) =>
    platformFetch<{ deleted: boolean }>(`/api/knowledge/${id}`, { method: "DELETE" }),

  startLearning: (topic: string, level?: string) =>
    platformFetch<{ session: { id: string; topic: string; content: string; level: string } }>(
      "/api/learning/sessions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      }
    ).then((r) => r.session),

  updateLearningProfile: (data: { level?: string; learningStyle?: string }) =>
    platformFetch<{ profile: unknown }>("/api/learning/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};
