async function biFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface SemanticMetric {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  formula: string;
  unit: string | null;
  category: string | null;
  sources: string[];
  tags: string[];
}

export interface AnalystAgent {
  id: string;
  name: string;
  title: string;
  description: string;
  focus: string[];
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  value?: string;
  change?: string;
  chartType?: string;
  content?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  description: string | null;
  widgets: DashboardWidget[];
  exportFormats: string[];
}

export const biApi = {
  listAgents: () => biFetch<{ agents: AnalystAgent[] }>("/api/agents").then((d) => d.agents),
  seedSemantic: () => biFetch<{ seeded: { metrics: number; relationships: number; rules: number } }>("/api/semantic/seed", { method: "POST" }).then((d) => d.seeded),
  listMetrics: () => biFetch<{ metrics: SemanticMetric[] }>("/api/semantic/metrics").then((d) => d.metrics),
  listRelationships: () => biFetch<{ relationships: Array<{ id: string; name: string; fromEntity: string; toEntity: string; relationshipType: string; joinKey: string | null }> }>("/api/semantic/relationships").then((d) => d.relationships),
  listRules: () => biFetch<{ rules: Array<{ id: string; name: string; ruleType: string; expression: string }> }>("/api/semantic/rules").then((d) => d.rules),
  explainMetric: (name: string) => biFetch<{ explanation: string }>(`/api/semantic/metrics/${name}/explain`).then((d) => d.explanation),
  getConnectorDefinitions: () => biFetch<{ definitions: Array<{ id: string; name: string; category: string; description: string; configFields: Array<{ key: string; label: string; type: string; placeholder?: string }> }> }>("/api/connectors/definitions").then((d) => d.definitions),
  listConnectors: () => biFetch<{ connectors: Array<{ id: string; name: string; connectorType: string; lastTestOk: boolean | null }> }>("/api/connectors").then((d) => d.connectors),
  createConnector: (input: { name: string; connectorType: string; config: Record<string, string> }) =>
    biFetch<{ connector: unknown }>("/api/connectors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
  testConnector: (id: string) => biFetch<{ ok: boolean; message: string }>(`/api/connectors/${id}/test`, { method: "POST" }),
  listDashboards: () => biFetch<{ dashboards: Dashboard[] }>("/api/dashboards").then((d) => d.dashboards),
  generateDashboard: (prompt: string) =>
    biFetch<{ dashboard: Dashboard }>("/api/dashboards/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) }).then((d) => d.dashboard),
  exportDashboard: (id: string, format: string) => biFetch<unknown>(`/api/dashboards/${id}/export?format=${format}`),
  listMarketplace: () => biFetch<{ presets: Array<{ id: string; name: string; description: string; author: string; installs: number; featured?: boolean }> }>("/api/marketplace").then((d) => d.presets),
  installMarketplacePreset: (presetId: string) =>
    biFetch<unknown>(`/api/marketplace/${presetId}/install`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
  listBriefings: () => biFetch<{ briefings: Array<{ id: string; title: string; content: string; createdAt: string }> }>("/api/intelligence/briefings").then((d) => d.briefings),
  generateBriefing: () => biFetch<{ briefing: { id: string; title: string; content: string; createdAt: string } }>("/api/intelligence/briefings/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).then((d) => d.briefing),
  listAuditLogs: () => biFetch<{ logs: Array<{ id: string; action: string; resourceName: string | null; dataSources: string[]; rowsReturned: number | null; agentId: string | null; createdAt: string }> }>("/api/governance/audit").then((d) => d.logs),
};
