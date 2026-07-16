import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relationship: string;
}

export function buildKnowledgeGraph(userId: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const existing = db
    .prepare("SELECT COUNT(*) as c FROM core_graph_nodes WHERE user_id = ?")
    .get(userId) as { c: number };

  if (existing.c === 0) {
    seedGraph(userId);
  }

  const nodes = (
    db.prepare("SELECT * FROM core_graph_nodes WHERE user_id = ?").all(userId) as Array<{
      id: string;
      node_type: string;
      label: string;
      properties: string;
    }>
  ).map((n) => ({
    id: n.id,
    type: n.node_type,
    label: n.label,
    properties: parseJson<Record<string, unknown>>(n.properties, {}),
  }));

  const edges = (
    db.prepare("SELECT * FROM core_graph_edges WHERE user_id = ?").all(userId) as Array<{
      id: string;
      from_node: string;
      to_node: string;
      relationship: string;
    }>
  ).map((e) => ({
    id: e.id,
    from: e.from_node,
    to: e.to_node,
    relationship: e.relationship,
  }));

  return { nodes, edges };
}

function seedGraph(userId: string): void {
  const userId_node = createNode(userId, "user", "You", {});
  const projects = createNode(userId, "collection", "Projects", {});
  const code = createNode(userId, "collection", "Code", {});
  const docs = createNode(userId, "collection", "Documents", {});
  const agents = createNode(userId, "collection", "Agents", {});
  const data = createNode(userId, "collection", "Data", {});

  createEdge(userId, userId_node, projects, "owns");
  createEdge(userId, projects, code, "contains");
  createEdge(userId, projects, docs, "contains");
  createEdge(userId, userId_node, agents, "manages");
  createEdge(userId, userId_node, data, "connects_to");
  createEdge(userId, code, docs, "documented_by");
  createEdge(userId, agents, code, "maintains");
}

function createNode(
  userId: string,
  type: string,
  label: string,
  properties: Record<string, unknown>
): string {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO core_graph_nodes (id, user_id, node_type, label, properties) VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, type, label, JSON.stringify(properties));
  return id;
}

function createEdge(userId: string, from: string, to: string, relationship: string): void {
  db.prepare(
    `INSERT INTO core_graph_edges (id, user_id, from_node, to_node, relationship) VALUES (?, ?, ?, ?, ?)`
  ).run(randomUUID(), userId, from, to, relationship);
}

export function queryGraph(userId: string, question: string): string {
  const { nodes, edges } = buildKnowledgeGraph(userId);
  return `Knowledge graph: ${nodes.length} nodes, ${edges.length} relationships. Query "${question}" traverses: User → Projects → Code/Documents → Agents → Data.`;
}
