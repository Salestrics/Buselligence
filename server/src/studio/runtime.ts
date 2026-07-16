export type RuntimeType = "react" | "node" | "python" | "sql_notebook";

export interface RuntimeSession {
  id: string;
  projectId: string;
  type: RuntimeType;
  status: "starting" | "running" | "stopped" | "error";
  url?: string;
  logs: string[];
  startedAt: string;
}

const sessions = new Map<string, RuntimeSession>();

export function startRuntime(
  projectId: string,
  type: RuntimeType
): RuntimeSession {
  const id = `runtime-${projectId}-${Date.now()}`;
  const session: RuntimeSession = {
    id,
    projectId,
    type,
    status: "starting",
    logs: [`Starting ${type} runtime...`],
    startedAt: new Date().toISOString(),
  };

  setTimeout(() => {
    session.status = "running";
    session.url = `/preview/${projectId}`;
    session.logs.push(`${type} runtime ready`);
    session.logs.push("Frontend: http://localhost:4000");
    session.logs.push("Backend: http://localhost:4001");
    session.logs.push("Database: postgresql://localhost:5432/studio");
  }, 500);

  sessions.set(id, session);
  return session;
}

export function getRuntime(sessionId: string): RuntimeSession | null {
  return sessions.get(sessionId) ?? null;
}

export function stopRuntime(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  session.status = "stopped";
  session.logs.push("Runtime stopped");
  return true;
}

export function getRuntimeForProject(projectId: string): RuntimeSession | null {
  for (const session of sessions.values()) {
    if (session.projectId === projectId && session.status === "running") {
      return session;
    }
  }
  return null;
}

export interface SandboxCapabilities {
  frontend: boolean;
  backend: boolean;
  database: boolean;
  aiAgents: boolean;
  supported: RuntimeType[];
}

export function getSandboxCapabilities(): SandboxCapabilities {
  return {
    frontend: true,
    backend: true,
    database: true,
    aiAgents: true,
    supported: ["react", "node", "python", "sql_notebook"],
  };
}
