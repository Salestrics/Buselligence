import { randomUUID } from "node:crypto";
import { listAgents } from "../agents/definitions.js";
import { buildCoreContextPrompt, getMemoryEngine, storeMemory } from "../core/runtime.js";
import { completeWithOptionalCredentials } from "../llm/complete.js";
import { listMcpServers } from "../mcp/manager.js";
import { routeModel } from "../router/model-router.js";
import { getOrCreateProfile } from "../learning/manager.js";
import type {
  KernelContext,
  KernelExecutionRequest,
  KernelExecutionResult,
  KernelIdentity,
  KernelPermissions,
  KernelState,
  TraceSpan,
} from "./types.js";
import { startTrace, completeTrace } from "./observability.js";
import { recordCost, estimateCost } from "./cost.js";
import { getInstalledSkills, resolveSkills } from "./skills.js";
import { getAgentFromRegistry } from "./registry.js";

export function buildKernelState(userId: string, projectId?: string): KernelState {
  const profile = getOrCreateProfile(userId);
  const mode =
    profile.level === "beginner"
      ? "beginner"
      : profile.level === "expert"
        ? "developer"
        : "developer";

  const memory = getMemoryEngine(userId, projectId).map((m) => ({
    key: m.key,
    value: m.value,
  }));

  const mcp = listMcpServers(userId);
  const agents = listAgents().map((a) => a.id);
  const skills = getInstalledSkills(userId).map((s) => s.slug);

  return {
    identity: { userId, mode },
    context: {
      projectId,
      environment: { nodeEnv: process.env.NODE_ENV ?? "development" },
    },
    permissions: resolvePermissions(userId),
    memory,
    tools: [
      "code_generation",
      "data_query",
      "deployment",
      "testing",
      "security_scan",
      ...mcp.map((s) => `mcp:${s.name}`),
      ...skills.map((s) => `skill:${s}`),
    ],
    agents,
    models: ["openai", "anthropic", "google", "local"],
    events: [],
    execution: { status: "idle" },
  };
}

function resolvePermissions(userId: string): KernelPermissions {
  return {
    granted: ["read", "write", "execute", "deploy", "read:repository", "run:tests"],
    denied: [],
  };
}

export async function kernelExecute(
  userId: string,
  request: KernelExecutionRequest,
  context?: KernelContext
): Promise<KernelExecutionResult> {
  const start = Date.now();
  const traceId = startTrace(userId, request.action, request.input);

  const spans: TraceSpan[] = [];
  const route = routeModel(request.action);

  spans.push({
    id: randomUUID(),
    name: "Kernel Planner",
    type: "planner",
    input: request,
    output: { route, plan: ["resolve_skills", "check_permissions", "execute", "record_cost"] },
    status: "ok",
  });

  if (request.agentId) {
    const agent = getAgentFromRegistry(request.agentId) ?? { name: request.agentId, version: "1.0.0" };
    spans.push({
      id: randomUUID(),
      name: `Agent: ${agent.name}`,
      type: "agent",
      input: { agentId: request.agentId, version: agent.version },
      status: "ok",
    });
  }

  const skills = resolveSkills(userId, request.skillIds);
  for (const skill of skills) {
    spans.push({
      id: randomUUID(),
      name: `Skill: ${skill.name}`,
      type: "skill",
      input: { slug: skill.slug },
      output: { executed: true },
      status: "ok",
    });
  }

  spans.push({
    id: randomUUID(),
    name: `Model: ${route.model}`,
    type: "model",
    input: { provider: route.provider, model: route.model, reason: route.reason },
    output: { response: `Executed via ${route.provider}/${route.model}` },
    durationMs: 120,
    status: "ok",
  });

  const durationMs = Date.now() - start;
  const tokensIn = Math.ceil(JSON.stringify(request.input).length / 4);
  const tokensOut = 500;
  const costUsd = estimateCost(route.provider, route.model, tokensIn, tokensOut);

  recordCost(userId, request.action, route.model, tokensIn, tokensOut, costUsd);

  storeMemory(userId, `last_action:${request.action}`, JSON.stringify(request.input).slice(0, 200), "context");

  const llm = await completeWithOptionalCredentials(
    userId,
    "You are the Buselligence Kernel planner. Summarize the execution outcome in one sentence.",
    JSON.stringify({ action: request.action, input: request.input }),
    () => `Kernel executed: ${request.action}`
  );

  const output = {
    action: request.action,
    result: llm.text,
    skillsUsed: skills.map((s) => s.slug),
    model: llm.simulated ? route.model : llm.model,
    provider: llm.simulated ? route.provider : llm.provider,
    simulated: llm.simulated,
    context: context?.projectId ? buildCoreContextPrompt(userId, context.projectId).slice(0, 500) : undefined,
  };

  spans.push({
    id: randomUUID(),
    name: "Final Output",
    type: "kernel",
    output,
    durationMs,
    status: "ok",
  });

  completeTrace(traceId, spans, durationMs);

  return {
    traceId,
    output,
    status: "completed",
    durationMs,
    costUsd,
    spans,
  };
}

export function getKernelInfo() {
  return {
    name: "Buselligence Kernel",
    version: "1.0.0",
    primitive:
      "The open-source runtime for building, running, and extending AI-powered applications.",
    subsystems: [
      "identity",
      "context",
      "permissions",
      "memory",
      "tools",
      "agents",
      "models",
      "events",
      "execution",
    ],
    goal: "Any feature can become AI-capable automatically.",
  };
}
