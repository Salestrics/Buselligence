async function kernelFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface KernelInfo {
  name: string;
  version: string;
  primitive: string;
  subsystems: string[];
  goal: string;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description?: string;
  version: string;
  category: string;
  installs: number;
  builtin: boolean;
}

export interface RegisteredAgent {
  id: string;
  slug: string;
  name: string;
  version: string;
  capabilities: string[];
  permissions: string[];
  status: string;
}

export interface Evaluation {
  id: string;
  agentSlug: string;
  task: string;
  score: number;
  issues: string[];
  metrics: {
    accuracy: number;
    cost: number;
    speed: number;
    reliability: number;
    toolUsage: number;
  };
}

export interface TraceSummary {
  id: string;
  request: string;
  status: string;
  durationMs: number | null;
  createdAt: string;
}

export interface TraceDetail extends TraceSummary {
  spans: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    durationMs?: number;
  }>;
  flow: string[];
}

export interface PromptWorkspace {
  id: string;
  name: string;
  promptType: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface BuselligenceLock {
  version: string;
  models: Record<string, string>;
  agents: Record<string, string>;
  skills: Record<string, string>;
  mcpServers: string[];
  dependencies: Record<string, string>;
  generatedAt: string;
}

export interface ProjectTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  skills: string[];
  agents: string[];
  path: string;
}

export const kernelApi = {
  getInfo: () => kernelFetch<KernelInfo>("/api/kernel"),

  getState: (projectId?: string) =>
    kernelFetch<{ state: unknown }>(
      `/api/kernel/state${projectId ? `?projectId=${projectId}` : ""}`
    ),

  execute: (action: string, input?: Record<string, unknown>, agentId?: string) =>
    kernelFetch<{ result: { traceId: string; output: unknown; costUsd?: number } }>(
      "/api/kernel/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, input: input ?? {}, agentId }),
      }
    ),

  listSkills: () =>
    kernelFetch<{ skills: Skill[]; installed: Skill[] }>("/api/kernel/skills"),

  installSkill: (id: string) =>
    kernelFetch<{ installed: boolean; skills: Skill[] }>(`/api/kernel/skills/${id}/install`, {
      method: "POST",
    }),

  listAgents: () =>
    kernelFetch<{ agents: RegisteredAgent[] }>("/api/kernel/registry").then((r) => r.agents),

  getAgent: (slug: string) =>
    kernelFetch<{ agent: RegisteredAgent }>(`/api/kernel/registry/${slug}`).then((r) => r.agent),

  listEvaluations: () =>
    kernelFetch<{ evaluations: Evaluation[]; benchmarks: Array<{ name: string; tasks: string[] }> }>(
      "/api/kernel/evaluations"
    ),

  runEvaluation: (agentSlug: string, task: string) =>
    kernelFetch<{ evaluation: Evaluation }>("/api/kernel/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentSlug, task }),
    }),

  listPrompts: () =>
    kernelFetch<{ prompts: PromptWorkspace[]; workspace: string }>("/api/kernel/prompts"),

  listTraces: () =>
    kernelFetch<{ traces: TraceSummary[] }>("/api/kernel/traces").then((r) => r.traces),

  getTrace: (id: string) =>
    kernelFetch<{ trace: TraceDetail }>(`/api/kernel/traces/${id}`).then((r) => r.trace),

  getCosts: () => kernelFetch<{ costs: { totalCostUsd: number; totalTokens: number; recent: unknown[] } }>(
    "/api/kernel/costs"
  ),

  analyzeCost: (task: string) =>
    kernelFetch<{ analysis: { task: string; estimatedCostUsd: number; optimization: string } }>(
      "/api/kernel/costs/analyze",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      }
    ),

  getLockfile: () =>
    kernelFetch<{ lock: BuselligenceLock | null; filename: string }>("/api/kernel/lockfile"),

  generateLockfile: (projectId?: string) =>
    kernelFetch<{ lock: BuselligenceLock; filename: string }>("/api/kernel/lockfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }),

  getSdk: () => kernelFetch<{ sdk: { name: string; version: string; example: string } }>("/api/kernel/sdk"),

  listTemplates: () =>
    kernelFetch<{ templates: ProjectTemplate[] }>("/api/kernel/templates").then((r) => r.templates),

  getLocalConfig: () =>
    kernelFetch<{ config: unknown; message: string }>("/api/kernel/local"),

  getCommunity: () =>
    kernelFetch<{ hub: { message: string; stats: Record<string, number> }; items: unknown[] }>(
      "/api/kernel/community"
    ),
};
