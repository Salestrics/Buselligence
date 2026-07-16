export interface MarketplaceItem {
  id: string;
  category: "agent" | "model" | "tool" | "skill" | "workflow" | "template" | "app" | "extension";
  name: string;
  description: string;
  author: string;
  installs: number;
  version: string;
}

export const MARKETPLACE_2_ITEMS: MarketplaceItem[] = [
  { id: "agent-sales", category: "agent", name: "Sales Analyst", description: "Pipeline and forecast analysis", author: "Buselligence", installs: 2100, version: "2.0" },
  { id: "agent-legal", category: "agent", name: "Legal Research Assistant", description: "Contract and compliance research", author: "Community", installs: 890, version: "1.2" },
  { id: "agent-tutor", category: "agent", name: "Python Tutor", description: "Adaptive Python teaching", author: "Community", installs: 1540, version: "1.5" },
  { id: "model-llama", category: "model", name: "Local Llama 3", description: "Run Llama 3 locally", author: "Meta", installs: 3200, version: "3.1" },
  { id: "tool-postgres", category: "tool", name: "PostgreSQL Connector", description: "Query any Postgres database", author: "Buselligence", installs: 4500, version: "2.1" },
  { id: "skill-seo", category: "skill", name: "SEO Writer", description: "SEO-optimized content generation", author: "Community", installs: 1200, version: "1.0" },
  { id: "workflow-onboard", category: "workflow", name: "Customer Onboarding", description: "Lead → opportunity → notify", author: "Buselligence", installs: 980, version: "1.3" },
  { id: "template-crm", category: "template", name: "SaaS CRM", description: "Full CRM app template", author: "Buselligence", installs: 1800, version: "2.0" },
  { id: "app-inventory", category: "app", name: "Inventory Manager", description: "Small business inventory", author: "Community", installs: 650, version: "1.1" },
  { id: "ext-vscode", category: "extension", name: "Studio Extension Pack", description: "Enhanced Monaco extensions", author: "Buselligence", installs: 420, version: "1.0" },
];

export function listMarketplace2(category?: string): MarketplaceItem[] {
  if (!category) return MARKETPLACE_2_ITEMS;
  return MARKETPLACE_2_ITEMS.filter((i) => i.category === category);
}

export function getMarketplaceCategories(): string[] {
  return ["agent", "model", "tool", "skill", "workflow", "template", "app", "extension"];
}
