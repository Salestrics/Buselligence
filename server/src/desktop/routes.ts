import type { Express, Request } from "express";
import { LOCAL_TOOLS, executeCommand, listCommandLog } from "./command-bridge.js";
import { getGitHubConnection, listOrgs, listRepos } from "./github.js";
import { DESKTOP_HEADLINE, DESKTOP_TAGLINE, getLocalRuntimeConfig } from "./local.js";
import { getPermissions, savePermissions } from "./permissions.js";
import { detectStack, scanProject } from "./scanner.js";
import { createSnapshot, listSnapshots, rollbackSnapshot } from "./snapshots.js";
import {
  getWorkspace,
  listWorkspaces,
  provisionWorkspace,
  seedDemoWorkspaces,
  setWorkspaceStatus,
} from "./workspaces.js";

type GetSession = (req: Request) => Promise<{ user?: { id: string } } | null>;

export function registerDesktopRoutes(app: Express, getSession: GetSession) {
  app.get("/api/desktop", (_req, res) => {
    res.json({
      name: "Buselligence Desktop Runtime",
      tagline: DESKTOP_TAGLINE,
      headline: DESKTOP_HEADLINE,
      stack: "Tauri",
      available: true,
      download: {
        windows: "Buselligence-setup.exe",
        mac: "Buselligence.dmg",
        linux: "Buselligence.AppImage",
      },
      capabilities: [
        "Local Monaco editor",
        "Native filesystem",
        "Terminal & command bridge",
        "Git integration",
        "GitHub workspace provisioning",
        "Offline / local AI",
        "Multi-workspace manager",
      ],
    });
  });

  app.get("/api/desktop/github", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({
      connection: getGitHubConnection(session.user.id),
      orgs: listOrgs(),
      repos: listRepos(req.query.org as string | undefined),
    });
  });

  app.get("/api/desktop/workspaces", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    seedDemoWorkspaces(session.user.id);
    res.json({ workspaces: listWorkspaces(session.user.id) });
  });

  app.post("/api/desktop/workspaces/provision", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { repo } = req.body;
    if (!repo) return res.status(400).json({ error: "repo required" });
    res.status(201).json(provisionWorkspace(session.user.id, repo));
  });

  app.get("/api/desktop/workspaces/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const ws = getWorkspace(session.user.id, req.params.id!);
    if (!ws) return res.status(404).json({ error: "Workspace not found" });
    res.json({ workspace: ws });
  });

  app.post("/api/desktop/workspaces/:id/status", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { status } = req.body;
    const ws = setWorkspaceStatus(session.user.id, req.params.id!, status);
    if (!ws) return res.status(404).json({ error: "Workspace not found" });
    res.json({ workspace: ws });
  });

  app.get("/api/desktop/scan", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const repo = (req.query.repo as string) ?? "project";
    const stack = detectStack(repo);
    res.json({ intelligence: scanProject(repo, stack.items), stack: stack.items });
  });

  app.get("/api/desktop/permissions", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ permissions: getPermissions(session.user.id), tools: LOCAL_TOOLS });
  });

  app.put("/api/desktop/permissions", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ permissions: savePermissions(session.user.id, req.body) });
  });

  app.post("/api/desktop/command", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { command, workspaceId, approved } = req.body;
    if (!command) return res.status(400).json({ error: "command required" });

    const perms = getPermissions(session.user.id);
    if (perms.askBeforeExecution && !approved) {
      return res.json({ requiresApproval: true, command, permissions: perms });
    }

    res.json({ result: executeCommand(session.user.id, command, workspaceId) });
  });

  app.get("/api/desktop/commands", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({
      commands: listCommandLog(session.user.id, req.query.workspaceId as string | undefined),
    });
  });

  app.get("/api/desktop/workspaces/:id/snapshots", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ snapshots: listSnapshots(session.user.id, req.params.id!) });
  });

  app.post("/api/desktop/workspaces/:id/snapshots", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const snapshot = createSnapshot(session.user.id, req.params.id!, req.body.label);
    res.status(201).json({ snapshot });
  });

  app.post("/api/desktop/snapshots/:id/rollback", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json(rollbackSnapshot(session.user.id, req.params.id!));
  });

  app.get("/api/desktop/local", (_req, res) => {
    res.json({ config: getLocalRuntimeConfig() });
  });
}
