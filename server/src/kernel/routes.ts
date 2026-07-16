import type { Express, Request } from "express";
import { analyzeTaskCost, getCostSummary } from "./cost.js";
import { getCommunityHubSummary, listCommunityItems } from "./community.js";
import { runEvaluation, listEvaluations, getBenchmarks } from "./evaluation.js";
import { EXTENSION_SDK, listExtensions, registerExtension } from "./extensions.js";
import { buildKernelState, getKernelInfo, kernelExecute } from "./kernel.js";
import { generateLockfile, getLockfile } from "./lockfile.js";
import { getLocalFirstConfig, LOCAL_FIRST_MESSAGE } from "./local.js";
import { getTrace, listTraces } from "./observability.js";
import { createPrompt, getDefaultPromptWorkspace, listPrompts } from "./prompts.js";
import { getAgentFromRegistry, listRegisteredAgents } from "./registry.js";
import { installSkill, listSkills, getInstalledSkills } from "./skills.js";
import { getTemplate, listTemplates } from "./templates.js";
import { KERNEL_PRIMITIVE } from "./types.js";

type GetSession = (req: Request) => Promise<{ user?: { id: string } } | null>;

export function registerKernelRoutes(app: Express, getSession: GetSession) {
  app.get("/api/kernel", (_req, res) => {
    res.json({ ...getKernelInfo(), primitive: KERNEL_PRIMITIVE });
  });

  app.get("/api/kernel/state", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { projectId } = req.query;
    res.json({ state: buildKernelState(session.user.id, projectId as string | undefined) });
  });

  app.post("/api/kernel/execute", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { action, input, agentId, skillIds, projectId } = req.body;
    if (!action) return res.status(400).json({ error: "action required" });
    const result = await kernelExecute(
      session.user.id,
      { action, input: input ?? {}, agentId, skillIds },
      { projectId, environment: {} }
    );
    res.json({ result });
  });

  // Skills
  app.get("/api/kernel/skills", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({
      skills: listSkills(),
      installed: getInstalledSkills(session.user.id),
    });
  });

  app.post("/api/kernel/skills/:id/install", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    installSkill(session.user.id, req.params.id!);
    res.json({ installed: true, skills: getInstalledSkills(session.user.id) });
  });

  // Agent Registry
  app.get("/api/kernel/registry", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ agents: listRegisteredAgents() });
  });

  app.get("/api/kernel/registry/:slug", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const agent = getAgentFromRegistry(req.params.slug!);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json({ agent });
  });

  // Evaluation
  app.get("/api/kernel/evaluations", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({
      evaluations: listEvaluations(session.user.id),
      benchmarks: getBenchmarks(),
    });
  });

  app.post("/api/kernel/evaluations", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { agentSlug, task } = req.body;
    if (!agentSlug || !task) return res.status(400).json({ error: "agentSlug and task required" });
    res.json({ evaluation: runEvaluation(session.user.id, agentSlug, task) });
  });

  // Prompt workspace
  app.get("/api/kernel/prompts", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { type } = req.query;
    const prompts = listPrompts(session.user.id, type as string | undefined);
    res.json({
      prompts: prompts.length ? prompts : getDefaultPromptWorkspace(session.user.id),
      workspace: "IDE for AI behavior",
    });
  });

  app.post("/api/kernel/prompts", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { name, promptType, content, metadata } = req.body;
    if (!name || !promptType || !content) {
      return res.status(400).json({ error: "name, promptType, and content required" });
    }
    res.status(201).json({
      prompt: createPrompt(session.user.id, { name, promptType, content, metadata }),
    });
  });

  // Observability
  app.get("/api/kernel/traces", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ traces: listTraces(session.user.id) });
  });

  app.get("/api/kernel/traces/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const trace = getTrace(req.params.id!, session.user.id);
    if (!trace) return res.status(404).json({ error: "Trace not found" });
    res.json({ trace });
  });

  // Cost intelligence
  app.get("/api/kernel/costs", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ costs: getCostSummary(session.user.id) });
  });

  app.post("/api/kernel/costs/analyze", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { task, model } = req.body;
    res.json({ analysis: analyzeTaskCost(task ?? "Generate application", model) });
  });

  // Lockfile
  app.get("/api/kernel/lockfile", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { projectId } = req.query;
    const lock = getLockfile(session.user.id, projectId as string | undefined);
    res.json({ lock, filename: "buselligence.lock" });
  });

  app.post("/api/kernel/lockfile", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { projectId } = req.body;
    const lock = generateLockfile(session.user.id, projectId);
    res.json({ lock, filename: "buselligence.lock" });
  });

  // Extension SDK
  app.get("/api/kernel/sdk", (_req, res) => {
    res.json({ sdk: EXTENSION_SDK });
  });

  app.get("/api/kernel/extensions", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ extensions: listExtensions(session.user.id) });
  });

  app.post("/api/kernel/extensions", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    try {
      const extension = registerExtension(session.user.id, req.body);
      res.status(201).json({ extension });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Invalid extension" });
    }
  });

  // Templates
  app.get("/api/kernel/templates", (_req, res) => {
    res.json({ templates: listTemplates() });
  });

  app.get("/api/kernel/templates/:slug", (req, res) => {
    const template = getTemplate(req.params.slug!);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json({ template });
  });

  // Local-first
  app.get("/api/kernel/local", (_req, res) => {
    res.json({ config: getLocalFirstConfig(), message: LOCAL_FIRST_MESSAGE });
  });

  // Community hub
  app.get("/api/kernel/community", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { type } = req.query;
    res.json({
      hub: getCommunityHubSummary(),
      items: listCommunityItems(type as string | undefined),
    });
  });
}
