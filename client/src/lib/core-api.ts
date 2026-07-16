async function coreFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const coreApi = {
  getRuntime: (projectId?: string, intent?: string) =>
    coreFetch<{ runtime: unknown; engines: string[] }>(
      `/api/core/runtime?${new URLSearchParams({ ...(projectId && { projectId }), ...(intent && { intent }) })}`
    ),

  listManagedProjects: () =>
    coreFetch<{ projects: ManagedProject[] }>("/api/core/projects").then((r) => r.projects),

  createManagedProject: (prompt: string) =>
    coreFetch<{ project: ManagedProject }>("/api/core/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((r) => r.project),

  getManagedProject: (id: string) =>
    coreFetch<{ project: ManagedProject; tasks: ProjectTask[]; lifecycle: LifecycleState }>(
      `/api/core/projects/${id}`
    ),

  executeProject: (id: string) =>
    coreFetch<{ project: ManagedProject }>(`/api/core/projects/${id}/execute`, { method: "POST" }),

  listTeams: () =>
    coreFetch<{ teams: AgentTeam[] }>("/api/core/teams").then((r) => r.teams),

  assignTeam: (teamId: string, task: string) =>
    coreFetch<{ team: string; assignments: Array<{ role: string; task: string }> }>(
      `/api/core/teams/${teamId}/assign`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task }) }
    ),

  explainCodebase: (projectId: string, question: string) =>
    coreFetch<{ answer: string; impactedComponents: string[]; rationale: string }>(
      `/api/core/codebase/${projectId}/explain`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) }
    ),

  runTests: (projectId: string) =>
    coreFetch<{ results: TestResult }>(`/api/core/testing/${projectId}`, { method: "POST" }).then(
      (r) => r.results
    ),

  runSecurity: (projectId: string) =>
    coreFetch<{ scan: SecurityScan }>(`/api/core/security/${projectId}`, { method: "POST" }).then(
      (r) => r.scan
    ),

  simulate: (scenario: string) =>
    coreFetch<{ simulation: SimulationResult }>("/api/core/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    }).then((r) => r.simulation),

  getGraph: () => coreFetch<{ nodes: GraphNode[]; edges: GraphEdge[] }>("/api/core/graph"),

  runNLOS: (command: string) =>
    coreFetch<{ result: NLOSResult }>("/api/core/nlos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    }).then((r) => r.result),

  getMarketplace: (category?: string) =>
    coreFetch<{ items: MarketplaceItem[]; categories: string[] }>(
      `/api/core/marketplace${category ? `?category=${category}` : ""}`
    ),

  getModes: () =>
    coreFetch<{ modes: ModeConfig[] }>("/api/core/modes").then((r) => r.modes),

  getOAP: () => coreFetch<unknown>("/api/core/oap"),

  getCommunity: () =>
    coreFetch<{ contributions: Contribution[] }>("/api/core/community").then((r) => r.contributions),

  getDesktop: () => coreFetch<{ available: boolean; planned: boolean; stack: string }>("/api/core/desktop"),
};

export interface ManagedProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  plan: { requirements: string[]; architecture: string[]; database: string[]; ui: string[] };
  sprints: Array<{ number: number; name: string; tasks: string[]; status: string }>;
  progress: number;
}

export interface ProjectTask {
  id: string;
  sprint: number;
  title: string;
  status: string;
  assignee?: string;
}

export interface LifecycleState {
  currentStage: string;
  progress: number;
  stages: Array<{ stage: string; status: string }>;
}

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  lead: { role: string; title: string };
  members: Array<{ role: string; title: string; objectives: string[] }>;
}

export interface TestResult {
  passed: boolean;
  total: number;
  passed_count: number;
  created: number;
  findings: Array<{ severity: string; message: string }>;
  newTests: string[];
}

export interface SecurityScan {
  passed: boolean;
  critical: number;
  warnings: number;
  suggestions: number;
  checks: Array<{ category: string; status: string; message: string }>;
}

export interface SimulationResult {
  scenario: string;
  revenueImpact?: string;
  databaseImpact?: string;
  userImpact?: string;
  technicalImpact?: string;
  recommendation: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface NLOSResult {
  intent: string;
  plan: string[];
  status: string;
  results: string[];
}

export interface MarketplaceItem {
  id: string;
  category: string;
  name: string;
  description: string;
  installs: number;
}

export interface ModeConfig {
  mode: string;
  label: string;
  description: string;
  examples: string[];
}

export interface Contribution {
  id: string;
  type: string;
  name: string;
  description?: string;
}
