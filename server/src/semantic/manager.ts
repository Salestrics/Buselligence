import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "../bi/schema.js";
import type {
  SemanticMetric,
  SemanticMetricInput,
  SemanticRelationship,
  SemanticRelationshipInput,
  SemanticRule,
  SemanticRuleInput,
  DEFAULT_METRICS,
  DEFAULT_RELATIONSHIPS,
  DEFAULT_RULES,
} from "./types.js";
import {
  DEFAULT_METRICS as SEED_METRICS,
  DEFAULT_RELATIONSHIPS as SEED_RELATIONSHIPS,
  DEFAULT_RULES as SEED_RULES,
} from "./types.js";

import "../bi/schema.js";

interface MetricRow {
  id: string;
  user_id: string;
  name: string;
  display_name: string;
  description: string | null;
  formula: string;
  unit: string | null;
  category: string | null;
  sources: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

function metricToPublic(row: MetricRow): SemanticMetric {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    formula: row.formula,
    unit: row.unit,
    category: row.category,
    sources: parseJson(row.sources, []),
    tags: parseJson(row.tags, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listMetrics(userId: string): SemanticMetric[] {
  return (
    db.prepare("SELECT * FROM semantic_metrics WHERE user_id = ? ORDER BY name").all(userId) as MetricRow[]
  ).map(metricToPublic);
}

export function getMetric(id: string, userId: string): SemanticMetric | undefined {
  const row = db.prepare("SELECT * FROM semantic_metrics WHERE id = ? AND user_id = ?").get(id, userId) as MetricRow | undefined;
  return row ? metricToPublic(row) : undefined;
}

export function getMetricByName(userId: string, name: string): SemanticMetric | undefined {
  const row = db.prepare("SELECT * FROM semantic_metrics WHERE user_id = ? AND name = ?").get(userId, name) as MetricRow | undefined;
  return row ? metricToPublic(row) : undefined;
}

export function createMetric(userId: string, input: SemanticMetricInput): SemanticMetric {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO semantic_metrics (id, user_id, name, display_name, description, formula, unit, category, sources, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, input.name, input.displayName, input.description ?? null, input.formula, input.unit ?? null, input.category ?? null, JSON.stringify(input.sources ?? []), JSON.stringify(input.tags ?? []));
  return getMetric(id, userId)!;
}

export function updateMetric(id: string, userId: string, input: Partial<SemanticMetricInput>): SemanticMetric | undefined {
  const existing = getMetric(id, userId);
  if (!existing) return undefined;
  db.prepare(
    `UPDATE semantic_metrics SET name=?, display_name=?, description=?, formula=?, unit=?, category=?, sources=?, tags=?, updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(
    input.name ?? existing.name,
    input.displayName ?? existing.displayName,
    input.description !== undefined ? input.description : existing.description,
    input.formula ?? existing.formula,
    input.unit !== undefined ? input.unit : existing.unit,
    input.category !== undefined ? input.category : existing.category,
    JSON.stringify(input.sources ?? existing.sources),
    JSON.stringify(input.tags ?? existing.tags),
    id, userId
  );
  return getMetric(id, userId);
}

export function deleteMetric(id: string, userId: string): boolean {
  return db.prepare("DELETE FROM semantic_metrics WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

// Relationships
interface RelRow {
  id: string; user_id: string; name: string; description: string | null;
  from_entity: string; to_entity: string; relationship_type: string; join_key: string | null;
  created_at: string; updated_at: string;
}

function relToPublic(row: RelRow): SemanticRelationship {
  return {
    id: row.id, name: row.name, description: row.description,
    fromEntity: row.from_entity, toEntity: row.to_entity,
    relationshipType: row.relationship_type, joinKey: row.join_key,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function listRelationships(userId: string): SemanticRelationship[] {
  return (db.prepare("SELECT * FROM semantic_relationships WHERE user_id = ? ORDER BY name").all(userId) as RelRow[]).map(relToPublic);
}

export function createRelationship(userId: string, input: SemanticRelationshipInput): SemanticRelationship {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO semantic_relationships (id, user_id, name, description, from_entity, to_entity, relationship_type, join_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, input.name, input.description ?? null, input.fromEntity, input.toEntity, input.relationshipType ?? "one_to_many", input.joinKey ?? null);
  return relToPublic(db.prepare("SELECT * FROM semantic_relationships WHERE id = ?").get(id) as RelRow);
}

export function deleteRelationship(id: string, userId: string): boolean {
  return db.prepare("DELETE FROM semantic_relationships WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

// Rules
interface RuleRow {
  id: string; user_id: string; name: string; description: string | null;
  rule_type: string; expression: string; applies_to: string; enabled: number;
  created_at: string; updated_at: string;
}

function ruleToPublic(row: RuleRow): SemanticRule {
  return {
    id: row.id, name: row.name, description: row.description,
    ruleType: row.rule_type as SemanticRule["ruleType"],
    expression: row.expression,
    appliesTo: parseJson(row.applies_to, []),
    enabled: row.enabled === 1,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function listRules(userId: string): SemanticRule[] {
  return (db.prepare("SELECT * FROM semantic_rules WHERE user_id = ? ORDER BY name").all(userId) as RuleRow[]).map(ruleToPublic);
}

export function createRule(userId: string, input: SemanticRuleInput): SemanticRule {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO semantic_rules (id, user_id, name, description, rule_type, expression, applies_to, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, input.name, input.description ?? null, input.ruleType ?? "filter", input.expression, JSON.stringify(input.appliesTo ?? []), input.enabled === false ? 0 : 1);
  return ruleToPublic(db.prepare("SELECT * FROM semantic_rules WHERE id = ?").get(id) as RuleRow);
}

export function updateRule(id: string, userId: string, input: Partial<SemanticRuleInput>): SemanticRule | undefined {
  const row = db.prepare("SELECT * FROM semantic_rules WHERE id = ? AND user_id = ?").get(id, userId) as RuleRow | undefined;
  if (!row) return undefined;
  const existing = ruleToPublic(row);
  db.prepare(
    `UPDATE semantic_rules SET name=?, description=?, rule_type=?, expression=?, applies_to=?, enabled=?, updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(
    input.name ?? existing.name,
    input.description !== undefined ? input.description : existing.description,
    input.ruleType ?? existing.ruleType,
    input.expression ?? existing.expression,
    JSON.stringify(input.appliesTo ?? existing.appliesTo),
    input.enabled === undefined ? (existing.enabled ? 1 : 0) : input.enabled ? 1 : 0,
    id, userId
  );
  return ruleToPublic(db.prepare("SELECT * FROM semantic_rules WHERE id = ?").get(id) as RuleRow);
}

export function deleteRule(id: string, userId: string): boolean {
  return db.prepare("DELETE FROM semantic_rules WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function seedSemanticLayer(userId: string): { metrics: number; relationships: number; rules: number } {
  let metrics = 0, relationships = 0, rules = 0;
  if (listMetrics(userId).length === 0) {
    for (const m of SEED_METRICS) { createMetric(userId, m); metrics++; }
  }
  if (listRelationships(userId).length === 0) {
    for (const r of SEED_RELATIONSHIPS) { createRelationship(userId, r); relationships++; }
  }
  if (listRules(userId).length === 0) {
    for (const r of SEED_RULES) { createRule(userId, r); rules++; }
  }
  return { metrics, relationships, rules };
}

export function buildSemanticContext(userId: string): string {
  const metrics = listMetrics(userId);
  const relationships = listRelationships(userId);
  const rules = listRules(userId).filter((r) => r.enabled);

  if (metrics.length === 0 && relationships.length === 0 && rules.length === 0) {
    return "";
  }

  const lines: string[] = ["## Business Semantic Layer", "Use these definitions when analyzing data. Never invent metric definitions — use what's defined here.", ""];

  if (metrics.length > 0) {
    lines.push("### Metrics");
    for (const m of metrics) {
      lines.push(`**${m.displayName}** (\`${m.name}\`)`);
      if (m.description) lines.push(`- Description: ${m.description}`);
      lines.push(`- Formula: \`${m.formula}\``);
      if (m.unit) lines.push(`- Unit: ${m.unit}`);
      if (m.sources.length) lines.push(`- Sources: ${m.sources.join(", ")}`);
      lines.push("");
    }
  }

  if (relationships.length > 0) {
    lines.push("### Entity Relationships");
    for (const r of relationships) {
      lines.push(`- **${r.name}**: ${r.fromEntity} → ${r.toEntity} (${r.relationshipType})${r.joinKey ? ` via \`${r.joinKey}\`` : ""}`);
    }
    lines.push("");
  }

  if (rules.length > 0) {
    lines.push("### Business Rules (always apply)");
    for (const r of rules) {
      lines.push(`- **${r.name}** [${r.ruleType}]: \`${r.expression}\`${r.appliesTo.length ? ` (applies to: ${r.appliesTo.join(", ")})` : ""}`);
    }
  }

  return lines.join("\n");
}

export function explainMetric(userId: string, metricName: string): string | null {
  const metric = getMetricByName(userId, metricName) || listMetrics(userId).find((m) => m.displayName.toLowerCase() === metricName.toLowerCase());
  if (!metric) return null;

  const applicableRules = listRules(userId).filter((r) => r.enabled && (r.appliesTo.length === 0 || r.appliesTo.includes(metric.name)));

  return [
    `# ${metric.displayName}`,
    metric.description ?? "",
    `**Formula:** ${metric.formula}`,
    `**Sources:** ${metric.sources.join(", ") || "Not specified"}`,
    applicableRules.length ? `**Business rules:** ${applicableRules.map((r) => r.name).join(", ")}` : "",
    "",
    "When explaining changes to this metric, trace: underlying data sources → contributing factors → business impact.",
  ].filter(Boolean).join("\n");
}
