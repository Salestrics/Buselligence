import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { parseJson } from "./schema.js";
import type { StudioPackage } from "./types.js";

export const MARKETPLACE_PACKAGES: Omit<StudioPackage, "id">[] = [
  {
    slug: "sales-analyst-agent",
    name: "Sales Analyst Agent",
    category: "agent",
    description: "Pipeline analysis, win rates, deal velocity, and forecast accuracy",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["sales", "pipeline", "forecast"],
    manifest: { agentId: "sales_analyst" },
    installs: 1240,
  },
  {
    slug: "finance-analyst-agent",
    name: "Finance Analyst Agent",
    category: "agent",
    description: "Revenue, NRR, churn, CAC, and board-ready financial narratives",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["finance", "revenue", "nrr"],
    manifest: { agentId: "financial_analyst" },
    installs: 980,
  },
  {
    slug: "engineering-agent",
    name: "Engineering Agent",
    category: "agent",
    description: "AI Software Engineer — builds apps, APIs, and dashboards from prompts",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["engineering", "code", "apps"],
    manifest: { agentId: "software_engineer" },
    installs: 756,
  },
  {
    slug: "support-agent",
    name: "Support Agent",
    category: "agent",
    description: "CSAT analysis, ticket trends, SLA monitoring, and support automation",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["support", "csat", "sla"],
    manifest: { agentId: "operations_analyst" },
    installs: 432,
  },
  {
    slug: "salesforce-connector",
    name: "Salesforce Connector",
    category: "connector",
    description: "Connect Salesforce CRM — accounts, opportunities, leads",
    version: "2.1.0",
    author: "Buselligence",
    tags: ["salesforce", "crm"],
    manifest: { connectorType: "salesforce" },
    installs: 2100,
  },
  {
    slug: "stripe-connector",
    name: "Stripe Connector",
    category: "connector",
    description: "Revenue, subscriptions, customers, and payment data",
    version: "1.5.0",
    author: "Buselligence",
    tags: ["stripe", "payments"],
    manifest: { connectorType: "stripe" },
    installs: 1850,
  },
  {
    slug: "crm-app-template",
    name: "CRM App",
    category: "app",
    description: "Full CRM with customers, deals, pipeline, and activity tracking",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["crm", "sales", "template"],
    manifest: { projectType: "app", pages: ["Dashboard", "Customers", "Deals", "Pipeline"] },
    installs: 890,
  },
  {
    slug: "inventory-app-template",
    name: "Inventory Management",
    category: "app",
    description: "Inventory tracking with products, orders, and analytics",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["inventory", "operations"],
    manifest: { projectType: "app", pages: ["Dashboard", "Products", "Orders"] },
    installs: 654,
  },
  {
    slug: "hr-app-template",
    name: "HR Management",
    category: "app",
    description: "Employee directory, onboarding, time-off, and org chart",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["hr", "people"],
    manifest: { projectType: "app", pages: ["Directory", "Onboarding", "TimeOff"] },
    installs: 321,
  },
  {
    slug: "finance-dashboard-template",
    name: "Finance Dashboard",
    category: "template",
    description: "SaaS executive dashboard — ARR, pipeline, churn, CAC",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["finance", "dashboard", "saas"],
    manifest: { widgets: ["arr", "pipeline", "churn", "cac", "revenue_trend"] },
    installs: 1100,
  },
  {
    slug: "aws-connector",
    name: "AWS Connector",
    category: "connector",
    description: "S3, RDS, CloudWatch metrics and cost data",
    version: "1.0.0",
    author: "Buselligence",
    tags: ["aws", "cloud"],
    manifest: { connectorType: "aws" },
    installs: 567,
  },
  {
    slug: "github-connector",
    name: "GitHub Connector",
    category: "connector",
    description: "Repos, PRs, issues, and deployment data",
    version: "1.2.0",
    author: "Buselligence",
    tags: ["github", "devops"],
    manifest: { connectorType: "github", mcpPreset: "github" },
    installs: 1430,
  },
];

export function seedPackages(): void {
  for (const pkg of MARKETPLACE_PACKAGES) {
    const existing = db
      .prepare("SELECT id FROM studio_packages WHERE slug = ?")
      .get(pkg.slug);
    if (existing) continue;
    db.prepare(
      `INSERT INTO studio_packages (id, slug, name, category, description, version, author, tags, manifest, installs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      pkg.slug,
      pkg.name,
      pkg.category,
      pkg.description ?? null,
      pkg.version,
      pkg.author ?? null,
      JSON.stringify(pkg.tags),
      JSON.stringify(pkg.manifest),
      pkg.installs
    );
  }
}

export function listPackages(category?: string): StudioPackage[] {
  seedPackages();
  const query = category
    ? "SELECT * FROM studio_packages WHERE category = ? ORDER BY installs DESC"
    : "SELECT * FROM studio_packages ORDER BY installs DESC";
  const rows = (category
    ? db.prepare(query).all(category)
    : db.prepare(query).all()) as Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    description: string | null;
    version: string;
    author: string | null;
    tags: string;
    manifest: string;
    installs: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category as StudioPackage["category"],
    description: r.description ?? undefined,
    version: r.version,
    author: r.author ?? undefined,
    tags: parseJson<string[]>(r.tags, []),
    manifest: parseJson<Record<string, unknown>>(r.manifest, {}),
    installs: r.installs,
  }));
}

export function installPackage(
  userId: string,
  packageId: string
): { installed: boolean; package: StudioPackage } {
  seedPackages();
  const pkg = db
    .prepare("SELECT * FROM studio_packages WHERE id = ?")
    .get(packageId) as {
    id: string;
    slug: string;
    name: string;
    category: string;
    description: string | null;
    version: string;
    author: string | null;
    tags: string;
    manifest: string;
    installs: number;
  } | undefined;

  if (!pkg) throw new Error("Package not found");

  const existing = db
    .prepare(
      "SELECT id FROM studio_package_installs WHERE user_id = ? AND package_id = ?"
    )
    .get(userId, packageId);

  if (!existing) {
    db.prepare(
      "INSERT INTO studio_package_installs (id, user_id, package_id) VALUES (?, ?, ?)"
    ).run(randomUUID(), userId, packageId);
    db.prepare(
      "UPDATE studio_packages SET installs = installs + 1 WHERE id = ?"
    ).run(packageId);
  }

  return {
    installed: true,
    package: {
      id: pkg.id,
      slug: pkg.slug,
      name: pkg.name,
      category: pkg.category as StudioPackage["category"],
      description: pkg.description ?? undefined,
      version: pkg.version,
      author: pkg.author ?? undefined,
      tags: parseJson<string[]>(pkg.tags, []),
      manifest: parseJson<Record<string, unknown>>(pkg.manifest, {}),
      installs: pkg.installs,
    },
  };
}

export function listUserPackageInstalls(userId: string): string[] {
  const rows = db
    .prepare("SELECT package_id FROM studio_package_installs WHERE user_id = ?")
    .all(userId) as Array<{ package_id: string }>;
  return rows.map((r) => r.package_id);
}
