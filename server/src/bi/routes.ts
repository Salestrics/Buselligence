import type { Express, Request } from "express";
import type { AgentId } from "../agents/definitions.js";
import { listAgents } from "../agents/definitions.js";
import {
  deleteDashboard,
  exportDashboardSpec,
  generateDashboard,
  getDashboard,
  listDashboards,
} from "../dashboards/manager.js";
import {
  createConnector,
  deleteConnector,
  getConnector,
  listConnectorDefinitions,
  listConnectors,
  testConnector,
  updateConnector,
} from "../connectors/manager.js";
import type { DataConnectorInput } from "../connectors/types.js";
import { getEncryptionInfo } from "../crypto/envelope.js";
import { listAuditLogs } from "../governance/audit.js";
import {
  createScheduledJob,
  deleteScheduledJob,
  generateBriefing,
  listBriefings,
  listScheduledJobs,
} from "../intelligence/scheduler.js";
import {
  getMarketplacePreset,
  installMarketplacePreset,
  listMarketplacePresets,
  listUserInstalls,
} from "../marketplace/presets.js";
import {
  createMetric,
  createRelationship,
  createRule,
  deleteMetric,
  deleteRelationship,
  deleteRule,
  explainMetric,
  listMetrics,
  listRelationships,
  listRules,
  seedSemanticLayer,
  updateMetric,
  updateRule,
} from "../semantic/manager.js";
import type {
  SemanticMetricInput,
  SemanticRelationshipInput,
  SemanticRuleInput,
} from "../semantic/types.js";

type GetSession = (req: Request) => Promise<{ user?: { id: string } } | null>;

export function registerBiRoutes(app: Express, getSession: GetSession) {
  app.get("/api/agents", (_req, res) => {
    res.json({ agents: listAgents() });
  });

  app.get("/api/encryption/info", (_req, res) => {
    res.json(getEncryptionInfo());
  });

  // Semantic Layer
  app.get("/api/semantic/context", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { buildSemanticContext } = await import("../semantic/manager.js");
    res.json({ context: buildSemanticContext(session.user.id) });
  });

  app.post("/api/semantic/seed", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ seeded: seedSemanticLayer(session.user.id) });
  });

  app.get("/api/semantic/metrics", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ metrics: listMetrics(session.user.id) });
  });

  app.post("/api/semantic/metrics", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const input = req.body as SemanticMetricInput;
    if (!input?.name || !input?.formula) return res.status(400).json({ error: "name and formula required" });
    res.status(201).json({ metric: createMetric(session.user.id, input) });
  });

  app.put("/api/semantic/metrics/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const metric = updateMetric(req.params.id, session.user.id, req.body);
    if (!metric) return res.status(404).json({ error: "Metric not found" });
    res.json({ metric });
  });

  app.delete("/api/semantic/metrics/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    if (!deleteMetric(req.params.id, session.user.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.get("/api/semantic/metrics/:name/explain", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const explanation = explainMetric(session.user.id, req.params.name);
    if (!explanation) return res.status(404).json({ error: "Metric not found" });
    res.json({ explanation });
  });

  app.get("/api/semantic/relationships", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ relationships: listRelationships(session.user.id) });
  });

  app.post("/api/semantic/relationships", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.status(201).json({ relationship: createRelationship(session.user.id, req.body as SemanticRelationshipInput) });
  });

  app.delete("/api/semantic/relationships/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    if (!deleteRelationship(req.params.id, session.user.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.get("/api/semantic/rules", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ rules: listRules(session.user.id) });
  });

  app.post("/api/semantic/rules", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.status(201).json({ rule: createRule(session.user.id, req.body as SemanticRuleInput) });
  });

  app.put("/api/semantic/rules/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const rule = updateRule(req.params.id, session.user.id, req.body);
    if (!rule) return res.status(404).json({ error: "Not found" });
    res.json({ rule });
  });

  app.delete("/api/semantic/rules/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    if (!deleteRule(req.params.id, session.user.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  // Data Connectors
  app.get("/api/connectors/definitions", (_req, res) => {
    res.json({ definitions: listConnectorDefinitions() });
  });

  app.get("/api/connectors", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ connectors: listConnectors(session.user.id) });
  });

  app.post("/api/connectors", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const input = req.body as DataConnectorInput;
    if (!input?.name || !input?.connectorType) return res.status(400).json({ error: "name and connectorType required" });
    res.status(201).json({ connector: createConnector(session.user.id, input) });
  });

  app.post("/api/connectors/:id/test", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json(await testConnector(req.params.id, session.user.id));
  });

  app.delete("/api/connectors/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    if (!deleteConnector(req.params.id, session.user.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  // Dashboards
  app.get("/api/dashboards", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ dashboards: listDashboards(session.user.id) });
  });

  app.post("/api/dashboards/generate", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const prompt = req.body?.prompt as string;
    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    const dashboard = await generateDashboard(session.user.id, prompt);
    res.status(201).json({ dashboard });
  });

  app.get("/api/dashboards/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const dashboard = getDashboard(req.params.id, session.user.id);
    if (!dashboard) return res.status(404).json({ error: "Not found" });
    res.json({ dashboard });
  });

  app.get("/api/dashboards/:id/export", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const dashboard = getDashboard(req.params.id, session.user.id);
    if (!dashboard) return res.status(404).json({ error: "Not found" });
    const format = (req.query.format as string) ?? "react";
    res.json(exportDashboardSpec(dashboard, format));
  });

  app.delete("/api/dashboards/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    if (!deleteDashboard(req.params.id, session.user.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  // Governance
  app.get("/api/governance/audit", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ logs: listAuditLogs(session.user.id) });
  });

  // Marketplace
  app.get("/api/marketplace", (req, res) => {
    res.json({
      presets: listMarketplacePresets(req.query.category as string | undefined),
    });
  });

  app.get("/api/marketplace/installs", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ installs: listUserInstalls(session.user.id) });
  });

  app.post("/api/marketplace/:presetId/install", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    try {
      const result = installMarketplacePreset(session.user.id, req.params.presetId, req.body?.config);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Install failed" });
    }
  });

  // Scheduled Intelligence
  app.get("/api/intelligence/jobs", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ jobs: listScheduledJobs(session.user.id) });
  });

  app.post("/api/intelligence/jobs", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.status(201).json({ job: createScheduledJob(session.user.id, req.body) });
  });

  app.delete("/api/intelligence/jobs/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    if (!deleteScheduledJob(req.params.id, session.user.id)) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.get("/api/intelligence/briefings", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ briefings: listBriefings(session.user.id) });
  });

  app.post("/api/intelligence/briefings/generate", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const briefing = await generateBriefing(session.user.id, req.body?.jobId);
    res.status(201).json({ briefing });
  });
}
