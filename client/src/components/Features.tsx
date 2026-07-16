import {
  Brain,
  Database,
  LayoutDashboard,
  Shield,
  Users,
  Zap,
  BarChart3,
  Clock,
  Store,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Semantic Layer",
    description:
      "Define metrics (Revenue, NRR, CAC, Churn), entity relationships, and business rules. The AI understands what your business means — not just your schema.",
  },
  {
    icon: Users,
    title: "Analyst Agents",
    description:
      "Data, Financial, Sales, Marketing, Operations, and Executive Assistant agents — each with specialized workflows for root-cause analysis and narratives.",
  },
  {
    icon: Database,
    title: "Data Connectors",
    description:
      "PostgreSQL, Snowflake, BigQuery, Salesforce, Stripe, HubSpot, and more. MCP becomes the extension layer for custom integrations.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Generation",
    description:
      "Prompt: \"Build me a SaaS executive dashboard.\" Export React, PDF, slides, or embedded iframe.",
  },
  {
    icon: Shield,
    title: "Data Governance",
    description:
      "Audit log: who accessed what, which sources were queried, rows returned, and whether PII was exposed.",
  },
  {
    icon: Zap,
    title: "No SQL Required",
    description:
      "Ask business questions in plain English. AI creates queries, charts, explanations, and recommendations — you approve or modify.",
  },
  {
    icon: Clock,
    title: "Scheduled Intelligence",
    description:
      "Monday 8 AM: your weekly revenue briefing is ready — movement, pipeline, risks, opportunities, and recommended actions.",
  },
  {
    icon: Store,
    title: "MCP Marketplace",
    description:
      "Install Salesforce, Stripe, Snowflake, GitHub, Jira MCP servers in one click. Zapier for business intelligence.",
  },
  {
    icon: Lock,
    title: "Envelope Encryption",
    description:
      "AES-256-GCM with KMS/Vault envelope encryption. Your API keys never leave your control.",
  },
  {
    icon: BarChart3,
    title: "Explain This Metric",
    description:
      "Click ARR → \"Why is ARR up?\" The AI traces deals, expansions, churn, renewals, and pipeline into an executive narrative.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The self-hosted AI analyst that understands your business
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Connect your systems, define what metrics mean, ask questions, and get executive insights — without vendor lock-in.
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
