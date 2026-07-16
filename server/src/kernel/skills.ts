import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  category: string;
  installs: number;
  builtin: boolean;
}

export const BUILTIN_SKILLS: Omit<Skill, "id">[] = [
  { slug: "build-react-app", name: "Build React App", description: "Scaffold and build React applications", version: "1.0.0", author: "Buselligence", category: "development", installs: 0, builtin: true },
  { slug: "analyze-database", name: "Analyze Database", description: "Schema analysis, query optimization, explain plans", version: "1.0.0", author: "Buselligence", category: "data", installs: 0, builtin: true },
  { slug: "generate-api", name: "Generate API", description: "REST/GraphQL API endpoint generation", version: "1.0.0", author: "Buselligence", category: "development", installs: 0, builtin: true },
  { slug: "review-security", name: "Review Security", description: "Security scanning, secrets, OWASP checks", version: "1.0.0", author: "Buselligence", category: "security", installs: 0, builtin: true },
  { slug: "create-presentation", name: "Create Presentation", description: "Generate slides and pitch decks", version: "1.0.0", author: "Buselligence", category: "create", installs: 0, builtin: true },
  { slug: "deploy-application", name: "Deploy Application", description: "One-click deployment to preview or production", version: "1.0.0", author: "Buselligence", category: "devops", installs: 0, builtin: true },
  { slug: "teach-concept", name: "Teach Concept", description: "Adaptive learning and tutoring", version: "1.0.0", author: "Buselligence", category: "learn", installs: 0, builtin: true },
  { slug: "analyze-metrics", name: "Analyze Metrics", description: "Business metrics and data intelligence", version: "1.0.0", author: "Buselligence", category: "data", installs: 0, builtin: true },
];

function seedSkills(): void {
  for (const skill of BUILTIN_SKILLS) {
    const existing = db.prepare("SELECT id FROM kernel_skills WHERE slug = ?").get(skill.slug);
    if (existing) continue;
    db.prepare(
      `INSERT INTO kernel_skills (id, slug, name, description, version, author, category, builtin, installs)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(
      randomUUID(),
      skill.slug,
      skill.name,
      skill.description ?? null,
      skill.version,
      skill.author ?? null,
      skill.category,
      Math.floor(Math.random() * 500) + 100
    );
  }
}

export function listSkills(): Skill[] {
  seedSkills();
  const rows = db
    .prepare("SELECT * FROM kernel_skills ORDER BY installs DESC")
    .all() as Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    version: string;
    author: string | null;
    category: string;
    installs: number;
    builtin: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? undefined,
    version: r.version,
    author: r.author ?? undefined,
    category: r.category,
    installs: r.installs,
    builtin: r.builtin === 1,
  }));
}

export function installSkill(userId: string, skillId: string): boolean {
  seedSkills();
  const existing = db
    .prepare("SELECT id FROM kernel_skill_installs WHERE user_id = ? AND skill_id = ?")
    .get(userId, skillId);
  if (existing) return true;

  db.prepare(
    "INSERT INTO kernel_skill_installs (id, user_id, skill_id) VALUES (?, ?, ?)"
  ).run(randomUUID(), userId, skillId);
  db.prepare("UPDATE kernel_skills SET installs = installs + 1 WHERE id = ?").run(skillId);
  return true;
}

export function getInstalledSkills(userId: string): Skill[] {
  seedSkills();
  const rows = db
    .prepare(
      `SELECT s.* FROM kernel_skills s
       JOIN kernel_skill_installs i ON i.skill_id = s.id
       WHERE i.user_id = ?`
    )
    .all(userId) as Parameters<typeof mapSkillRow>[0][];
  return rows.map(mapSkillRow);
}

function mapSkillRow(r: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  version: string;
  author: string | null;
  category: string;
  installs: number;
  builtin: number;
}): Skill {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? undefined,
    version: r.version,
    author: r.author ?? undefined,
    category: r.category,
    installs: r.installs,
    builtin: r.builtin === 1,
  };
}

export function resolveSkills(userId: string, skillIds?: string[]): Skill[] {
  const installed = getInstalledSkills(userId);
  if (!skillIds?.length) return installed.slice(0, 3);
  return listSkills().filter((s) => skillIds.includes(s.id) || skillIds.includes(s.slug));
}

export function getSkillBySlug(slug: string): Skill | null {
  seedSkills();
  const row = db.prepare("SELECT * FROM kernel_skills WHERE slug = ?").get(slug);
  return row ? mapSkillRow(row as Parameters<typeof mapSkillRow>[0]) : null;
}
