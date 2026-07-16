export type ProjectType = "app" | "dashboard" | "api" | "automation" | "notebook";
export type FileLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "sql"
  | "json"
  | "yaml"
  | "markdown"
  | "html"
  | "css";

export interface StudioProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  projectType: ProjectType;
  stack: string[];
  status: "draft" | "building" | "preview" | "deployed";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StudioFile {
  id: string;
  projectId: string;
  userId: string;
  path: string;
  content: string;
  language: FileLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface StudioBranch {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface StudioCommit {
  id: string;
  projectId: string;
  branchId: string;
  userId: string;
  message: string;
  author: "user" | "ai";
  additions: number;
  deletions: number;
  filesChanged: string[];
  createdAt: string;
}

export interface StudioAutomation {
  id: string;
  userId: string;
  name: string;
  description?: string;
  triggerType: "webhook" | "cron" | "database" | "mcp" | "salesforce_lead";
  triggerConfig: Record<string, unknown>;
  steps: AutomationStep[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationStep {
  id: string;
  type: "ai_agent" | "action" | "notification" | "query" | "webhook";
  label: string;
  config: Record<string, unknown>;
}

export interface StudioDeployment {
  id: string;
  projectId: string;
  userId: string;
  environment: "preview" | "staging" | "production";
  stack: string[];
  domain?: string;
  status: "pending" | "building" | "live" | "failed";
  url?: string;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudioPackage {
  id: string;
  slug: string;
  name: string;
  category: "agent" | "connector" | "app" | "template";
  description?: string;
  version: string;
  author?: string;
  tags: string[];
  manifest: Record<string, unknown>;
  installs: number;
}

export interface CodeReviewResult {
  passed: boolean;
  security: ReviewCheck[];
  performance: ReviewCheck[];
  quality: ReviewCheck[];
  suggestions: string[];
}

export interface ReviewCheck {
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface AppBuilderResult {
  name: string;
  pages: string[];
  tables: string[];
  roles: string[];
  files: Array<{ path: string; content: string; language: FileLanguage }>;
}

export interface ModelRouteDecision {
  task: string;
  provider: string;
  model: string;
  reason: string;
}

export const DEFAULT_PROJECT_FILES: Array<{
  path: string;
  content: string;
  language: FileLanguage;
}> = [
  {
    path: "src/index.tsx",
    content: `import React from "react";

export function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to Buselligence Studio</h1>
      <p className="mt-2 text-gray-600">Build apps with AI that understands your business.</p>
    </div>
  );
}
`,
    language: "typescript",
  },
  {
    path: "src/components/Dashboard.tsx",
    content: `export function Dashboard() {
  return <div>Dashboard</div>;
}
`,
    language: "typescript",
  },
  {
    path: "queries/revenue.sql",
    content: `-- Monthly revenue report
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(amount) AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;
`,
    language: "sql",
  },
  {
    path: "workflows/onboarding.yaml",
    content: `name: customer-onboarding
trigger:
  type: salesforce_lead
  event: new_lead
steps:
  - type: ai_agent
    action: analyze_company
  - type: action
    action: create_opportunity
  - type: notification
    channels: [slack, email]
`,
    language: "yaml",
  },
  {
    path: "README.md",
    content: `# Project

Built with Buselligence Studio — the open-source AI workspace where businesses analyze, build, and automate.
`,
    language: "markdown",
  },
];
