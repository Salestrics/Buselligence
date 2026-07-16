import { randomUUID } from "node:crypto";
import { db } from "../db.js";

export interface ExtensionManifest {
  name: string;
  version: string;
  tools: Array<{ name: string; description?: string }>;
  agents?: string[];
  skills?: string[];
}

export interface ExtensionDefinition {
  id: string;
  name: string;
  version: string;
  manifest: ExtensionManifest;
  status: string;
}

export const EXTENSION_SDK = {
  name: "Buselligence Extension SDK",
  version: "1.0.0",
  api: "createBuselligencePlugin",
  example: `import { createBuselligencePlugin } from '@buselligence/sdk';

export default createBuselligencePlugin({
  name: "Salesforce Agent",
  version: "1.0.0",
  tools: [
    { name: "query_accounts", description: "Query Salesforce accounts" },
    { name: "create_opportunity", description: "Create a new opportunity" },
  ],
  agents: ["sales_analyst"],
  skills: ["analyze-database"],
  permissions: ["read:crm", "write:crm"],
  onInstall: async (ctx) => {
    ctx.log("Salesforce Agent installed");
  },
});`,
  hooks: ["onInstall", "onUninstall", "onExecute", "onTrace"],
  permissions: ["read", "write", "execute", "read:crm", "write:crm"],
};

export function validateExtension(manifest: ExtensionManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!manifest.name) errors.push("name is required");
  if (!manifest.version) errors.push("version is required");
  if (!manifest.tools?.length) errors.push("at least one tool is required");
  return { valid: errors.length === 0, errors };
}

export function registerExtension(userId: string, manifest: ExtensionManifest): ExtensionDefinition {
  const { valid, errors } = validateExtension(manifest);
  if (!valid) throw new Error(errors.join(", "));

  const id = randomUUID();
  db.prepare(
    `INSERT INTO kernel_extensions (id, user_id, name, version, manifest, status) VALUES (?, ?, ?, ?, ?, 'active')`
  ).run(id, userId, manifest.name, manifest.version, JSON.stringify(manifest));

  return { id, name: manifest.name, version: manifest.version, manifest, status: "active" };
}

export function listExtensions(userId: string): ExtensionDefinition[] {
  const rows = db
    .prepare("SELECT * FROM kernel_extensions WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Array<{
    id: string;
    name: string;
    version: string;
    manifest: string;
    status: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    version: r.version,
    manifest: JSON.parse(r.manifest) as ExtensionManifest,
    status: r.status,
  }));
}
