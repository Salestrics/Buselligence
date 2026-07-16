import { randomUUID } from "node:crypto";
import { db } from "../db.js";

export interface AIPermissions {
  readFiles: boolean;
  modifyFiles: boolean;
  runCommands: boolean;
  installPackages: boolean;
  deploy: boolean;
  askBeforeExecution: boolean;
}

export function getPermissions(userId: string): AIPermissions {
  const row = db.prepare("SELECT * FROM desktop_permissions WHERE user_id = ?").get(userId) as {
    read_files: number;
    modify_files: number;
    run_commands: number;
    install_packages: number;
    deploy: number;
    ask_before_execution: number;
  } | undefined;

  if (!row) {
    const defaults: AIPermissions = {
      readFiles: true,
      modifyFiles: true,
      runCommands: true,
      installPackages: false,
      deploy: false,
      askBeforeExecution: true,
    };
    savePermissions(userId, defaults);
    return defaults;
  }

  return {
    readFiles: row.read_files === 1,
    modifyFiles: row.modify_files === 1,
    runCommands: row.run_commands === 1,
    installPackages: row.install_packages === 1,
    deploy: row.deploy === 1,
    askBeforeExecution: row.ask_before_execution === 1,
  };
}

export function savePermissions(userId: string, perms: AIPermissions): AIPermissions {
  db.prepare(
    `INSERT INTO desktop_permissions (user_id, read_files, modify_files, run_commands, install_packages, deploy, ask_before_execution)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       read_files = excluded.read_files,
       modify_files = excluded.modify_files,
       run_commands = excluded.run_commands,
       install_packages = excluded.install_packages,
       deploy = excluded.deploy,
       ask_before_execution = excluded.ask_before_execution,
       updated_at = datetime('now')`
  ).run(
    userId,
    perms.readFiles ? 1 : 0,
    perms.modifyFiles ? 1 : 0,
    perms.runCommands ? 1 : 0,
    perms.installPackages ? 1 : 0,
    perms.deploy ? 1 : 0,
    perms.askBeforeExecution ? 1 : 0
  );
  return getPermissions(userId);
}

export const ALLOWED_COMMANDS = ["npm", "pnpm", "yarn", "git", "docker", "python", "cargo", "go", "node"];

export function validateCommand(command: string, perms: AIPermissions): { allowed: boolean; reason?: string } {
  if (!perms.runCommands) return { allowed: false, reason: "Run commands permission disabled" };

  const bin = command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const allowed = ALLOWED_COMMANDS.some((c) => bin === c || bin.endsWith(`/${c}`));
  if (!allowed) return { allowed: false, reason: `Command not in allowlist: ${bin}` };

  if ((bin === "npm" || bin === "pnpm" || bin === "yarn") && command.includes("install") && !perms.installPackages) {
    return { allowed: false, reason: "Install packages permission disabled" };
  }

  return { allowed: true };
}
