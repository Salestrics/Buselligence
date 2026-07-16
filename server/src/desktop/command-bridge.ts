import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { getPermissions, validateCommand } from "./permissions.js";
import { getWorkspace } from "./workspaces.js";

export interface CommandResult {
  id: string;
  command: string;
  status: "pending" | "running" | "completed" | "denied";
  output: string;
  previewUrl?: string;
}

const COMMAND_SIMULATIONS: Record<string, (cmd: string) => string> = {
  "npm install": () => "added 847 packages in 12s",
  "npm run dev": () => "VITE ready → http://localhost:5173\nAPI → http://localhost:3001",
  "npm run build": () => "✓ built in 4.2s",
  "git status": () => "On branch main\nnothing to commit, working tree clean",
  "git pull": () => "Already up to date.",
  "docker compose up": () => "Container buselligence-app Started",
};

function simulateOutput(command: string): { output: string; previewUrl?: string } {
  const lower = command.toLowerCase();
  for (const [pattern, fn] of Object.entries(COMMAND_SIMULATIONS)) {
    if (lower.includes(pattern)) {
      const output = fn(command);
      const previewUrl = lower.includes("dev") || lower.includes("start") ? "http://localhost:3000" : undefined;
      return { output, previewUrl };
    }
  }
  return { output: `Executed: ${command}\nExit code: 0` };
}

export function executeCommand(
  userId: string,
  command: string,
  workspaceId?: string
): CommandResult {
  const perms = getPermissions(userId);
  const validation = validateCommand(command, perms);

  const id = randomUUID();

  if (!validation.allowed) {
    db.prepare(
      `INSERT INTO desktop_command_log (id, workspace_id, user_id, command, status, output)
       VALUES (?, ?, ?, ?, 'denied', ?)`
    ).run(id, workspaceId ?? null, userId, command, validation.reason ?? "Denied");

    return { id, command, status: "denied", output: validation.reason ?? "Permission denied" };
  }

  const ws = workspaceId ? getWorkspace(userId, workspaceId) : null;
  const pm = ws?.intelligence.packageManager ?? "npm";
  const resolved = command.replace(/\{pm\}/g, pm);

  const { output, previewUrl } = simulateOutput(resolved);

  db.prepare(
    `INSERT INTO desktop_command_log (id, workspace_id, user_id, command, status, output)
     VALUES (?, ?, ?, ?, 'completed', ?)`
  ).run(id, workspaceId ?? null, userId, resolved, output);

  return { id, command: resolved, status: "completed", output, previewUrl };
}

export function listCommandLog(userId: string, workspaceId?: string, limit = 20) {
  const rows = (workspaceId
    ? db
        .prepare(
          "SELECT * FROM desktop_command_log WHERE user_id = ? AND workspace_id = ? ORDER BY created_at DESC LIMIT ?"
        )
        .all(userId, workspaceId, limit)
    : db
        .prepare("SELECT * FROM desktop_command_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
        .all(userId, limit)) as Array<{
    id: string;
    command: string;
    status: string;
    output: string | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    command: r.command,
    status: r.status,
    output: r.output ?? "",
    createdAt: r.created_at,
  }));
}

export const LOCAL_TOOLS = [
  { name: "Filesystem", enabled: true, description: "Read and write project files" },
  { name: "Terminal", enabled: true, description: "Execute shell commands" },
  { name: "Git", enabled: true, description: "Version control operations" },
  { name: "Package Manager", enabled: true, description: "npm, pnpm, yarn, cargo, go" },
  { name: "Browser", enabled: true, description: "Preview and test applications" },
  { name: "Database", enabled: true, description: "Local DB connections" },
  { name: "Docker", enabled: true, description: "Container management" },
];
