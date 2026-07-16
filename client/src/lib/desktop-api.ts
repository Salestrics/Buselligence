async function desktopFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface DesktopInfo {
  name: string;
  tagline: string;
  headline: string;
  stack: string;
  available: boolean;
  download: { windows: string; mac: string; linux: string };
}

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  org: string;
  description?: string;
}

export interface DesktopWorkspace {
  id: string;
  name: string;
  repoName?: string;
  stack: string[];
  status: string;
  intelligence: {
    framework: string;
    language: string;
    database: string;
    architecture: string;
    entryPoints: number;
    importantFiles: number;
    packageManager: string;
  };
}

export interface AIPermissions {
  readFiles: boolean;
  modifyFiles: boolean;
  runCommands: boolean;
  installPackages: boolean;
  deploy: boolean;
  askBeforeExecution: boolean;
}

export const desktopApi = {
  getInfo: () => desktopFetch<DesktopInfo>("/api/desktop"),

  getGitHub: (org?: string) =>
    desktopFetch<{
      connection: { connected: boolean; username: string };
      orgs: Array<{ login: string; name: string }>;
      repos: GitHubRepo[];
    }>(`/api/desktop/github${org ? `?org=${org}` : ""}`),

  listWorkspaces: () =>
    desktopFetch<{ workspaces: DesktopWorkspace[] }>("/api/desktop/workspaces").then((r) => r.workspaces),

  provision: (repo: string) =>
    desktopFetch<{ workspace: DesktopWorkspace; steps: Array<{ step: string; status: string }> }>(
      "/api/desktop/workspaces/provision",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo }) }
    ),

  setStatus: (id: string, status: string) =>
    desktopFetch<{ workspace: DesktopWorkspace }>(`/api/desktop/workspaces/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((r) => r.workspace),

  getPermissions: () =>
    desktopFetch<{ permissions: AIPermissions; tools: Array<{ name: string; enabled: boolean }> }>(
      "/api/desktop/permissions"
    ),

  savePermissions: (permissions: AIPermissions) =>
    desktopFetch<{ permissions: AIPermissions }>("/api/desktop/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(permissions),
    }).then((r) => r.permissions),

  previewCommand: (command: string, workspaceId?: string) =>
    desktopFetch<{
      requiresApproval: boolean;
      approvalToken?: string;
      reason?: string;
    }>("/api/desktop/command/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, workspaceId }),
    }),

  executeCommand: (command: string, workspaceId?: string, approvalToken?: string) =>
    desktopFetch<{
      requiresApproval?: boolean;
      approvalToken?: string;
      result?: { command: string; status: string; output: string; previewUrl?: string };
    }>("/api/desktop/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, workspaceId, approvalToken }),
    }),

  listSnapshots: (workspaceId: string) =>
    desktopFetch<{ snapshots: Array<{ id: string; label: string; filesChanged: number; branch: string }> }>(
      `/api/desktop/workspaces/${workspaceId}/snapshots`
    ).then((r) => r.snapshots),

  createSnapshot: (workspaceId: string, label?: string) =>
    desktopFetch<{ snapshot: { id: string; label: string; filesChanged: number } }>(
      `/api/desktop/workspaces/${workspaceId}/snapshots`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) }
    ),

  rollback: (snapshotId: string) =>
    desktopFetch<{ ok: boolean; message: string }>(`/api/desktop/snapshots/${snapshotId}/rollback`, {
      method: "POST",
    }),

  getLocalConfig: () => desktopFetch<{ config: unknown }>("/api/desktop/local"),
};
