import type { Express, Request } from "express";
import { OPEN_AGENT_PROTOCOL, validateAgentManifest } from "./agent-protocol.js";
import { explainCodebase, buildCodebaseModel } from "./codebase.js";
import { listContributions, createContribution, seedCommunityContributions } from "./community.js";
import { createWorkspace, listWorkspaces } from "./collaboration.js";
import { maintainDocumentation } from "./docs-system.js";
import { indexProjectFiles, getFileContext } from "./file-system.js";
import { buildKnowledgeGraph, queryGraph } from "./knowledge-graph.js";
import { getLifecycleState } from "./lifecycle.js";
import { listMarketplace2, getMarketplaceCategories } from "./marketplace2.js";
import { listModes, getModeConfig } from "./modes.js";
import { processNaturalLanguageCommand } from "./nlos.js";
import {
  createManagedProject,
  executeProject,
  getManagedProject,
  listManagedProjects,
  listProjectTasks,
} from "./project-manager.js";
import { getRuntimeState, buildCoreContextPrompt } from "./runtime.js";
import { runSecurityEngine } from "./security-engine.js";
import { runSimulation, listSimulations } from "./simulation.js";
import { listTeams, getTeam, assignTaskToTeam } from "./teams.js";
import { runTestEngine } from "./testing-engine.js";
import { listProjects } from "../studio/manager.js";

type GetSession = (req: Request) => Promise<{ user?: { id: string } } | null>;

export function registerCoreRoutes(app: Express, getSession: GetSession) {
  // AI Runtime / Brain
  app.get("/api/core/runtime", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { projectId, intent } = req.query;
    res.json({
      runtime: getRuntimeState(
        session.user.id,
        projectId as string | undefined,
        intent as string | undefined
      ),
      engines: ["context", "memory", "reasoning", "planning", "execution"],
    });
  });

  app.get("/api/core/context", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ context: buildCoreContextPrompt(session.user.id, req.query.projectId as string) });
  });

  // Autonomous Project Manager
  app.get("/api/core/projects", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ projects: listManagedProjects(session.user.id) });
  });

  app.post("/api/core/projects", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt required" });
    const project = createManagedProject(session.user.id, prompt);
    res.status(201).json({ project });
  });

  app.get("/api/core/projects/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const project = getManagedProject(session.user.id, req.params.id!);
    if (!project) return res.status(404).json({ error: "Project not found" });
    const tasks = listProjectTasks(session.user.id, req.params.id!);
    const lifecycle = getLifecycleState(project.status);
    res.json({ project, tasks, lifecycle });
  });

  app.post("/api/core/projects/:id/execute", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const project = executeProject(session.user.id, req.params.id!);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  });

  // Multi-Agent Teams
  app.get("/api/core/teams", (_req, res) => {
    res.json({ teams: listTeams() });
  });

  app.get("/api/core/teams/:id", (req, res) => {
    const team = getTeam(req.params.id!);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json({ team });
  });

  app.post("/api/core/teams/:id/assign", (req, res) => {
    const { task } = req.body;
    res.json(assignTaskToTeam(req.params.id!, task ?? ""));
  });

  // Codebase Understanding
  app.get("/api/core/codebase/:projectId", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ model: buildCodebaseModel(session.user.id, req.params.projectId!) });
  });

  app.post("/api/core/codebase/:projectId/explain", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { question } = req.body;
    res.json(
      explainCodebase(session.user.id, req.params.projectId!, question ?? "")
    );
  });

  // Lifecycle
  app.get("/api/core/lifecycle/:projectId", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const managed = getManagedProject(session.user.id, req.params.projectId!);
    res.json({ lifecycle: getLifecycleState(managed?.status) });
  });

  // Testing Engineer
  app.post("/api/core/testing/:projectId", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ results: runTestEngine(session.user.id, req.params.projectId!) });
  });

  // Security Engineer
  app.post("/api/core/security/:projectId", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ scan: runSecurityEngine(session.user.id, req.params.projectId!) });
  });

  // Documentation System
  app.post("/api/core/docs/:projectId", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const studioProjects = listProjects(session.user.id);
    const projectId = req.params.projectId!;
    const studioProject = studioProjects.find((p) => p.id === projectId) ?? studioProjects[0];
    if (!studioProject) return res.status(404).json({ error: "No studio project found" });
    res.json({ docs: maintainDocumentation(session.user.id, studioProject.id) });
  });

  // Simulation
  app.post("/api/core/simulate", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { scenario } = req.body;
    if (!scenario) return res.status(400).json({ error: "scenario required" });
    res.json({ simulation: runSimulation(session.user.id, scenario) });
  });

  app.get("/api/core/simulations", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ simulations: listSimulations(session.user.id) });
  });

  // Knowledge Graph
  app.get("/api/core/graph", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json(buildKnowledgeGraph(session.user.id));
  });

  app.post("/api/core/graph/query", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ answer: queryGraph(session.user.id, req.body.question ?? "") });
  });

  // Natural Language OS
  app.post("/api/core/nlos", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: "command required" });
    res.json({ result: processNaturalLanguageCommand(command) });
  });

  // Marketplace 2.0
  app.get("/api/core/marketplace", (req, res) => {
    const category = req.query.category as string | undefined;
    res.json({
      items: listMarketplace2(category),
      categories: getMarketplaceCategories(),
    });
  });

  // Collaboration
  app.get("/api/core/workspaces", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ workspaces: listWorkspaces(session.user.id) });
  });

  app.post("/api/core/workspaces", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { name, members } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    res.status(201).json({ workspace: createWorkspace(session.user.id, name, members) });
  });

  // Open Agent Protocol
  app.get("/api/core/oap", (_req, res) => {
    res.json(OPEN_AGENT_PROTOCOL);
  });

  app.post("/api/core/oap/validate", (req, res) => {
    res.json(validateAgentManifest(req.body.manifest ?? {}));
  });

  // Community
  app.get("/api/core/community", async (req, res) => {
    const session = await getSession(req);
    if (session?.user) seedCommunityContributions(session.user.id);
    res.json({ contributions: listContributions(req.query.type as never) });
  });

  app.post("/api/core/community", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const contribution = createContribution(session.user.id, req.body);
    res.status(201).json({ contribution });
  });

  // Modes
  app.get("/api/core/modes", (_req, res) => {
    res.json({ modes: listModes() });
  });

  app.get("/api/core/modes/:mode", (req, res) => {
    const mode = getModeConfig(req.params.mode as "beginner" | "developer" | "enterprise");
    res.json({ mode });
  });

  // AI Native File System
  app.get("/api/core/files/:projectId", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ files: indexProjectFiles(session.user.id, req.params.projectId!) });
  });

  app.get("/api/core/files/:projectId/{*filePath}", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const ctx = getFileContext(
      session.user.id,
      req.params.projectId!,
      String(req.params.filePath ?? "")
    );
    res.json({ file: ctx });
  });

  // Desktop app info
  app.get("/api/core/desktop", (_req, res) => {
    res.json({
      available: true,
      planned: false,
      stack: "Tauri",
      url: "/desktop",
      download: "Buselligence-setup.exe",
      capabilities: [
        "Local filesystem access",
        "Terminal & command bridge",
        "GitHub workspace provisioning",
        "Local models & offline mode",
        "Multi-workspace manager",
        "Workspace snapshots",
      ],
    });
  });
}
