import type { Express, Request } from "express";
import { getBuild, listBuilds, runGenesisBuild, startBuild } from "./engine.js";

type GetSession = (req: Request) => Promise<{ user?: { id: string } } | null>;

export function registerGenesisRoutes(app: Express, getSession: GetSession) {
  app.get("/api/genesis", (_req, res) => {
    res.json({
      name: "Build Anything Mode",
      tagline: "Describe it. Watch it come alive.",
      subtitle: "From idea to application in minutes.",
      engine: "AI Project Genesis Engine",
    });
  });

  app.get("/api/genesis/builds", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    res.json({ builds: listBuilds(session.user.id) });
  });

  app.post("/api/genesis/build", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ error: "prompt required" });
    const build = startBuild(session.user.id, prompt.trim());
    res.status(201).json({ build });
  });

  app.get("/api/genesis/builds/:id", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) return res.status(401).json({ error: "Authentication required" });
    const build = getBuild(session.user.id, req.params.id!);
    if (!build) return res.status(404).json({ error: "Build not found" });
    res.json({ build });
  });

  app.get("/api/genesis/builds/:id/stream", async (req, res) => {
    const session = await getSession(req);
    if (!session?.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const buildId = req.params.id!;
    const build = getBuild(session.user.id, buildId);
    if (!build) {
      res.status(404).json({ error: "Build not found" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
      if (build.status === "completed") {
        res.write(`data: ${JSON.stringify({ type: "complete", message: "Already complete", progress: 100 })}\n\n`);
        res.end();
        return;
      }

      for await (const event of runGenesisBuild(session.user.id, buildId)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === "complete") break;
      }

      const finalBuild = getBuild(session.user.id, buildId);
      res.write(`data: ${JSON.stringify({ type: "build", build: finalBuild })}\n\n`);
    } catch (err) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: err instanceof Error ? err.message : "Build failed" })}\n\n`
      );
    }

    res.end();
  });
}
