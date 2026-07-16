export interface ProjectTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  skills: string[];
  agents: string[];
  path: string;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    slug: "ai-chatbot",
    name: "AI Chatbot",
    description: "Conversational AI with memory and tool use",
    category: "ai",
    skills: ["teach-concept"],
    agents: ["universal_assistant"],
    path: "examples/ai-chatbot",
  },
  {
    slug: "autonomous-agent",
    name: "Autonomous Agent",
    description: "Self-directed agent with planning and execution",
    category: "agents",
    skills: ["build-react-app", "deploy-application"],
    agents: ["software_engineer"],
    path: "examples/autonomous-agent",
  },
  {
    slug: "crm-app",
    name: "CRM App",
    description: "Customer relationship management with AI insights",
    category: "apps",
    skills: ["analyze-database", "generate-api"],
    agents: ["business_analyst"],
    path: "examples/crm-app",
  },
  {
    slug: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Data visualization and business intelligence",
    category: "data",
    skills: ["analyze-metrics", "analyze-database"],
    agents: ["data_analyst"],
    path: "examples/analytics-dashboard",
  },
  {
    slug: "coding-agent",
    name: "Coding Agent",
    description: "AI pair programmer with codebase context",
    category: "development",
    skills: ["build-react-app", "review-security"],
    agents: ["software_engineer", "code_review"],
    path: "examples/coding-agent",
  },
  {
    slug: "mcp-server",
    name: "MCP Server",
    description: "Custom Model Context Protocol server",
    category: "integration",
    skills: ["generate-api"],
    agents: [],
    path: "examples/mcp-server",
  },
  {
    slug: "rag-system",
    name: "RAG System",
    description: "Retrieval-augmented generation with local embeddings",
    category: "ai",
    skills: ["analyze-database"],
    agents: ["research_assistant"],
    path: "examples/rag-system",
  },
  {
    slug: "saas-builder",
    name: "SaaS Builder",
    description: "Full-stack SaaS with auth, billing, and AI features",
    category: "apps",
    skills: ["build-react-app", "generate-api", "deploy-application"],
    agents: ["software_engineer", "product_manager"],
    path: "examples/saas-builder",
  },
];

export function listTemplates(): ProjectTemplate[] {
  return PROJECT_TEMPLATES;
}

export function getTemplate(slug: string): ProjectTemplate | null {
  return PROJECT_TEMPLATES.find((t) => t.slug === slug) ?? null;
}
