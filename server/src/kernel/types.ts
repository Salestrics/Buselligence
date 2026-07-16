export interface KernelIdentity {
  userId: string;
  sessionId?: string;
  mode: "beginner" | "developer" | "enterprise";
}

export interface KernelContext {
  projectId?: string;
  intent?: string;
  environment: Record<string, unknown>;
}

export interface KernelPermissions {
  granted: string[];
  denied: string[];
}

export interface KernelExecutionRequest {
  action: string;
  input: Record<string, unknown>;
  agentId?: string;
  skillIds?: string[];
  model?: string;
}

export interface KernelExecutionResult {
  traceId: string;
  output: unknown;
  status: "completed" | "failed";
  durationMs: number;
  costUsd?: number;
  spans: TraceSpan[];
}

export interface TraceSpan {
  id: string;
  name: string;
  type: "planner" | "agent" | "tool" | "model" | "skill" | "kernel";
  input?: unknown;
  output?: unknown;
  durationMs?: number;
  status: "ok" | "error";
}

export interface BuselligenceLock {
  version: string;
  models: Record<string, string>;
  agents: Record<string, string>;
  skills: Record<string, string>;
  mcpServers: string[];
  dependencies: Record<string, string>;
  generatedAt: string;
}

export interface KernelState {
  identity: KernelIdentity;
  context: KernelContext;
  permissions: KernelPermissions;
  memory: Array<{ key: string; value: string }>;
  tools: string[];
  agents: string[];
  models: string[];
  events: string[];
  execution: { status: string; lastAction?: string };
}

export const KERNEL_SUBSYSTEMS = [
  "identity",
  "context",
  "permissions",
  "memory",
  "tools",
  "agents",
  "models",
  "events",
  "execution",
] as const;

export const KERNEL_PRIMITIVE =
  "The open-source runtime for building, running, and extending AI-powered applications.";
