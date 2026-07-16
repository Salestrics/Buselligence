import type { Express, Request } from "express";
import { buildApp } from "./app-builder.js";
import { reviewCode, CODE_REVIEW_AGENT_PROMPT } from "./code-review.js";
import {
  createAutomation,
  deleteAutomation,
  getAutomationTemplate,
  listAutomations,
} from "./automation.js";
import {
  executeQuery,
  generateQuery,
  getSchemaExplorer,
  listQueryHistory,
} from "./database-studio.js";
import { deployProject, getDeployment, listDeployments } from "./deployment.js";
import { generateDesign } from "./design.js";
import { generateDocs } from "./docs-generator.js";
import {
  buildEngineerContext,
  generateEngineerPlan,
  generateEngineerPlanWithLlm,
  SOFTWARE_ENGINEER_PROMPT,
} from "./engineer.js";
import {
  aiCommit,
  createBranch,
  createCommit,
  getDefaultBranch,
  listCommits,
} from "./git.js";
import {
  createFile,
  createProject,
  deleteFile,
  deleteProject,
  getFile,
  getFileTree,
  getProject,
  listBranches,
  listFiles,
  listProjects,
  searchFiles,
  updateFile,
} from "./manager.js";
import { installPackage, listPackages, listUserPackageInstalls } from "./packages.js";
import {
  getRuntime,
  getRuntimeForProject,
  getSandboxCapabilities,
  startRuntime,
  stopRuntime,
} from "./runtime.js";
import type { FileLanguage } from "./types.js";

type GetSession = (req: Request) => Promise<{ user?: { id: string } } | null>;

export function registerStudioRoutes(app: Express, getSession: GetSession) {
  // Projects
  app.get("/api/studio/projects", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ projects: listProjects(session.user.id) });
  });

  app.post("/api/studio/projects", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { name, description, projectType, stack } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const project = createProject(session.user.id, { name, description, projectType, stack });
    res.status(201).json({ project });
  });

  app.get("/api/studio/projects/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const project = getProject(session.user.id, req.params.id!);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  });

  app.delete("/api/studio/projects/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const ok = deleteProject(session.user.id, req.params.id!);
    res.json({ deleted: ok });
  });

  // Files
  app.get("/api/studio/projects/:id/files", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({
      files: listFiles(session.user.id, req.params.id!),
      tree: getFileTree(session.user.id, req.params.id!),
    });
  });

  app.get("/api/studio/projects/:id/files/{*filePath}", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const filePath = String(req.params.filePath ?? "");
    const file = getFile(session.user.id, req.params.id!, filePath);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json({ file });
  });

  app.put("/api/studio/projects/:id/files/{*filePath}", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const filePath = String(req.params.filePath ?? "");
    const { content } = req.body;
    const file = updateFile(session.user.id, req.params.id!, filePath, content);
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json({ file });
  });

  app.post("/api/studio/projects/:id/files", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { path: filePath, content, language } = req.body;
    if (!filePath) return res.status(400).json({ error: "path required" });
    const file = createFile(
      session.user.id,
      req.params.id!,
      filePath,
      content ?? "",
      (language as FileLanguage) ?? "typescript"
    );
    res.status(201).json({ file });
  });

  app.delete("/api/studio/projects/:id/files/{*filePath}", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const ok = deleteFile(session.user.id, req.params.id!, String(req.params.filePath ?? ""));
    res.json({ deleted: ok });
  });

  app.get("/api/studio/projects/:id/search", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const q = String(req.query.q ?? "");
    res.json({ results: searchFiles(session.user.id, req.params.id!, q) });
  });

  // Git
  app.get("/api/studio/projects/:id/git/branches", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ branches: listBranches(session.user.id, req.params.id!) });
  });

  app.post("/api/studio/projects/:id/git/branches", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    res.status(201).json({ branch: createBranch(session.user.id, req.params.id!, name) });
  });

  app.get("/api/studio/projects/:id/git/commits", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ commits: listCommits(session.user.id, req.params.id!) });
  });

  app.post("/api/studio/projects/:id/git/commits", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { message } = req.body;
    const branch = getDefaultBranch(session.user.id, req.params.id!);
    if (!branch) return res.status(400).json({ error: "No default branch" });
    const commit = createCommit(session.user.id, req.params.id!, branch.id, message ?? "Update");
    res.status(201).json({ commit });
  });

  // AI Engineer
  app.post("/api/studio/projects/:id/engineer", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { requirement } = req.body;
    if (!requirement) return res.status(400).json({ error: "requirement required" });

    const context = buildEngineerContext(session.user.id, req.params.id!, requirement);
    const plan = await generateEngineerPlanWithLlm(
      session.user.id,
      req.params.id!,
      requirement
    );

    for (const file of plan.files) {
      const existing = getFile(session.user.id, req.params.id!, file.path);
      if (existing) {
        updateFile(session.user.id, req.params.id!, file.path, file.content);
      } else {
        createFile(session.user.id, req.params.id!, file.path, file.content, file.language);
      }
    }

    const branch = getDefaultBranch(session.user.id, req.params.id!);
    let commit = null;
    if (branch) {
      commit = aiCommit(
        session.user.id,
        req.params.id!,
        `AI: ${plan.summary}`,
        plan.files.map((f) => ({ path: f.path, additions: f.content.split("\n").length, deletions: 0 }))
      );
    }

    res.json({ context: context.slice(0, 500), plan, commit });
  });

  app.get("/api/studio/engineer/prompt", (_req, res) => {
    res.json({ prompt: SOFTWARE_ENGINEER_PROMPT });
  });

  // Code Review
  app.post("/api/studio/projects/:id/review", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const files = listFiles(session.user.id, req.params.id!);
    const review = reviewCode(files.map((f) => ({ path: f.path, content: f.content })));
    res.json({ review, agentPrompt: CODE_REVIEW_AGENT_PROMPT });
  });

  // App Builder
  app.post("/api/studio/app-builder", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt required" });
    res.json({ result: buildApp(prompt) });
  });

  // Runtime
  app.get("/api/studio/runtime/capabilities", (_req, res) => {
    res.json(getSandboxCapabilities());
  });

  app.post("/api/studio/projects/:id/runtime", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { type } = req.body;
    const session_ = startRuntime(req.params.id!, type ?? "react");
    res.status(201).json({ runtime: session_ });
  });

  app.get("/api/studio/projects/:id/runtime", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ runtime: getRuntimeForProject(req.params.id!) });
  });

  app.delete("/api/studio/runtime/:sessionId", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ stopped: stopRuntime(req.params.sessionId!) });
  });

  // Database Studio
  app.get("/api/studio/database/schema", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ schema: getSchemaExplorer() });
  });

  app.post("/api/studio/database/generate-query", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { prompt } = req.body;
    res.json({ query: generateQuery(prompt ?? "") });
  });

  app.post("/api/studio/database/execute", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { query, connectorId } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });
    res.json(executeQuery(session.user.id, query, connectorId));
  });

  app.get("/api/studio/database/history", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ history: listQueryHistory(session.user.id) });
  });

  // Automations
  app.get("/api/studio/automations", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ automations: listAutomations(session.user.id) });
  });

  app.post("/api/studio/automations", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const automation = createAutomation(session.user.id, req.body);
    res.status(201).json({ automation });
  });

  app.delete("/api/studio/automations/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ deleted: deleteAutomation(session.user.id, req.params.id!) });
  });

  app.get("/api/studio/automations/templates/:type", (req, res) => {
    const template = getAutomationTemplate(
      req.params.type as "salesforce_lead" | "cron" | "webhook"
    );
    res.json({ template });
  });

  // Deployment
  app.post("/api/studio/projects/:id/deploy", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const deployment = deployProject(session.user.id, req.params.id!, req.body);
    res.status(201).json({ deployment });
  });

  app.get("/api/studio/projects/:id/deployments", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ deployments: listDeployments(session.user.id, req.params.id!) });
  });

  app.get("/api/studio/deployments/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const deployment = getDeployment(session.user.id, req.params.id!);
    if (!deployment) return res.status(404).json({ error: "Deployment not found" });
    res.json({ deployment });
  });

  // Docs Generator
  app.post("/api/studio/projects/:id/docs", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const project = getProject(session.user.id, req.params.id!);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ docs: generateDocs(project, session.user.id) });
  });

  // Design Studio
  app.post("/api/studio/design", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { prompt } = req.body;
    res.json({ design: generateDesign(prompt ?? "") });
  });

  // Package Marketplace
  app.get("/api/studio/marketplace", async (req, res) => {
    const session = await getSession(req);
    const category = req.query.category as string | undefined;
    const packages = listPackages(category);
    const installed = session?.user ? listUserPackageInstalls(session.user.id) : [];
    res.json({ packages, installed });
  });

  app.post("/api/studio/marketplace/:id/install", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const result = installPackage(session.user.id, req.params.id!);
    res.json(result);
  });
}
