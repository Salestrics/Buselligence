import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export type ContributionType =
  | "agent"
  | "tool"
  | "model"
  | "extension"
  | "template"
  | "workflow"
  | "skill";

export interface Contribution {
  id: string;
  userId: string;
  type: ContributionType;
  name: string;
  description?: string;
  manifest: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export function listContributions(type?: ContributionType): Contribution[] {
  const query = type
    ? "SELECT * FROM core_contributions WHERE contribution_type = ? AND status = 'published' ORDER BY created_at DESC"
    : "SELECT * FROM core_contributions WHERE status = 'published' ORDER BY created_at DESC";
  const rows = (type ? db.prepare(query).all(type) : db.prepare(query).all()) as Array<{
    id: string;
    user_id: string;
    contribution_type: string;
    name: string;
    description: string | null;
    manifest: string;
    status: string;
    created_at: string;
  }>;

  return rows.map(mapContribution);
}

export function createContribution(
  userId: string,
  input: {
    type: ContributionType;
    name: string;
    description?: string;
    manifest?: Record<string, unknown>;
  }
): Contribution {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO core_contributions (id, user_id, contribution_type, name, description, manifest, status)
     VALUES (?, ?, ?, ?, ?, ?, 'published')`
  ).run(
    id,
    userId,
    input.type,
    input.name,
    input.description ?? null,
    JSON.stringify(input.manifest ?? {})
  );

  return mapContribution(
    db.prepare("SELECT * FROM core_contributions WHERE id = ?").get(id) as Parameters<
      typeof mapContribution
    >[0]
  );
}

function mapContribution(row: {
  id: string;
  user_id: string;
  contribution_type: string;
  name: string;
  description: string | null;
  manifest: string;
  status: string;
  created_at: string;
}): Contribution {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.contribution_type as ContributionType,
    name: row.name,
    description: row.description ?? undefined,
    manifest: parseJson<Record<string, unknown>>(row.manifest, {}),
    status: row.status,
    createdAt: row.created_at,
  };
}

export const COMMUNITY_SEED: Array<{ type: ContributionType; name: string; description: string }> = [
  { type: "agent", name: "SEO Writer", description: "Community-contributed SEO content agent" },
  { type: "tool", name: "GitHub MCP Bridge", description: "Enhanced GitHub integration" },
  { type: "template", name: "E-commerce Starter", description: "Full e-commerce app template" },
  { type: "workflow", name: "Invoice Automation", description: "Stripe → accounting workflow" },
  { type: "skill", name: "Data Visualization", description: "Chart generation skill pack" },
];

export function seedCommunityContributions(systemUserId: string): void {
  for (const item of COMMUNITY_SEED) {
    const existing = db
      .prepare("SELECT id FROM core_contributions WHERE name = ?")
      .get(item.name);
    if (existing) continue;
    createContribution(systemUserId, item);
  }
}
