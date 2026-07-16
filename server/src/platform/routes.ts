import type { Express, Request } from "express";
import {
  buildKnowledgeContext,
  createKnowledge,
  deleteKnowledge,
  listKnowledge,
} from "../knowledge/manager.js";
import {
  getOrCreateProfile,
  listLearningSessions,
  startLearningSession,
  updateProfile,
  LEARNING_SYSTEM_PROMPT,
} from "../learning/manager.js";
import { listProjects } from "../studio/manager.js";
import { listConversations } from "../db.js";
import { listAgents } from "../agents/definitions.js";
import { listAutomations } from "../studio/automation.js";
import { listConnectors } from "../connectors/manager.js";
import { listPackages, listUserPackageInstalls } from "../studio/packages.js";

type GetSession = (req: Request) => Promise<{ user?: { id: string } } | null>;

export function registerPlatformRoutes(app: Express, getSession: GetSession) {
  app.get("/api/platform/manifesto", (_req, res) => {
    res.json({
      tagline: "AI for Everyone. Owned by Everyone.",
      mission: "Give every person the power of AI.",
      category: "Open AI Empowerment Platform",
      philosophy: [
        "Open models",
        "Open protocols",
        "Open source",
        "User-owned data",
        "User-controlled AI",
      ],
      manifesto:
        "AI is the greatest tool humanity has ever created. It should not be limited to corporations, engineers, or those who can afford expensive software. Buselligence exists to put the power of AI into the hands of everyone — enabling anyone to learn, create, build, automate, and achieve more.",
    });
  });

  app.get("/api/platform/pillars", (_req, res) => {
    res.json({
      primary: [
        { id: "learn", name: "Learn", description: "AI that teaches, adapts, and grows with you" },
        { id: "create", name: "Create", description: "Documents, designs, presentations, and media" },
        { id: "analyze", name: "Analyze", description: "Data intelligence across any source" },
        { id: "build", name: "Build", description: "Apps, automations, and software without barriers" },
      ],
      capabilities: [
        { id: "code", name: "Code", description: "AI-native developer studio" },
        { id: "data", name: "Data", description: "Connect and understand any data" },
        { id: "automate", name: "Automate", description: "Workflows, triggers, and agents" },
        { id: "agents", name: "Agents", description: "Specialized AI workers for every task" },
      ],
    });
  });

  app.get("/api/workspace", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });

    const userId = session.user.id;
    const [conversations, projects, knowledge, automations, connectors, agents, packages] =
      await Promise.all([
        Promise.resolve(listConversations(userId)),
        Promise.resolve(listProjects(userId)),
        Promise.resolve(listKnowledge(userId)),
        Promise.resolve(listAutomations(userId)),
        Promise.resolve(listConnectors(userId)),
        Promise.resolve(listAgents()),
        Promise.resolve(listPackages()),
      ]);

    const installed = listUserPackageInstalls(userId);
    const learningProfile = getOrCreateProfile(userId);
    const learningSessions = listLearningSessions(userId);

    res.json({
      workspace: {
        conversations: { count: conversations.length, href: "/chat" },
        documents: { count: knowledge.length, href: "/workspace#knowledge" },
        projects: { count: projects.length, href: "/studio" },
        applications: { count: projects.length, href: "/studio" },
        automations: { count: automations.length, href: "/studio" },
        dataSources: { count: connectors.length, href: "/platform" },
        agents: { count: agents.length, href: "/chat" },
        knowledgeBase: { count: knowledge.length, href: "/workspace#knowledge" },
      },
      stats: {
        conversations: conversations.length,
        projects: projects.length,
        knowledge: knowledge.length,
        automations: automations.length,
        connectors: connectors.length,
        agents: agents.length,
        installedPackages: installed.length,
      },
      learningProfile,
      learningSessions,
    });
  });

  // Knowledge Engine
  app.get("/api/knowledge", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ items: listKnowledge(session.user.id) });
  });

  app.post("/api/knowledge", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const item = createKnowledge(session.user.id, req.body);
    res.status(201).json({ item });
  });

  app.delete("/api/knowledge/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ deleted: deleteKnowledge(session.user.id, req.params.id!) });
  });

  app.get("/api/knowledge/context", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ context: buildKnowledgeContext(session.user.id) });
  });

  // Learning System
  app.get("/api/learning/profile", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ profile: getOrCreateProfile(session.user.id) });
  });

  app.put("/api/learning/profile", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ profile: updateProfile(session.user.id, req.body) });
  });

  app.post("/api/learning/sessions", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { topic, level } = req.body;
    if (!topic) return res.status(400).json({ error: "topic required" });
    const learningSession = startLearningSession(session.user.id, topic, level);
    res.status(201).json({ session: learningSession });
  });

  app.get("/api/learning/sessions", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ sessions: listLearningSessions(session.user.id) });
  });

  app.get("/api/learning/prompt", (_req, res) => {
    res.json({ prompt: LEARNING_SYSTEM_PROMPT });
  });
}
