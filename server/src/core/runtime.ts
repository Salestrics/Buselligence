import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { listProjects } from "../studio/manager.js";
import { listMcpServers } from "../mcp/manager.js";
import { buildKnowledgeContext } from "../knowledge/manager.js";

export interface RuntimeState {
  context: ContextSnapshot;
  memory: MemoryEntry[];
  reasoning: ReasoningResult | null;
  planning: PlanResult | null;
  execution: ExecutionState;
}

export interface ContextSnapshot {
  currentProject: string | null;
  userIntent: string | null;
  availableTools: string[];
  permissions: string[];
  pastDecisions: Array<{ decision: string; createdAt: string }>;
  environmentState: Record<string, unknown>;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  memoryType: string;
  scope: string;
}

export interface ReasoningResult {
  analysis: string;
  conclusions: string[];
  confidence: number;
}

export interface PlanResult {
  goal: string;
  steps: Array<{ id: string; action: string; status: string }>;
  estimatedDuration: string;
}

export interface ExecutionState {
  status: "idle" | "running" | "completed" | "failed";
  currentStep: string | null;
  completedSteps: number;
  totalSteps: number;
}

export function getContextEngine(userId: string, projectId?: string): ContextSnapshot {
  const projects = listProjects(userId);
  const mcpServers = listMcpServers(userId);
  const decisions = db
    .prepare(
      "SELECT decision, created_at FROM core_decisions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10"
    )
    .all(userId) as Array<{ decision: string; created_at: string }>;

  const current = projectId
    ? projects.find((p) => p.id === projectId)
    : projects[0];

  return {
    currentProject: current?.name ?? null,
    userIntent: null,
    availableTools: [
      "code_generation",
      "data_query",
      "deployment",
      "testing",
      "security_scan",
      "documentation",
      "simulation",
      ...mcpServers.map((s) => `mcp:${s.name}`),
    ],
    permissions: ["read", "write", "execute", "deploy"],
    pastDecisions: decisions.map((d) => ({
      decision: d.decision,
      createdAt: d.created_at,
    })),
    environmentState: {
      projects: projects.length,
      mcpServers: mcpServers.length,
      mode: process.env.NODE_ENV ?? "development",
    },
  };
}

export function getMemoryEngine(userId: string, scopeId?: string): MemoryEntry[] {
  const query = scopeId
    ? "SELECT * FROM core_memory WHERE user_id = ? AND scope_id = ? ORDER BY updated_at DESC"
    : "SELECT * FROM core_memory WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50";
  const rows = (scopeId
    ? db.prepare(query).all(userId, scopeId)
    : db.prepare(query).all(userId)) as Array<{
    id: string;
    key: string;
    value: string;
    memory_type: string;
    scope: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    value: r.value,
    memoryType: r.memory_type,
    scope: r.scope,
  }));
}

export function storeMemory(
  userId: string,
  key: string,
  value: string,
  memoryType = "fact",
  scopeId?: string
): MemoryEntry {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO core_memory (id, user_id, scope, scope_id, key, value, memory_type) VALUES (?, ?, 'project', ?, ?, ?, ?)`
  ).run(id, userId, scopeId ?? null, key, value, memoryType);
  return { id, key, value, memoryType, scope: "project" };
}

export function runReasoningEngine(intent: string, context: ContextSnapshot): ReasoningResult {
  return {
    analysis: `Analyzing intent: "${intent}" in context of project "${context.currentProject ?? "none"}" with ${context.availableTools.length} tools available.`,
    conclusions: [
      "User goal requires planning and multi-step execution",
      `Past decisions (${context.pastDecisions.length}) inform approach`,
      "MCP tools available for data and external integrations",
    ],
    confidence: 0.87,
  };
}

export function runPlanningEngine(goal: string, reasoning: ReasoningResult): PlanResult {
  const steps = [
    { id: "1", action: "Gather requirements and constraints", status: "pending" },
    { id: "2", action: "Analyze codebase and dependencies", status: "pending" },
    { id: "3", action: "Design architecture changes", status: "pending" },
    { id: "4", action: "Implement changes", status: "pending" },
    { id: "5", action: "Run tests and security review", status: "pending" },
    { id: "6", action: "Deploy and monitor", status: "pending" },
  ];

  if (goal.toLowerCase().includes("crm") || goal.toLowerCase().includes("saas")) {
    steps.splice(1, 0, { id: "1b", action: "Design multi-tenant database schema", status: "pending" });
  }

  return {
    goal,
    steps,
    estimatedDuration: `${steps.length * 2}-${steps.length * 4} hours`,
  };
}

export function runExecutionEngine(plan: PlanResult): ExecutionState {
  return {
    status: "idle",
    currentStep: plan.steps[0]?.action ?? null,
    completedSteps: 0,
    totalSteps: plan.steps.length,
  };
}

export function getRuntimeState(userId: string, projectId?: string, intent?: string): RuntimeState {
  const context = getContextEngine(userId, projectId);
  if (intent) context.userIntent = intent;
  const memory = getMemoryEngine(userId, projectId);
  const reasoning = intent ? runReasoningEngine(intent, context) : null;
  const planning = intent && reasoning ? runPlanningEngine(intent, reasoning) : null;
  const execution = planning
    ? runExecutionEngine(planning)
    : { status: "idle" as const, currentStep: null, completedSteps: 0, totalSteps: 0 };

  return { context, memory, reasoning, planning, execution };
}

export function buildCoreContextPrompt(userId: string, projectId?: string): string {
  const knowledge = buildKnowledgeContext(userId);
  const runtime = getRuntimeState(userId, projectId);

  return [
    "## Buselligence Core — AI Runtime Context",
    `Project: ${runtime.context.currentProject ?? "none"}`,
    `Tools: ${runtime.context.availableTools.join(", ")}`,
    `Permissions: ${runtime.context.permissions.join(", ")}`,
    "",
    "## Memory",
    runtime.memory.slice(0, 10).map((m) => `- ${m.key}: ${m.value}`).join("\n") || "No stored memory",
    "",
    "## Knowledge Base",
    knowledge,
    "",
    "## Past Decisions",
    runtime.context.pastDecisions.map((d) => `- ${d.decision}`).join("\n") || "None recorded",
  ].join("\n");
}
