import {
  Brain,
  Code2,
  Database,
  LayoutDashboard,
  Shield,
  Users,
  Workflow,
  Store,
  Rocket,
  GitBranch,
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "AI Development Studio",
    description:
      "Monaco editor with TypeScript, Python, SQL, YAML support. Multi-file projects, file explorer, AI copilot, and preview runtime.",
  },
  {
    icon: Users,
    title: "AI Software Engineer",
    description:
      "Describe what you need — the AI analyzes your data, writes SQL, builds React dashboards, creates APIs, and deploys previews.",
  },
  {
    icon: LayoutDashboard,
    title: "App Builder",
    description:
      "Prompt: \"Build me a customer onboarding tracker.\" Generates pages, database schema, roles, API layer, and deployment package.",
  },
  {
    icon: Database,
    title: "Database Studio",
    description:
      "Schema explorer, SQL editor, query history, explain plans, and AI-generated queries from natural language.",
  },
  {
    icon: Brain,
    title: "Semantic Layer",
    description:
      "Define metrics, relationships, and business rules. The AI understands what your business means — not just your schema.",
  },
  {
    icon: Workflow,
    title: "Automation Builder",
    description:
      "Visual workflows: Salesforce lead → AI analysis → create opportunity → Slack notification. MCP, webhooks, cron.",
  },
  {
    icon: GitBranch,
    title: "Git-Native Development",
    description:
      "Branches, commits, AI-generated commits with change summaries, and code review agent before deployment.",
  },
  {
    icon: Store,
    title: "Package Marketplace",
    description:
      "Install AI agents, connectors, app templates, and dashboards. Zapier for business intelligence and development.",
  },
  {
    icon: Rocket,
    title: "One-Click Deploy",
    description:
      "Deploy React + Node + PostgreSQL to production. Auto-generated docs, API references, and architecture diagrams.",
  },
  {
    icon: Shield,
    title: "Data Governance",
    description:
      "Audit log, envelope encryption, and AI code review for security, performance, and quality before every deploy.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Analyze, build, and automate — with AI that understands your business
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cursor meets Retool meets Metabase — with semantic business context and MCP as connective tissue.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
