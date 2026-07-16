async function studioFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface StudioProject {
  id: string;
  name: string;
  description?: string;
  projectType: string;
  stack: string[];
  status: string;
  updatedAt: string;
}

export interface StudioFile {
  id: string;
  path: string;
  content: string;
  language: string;
}

export interface CodeReviewResult {
  passed: boolean;
  security: Array<{ status: string; message: string }>;
  performance: Array<{ status: string; message: string }>;
  quality: Array<{ status: string; message: string }>;
  suggestions: string[];
}

export interface StudioPackage {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: string;
  version: string;
  tags: string[];
  installs: number;
}

export const studioApi = {
  listProjects: () =>
    studioFetch<{ projects: StudioProject[] }>("/api/studio/projects").then((r) => r.projects),

  createProject: (data: { name: string; description?: string; projectType?: string }) =>
    studioFetch<{ project: StudioProject }>("/api/studio/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.project),

  deleteProject: (id: string) =>
    studioFetch<{ deleted: boolean }>(`/api/studio/projects/${id}`, { method: "DELETE" }),

  listFiles: (projectId: string) =>
    studioFetch<{ files: StudioFile[]; tree: Record<string, unknown> }>(
      `/api/studio/projects/${projectId}/files`
    ),

  getFile: (projectId: string, path: string) =>
    studioFetch<{ file: StudioFile }>(
      `/api/studio/projects/${projectId}/files/${path}`
    ).then((r) => r.file),

  saveFile: (projectId: string, path: string, content: string) =>
    studioFetch<{ file: StudioFile }>(
      `/api/studio/projects/${projectId}/files/${path}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }
    ).then((r) => r.file),

  engineer: (projectId: string, requirement: string) =>
    studioFetch<{ plan: { summary: string; steps: string[]; files: unknown[] }; commit: unknown }>(
      `/api/studio/projects/${projectId}/engineer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement }),
      }
    ),

  review: (projectId: string) =>
    studioFetch<{ review: CodeReviewResult }>(
      `/api/studio/projects/${projectId}/review`,
      { method: "POST" }
    ).then((r) => r.review),

  buildApp: (prompt: string) =>
    studioFetch<{ result: { name: string; pages: string[]; tables: string[]; roles: string[] } }>(
      "/api/studio/app-builder",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      }
    ).then((r) => r.result),

  startRuntime: (projectId: string, type = "react") =>
    studioFetch<{ runtime: { id: string; status: string; url?: string; logs: string[] } }>(
      `/api/studio/projects/${projectId}/runtime`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      }
    ).then((r) => r.runtime),

  getSchema: () =>
    studioFetch<{ schema: Array<{ name: string; columns: Array<{ name: string; type: string }> }> }>(
      "/api/studio/database/schema"
    ).then((r) => r.schema),

  generateQuery: (prompt: string) =>
    studioFetch<{ query: string }>("/api/studio/database/generate-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((r) => r.query),

  executeQuery: (query: string) =>
    studioFetch<{ rows: Record<string, unknown>[]; durationMs: number; explainPlan: string }>(
      "/api/studio/database/execute",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      }
    ),

  listAutomations: () =>
    studioFetch<{ automations: Array<{ id: string; name: string; triggerType: string; steps: unknown[] }> }>(
      "/api/studio/automations"
    ).then((r) => r.automations),

  createAutomation: (data: Record<string, unknown>) =>
    studioFetch<{ automation: unknown }>("/api/studio/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getAutomationTemplate: (type: string) =>
    studioFetch<{ template: unknown }>(`/api/studio/automations/templates/${type}`).then(
      (r) => r.template
    ),

  deploy: (projectId: string, data?: { environment?: string; domain?: string }) =>
    studioFetch<{ deployment: { id: string; status: string; url?: string; logs: string[] } }>(
      `/api/studio/projects/${projectId}/deploy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
      }
    ).then((r) => r.deployment),

  generateDocs: (projectId: string) =>
    studioFetch<{ docs: { readme: string; apiDocs: string; architecture: string; releaseNotes: string } }>(
      `/api/studio/projects/${projectId}/docs`,
      { method: "POST" }
    ).then((r) => r.docs),

  listPackages: (category?: string) =>
    studioFetch<{ packages: StudioPackage[]; installed: string[] }>(
      `/api/studio/marketplace${category ? `?category=${category}` : ""}`
    ),

  installPackage: (id: string) =>
    studioFetch<{ installed: boolean; package: StudioPackage }>(
      `/api/studio/marketplace/${id}/install`,
      { method: "POST" }
    ),

  listCommits: (projectId: string) =>
    studioFetch<{ commits: Array<{ id: string; message: string; author: string; additions: number; deletions: number; createdAt: string }> }>(
      `/api/studio/projects/${projectId}/git/commits`
    ).then((r) => r.commits),

  commit: (projectId: string, message: string) =>
    studioFetch<{ commit: unknown }>(`/api/studio/projects/${projectId}/git/commits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),

  getRouter: () => studioFetch<unknown>("/api/router"),
};

export function languageForPath(path: string): string {
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".sql")) return "sql";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".css")) return "css";
  return "plaintext";
}
