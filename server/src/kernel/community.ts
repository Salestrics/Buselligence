import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import { listSkills } from "./skills.js";
import { listRegisteredAgents } from "./registry.js";

export interface CommunityItem {
  id: string;
  itemType: "agent" | "skill" | "template" | "plugin" | "mcp";
  slug: string;
  name: string;
  author?: string;
  description?: string;
  installs: number;
}

function seedCommunityItems(): void {
  const count = db.prepare("SELECT COUNT(*) as c FROM kernel_community_items").get() as { c: number };
  if (count.c > 0) return;

  const items: Omit<CommunityItem, "id">[] = [
    { itemType: "skill", slug: "build-react-app", name: "Build React App", author: "Buselligence", description: "Scaffold React applications", installs: 1240 },
    { itemType: "skill", slug: "review-security", name: "Review Security", author: "Buselligence", description: "OWASP and dependency scanning", installs: 890 },
    { itemType: "agent", slug: "security_reviewer", name: "Security Reviewer", author: "Buselligence", description: "Code scanning and dependency analysis", installs: 650 },
    { itemType: "template", slug: "ai-chatbot", name: "AI Chatbot", author: "Community", description: "Starter chatbot with RAG", installs: 2100 },
    { itemType: "template", slug: "saas-builder", name: "SaaS Builder", author: "Community", description: "Full-stack SaaS starter", installs: 1800 },
    { itemType: "plugin", slug: "salesforce-agent", name: "Salesforce Agent", author: "Community", description: "CRM integration plugin", installs: 420 },
    { itemType: "mcp", slug: "filesystem", name: "Filesystem MCP", author: "MCP", description: "Local file access server", installs: 3200 },
  ];

  for (const item of items) {
    db.prepare(
      `INSERT INTO kernel_community_items (id, item_type, slug, name, author, description, installs, manifest)
       VALUES (?, ?, ?, ?, ?, ?, ?, '{}')`
    ).run(randomUUID(), item.itemType, item.slug, item.name, item.author ?? null, item.description ?? null, item.installs);
  }
}

export function listCommunityItems(type?: string): CommunityItem[] {
  seedCommunityItems();
  const rows = (type
    ? db.prepare("SELECT * FROM kernel_community_items WHERE item_type = ? ORDER BY installs DESC").all(type)
    : db.prepare("SELECT * FROM kernel_community_items ORDER BY installs DESC").all()) as Array<{
    id: string;
    item_type: string;
    slug: string;
    name: string;
    author: string | null;
    description: string | null;
    installs: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    itemType: r.item_type as CommunityItem["itemType"],
    slug: r.slug,
    name: r.name,
    author: r.author ?? undefined,
    description: r.description ?? undefined,
    installs: r.installs,
  }));
}

export function getCommunityHubSummary() {
  seedCommunityItems();
  const agents = listRegisteredAgents();
  const skills = listSkills();

  return {
    message: "Architected for agent sharing, skill publishing, templates, plugins, and MCP servers.",
    stats: {
      agents: agents.length,
      skills: skills.length,
      templates: listCommunityItems("template").length,
      plugins: listCommunityItems("plugin").length,
      mcpServers: listCommunityItems("mcp").length,
    },
    categories: ["agents", "skills", "templates", "plugins", "mcp"],
    items: listCommunityItems(),
  };
}
