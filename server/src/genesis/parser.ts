export interface ParsedIdea {
  projectName: string;
  domain: string;
  modules: string[];
  isMultiTenant: boolean;
  hasAiAssistant: boolean;
}

const MODULE_KEYWORDS: Record<string, string[]> = {
  inventory: ["inventory", "stock", "warehouse", "ingredients"],
  suppliers: ["supplier", "vendor", "procurement", "supply chain"],
  employees: ["employee", "staff", "scheduling", "payroll", "hr"],
  loyalty: ["loyalty", "rewards", "customer retention", "points"],
  analytics: ["analytics", "reporting", "insights", "metrics", "dashboard"],
  orders: ["orders", "ordering", "pos", "checkout"],
  customers: ["customer", "crm", "contacts"],
  menu: ["menu", "dishes", "recipes"],
  reservations: ["reservation", "booking", "tables"],
};

export function parseIdea(prompt: string): ParsedIdea {
  const lower = prompt.toLowerCase();
  const modules = new Set<string>();

  for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      modules.add(module.charAt(0).toUpperCase() + module.slice(1));
    }
  }

  if (modules.size === 0) {
    ["Inventory", "Suppliers", "Employees", "Analytics"].forEach((m) => modules.add(m));
  }

  const domain = detectDomain(lower);
  const projectName = generateProjectName(prompt, domain);

  return {
    projectName,
    domain,
    modules: Array.from(modules),
    isMultiTenant: lower.includes("saas") || lower.includes("multi-tenant") || lower.includes("platform"),
    hasAiAssistant: true,
  };
}

function detectDomain(lower: string): string {
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("kitchen")) return "restaurant";
  if (lower.includes("crm") || lower.includes("sales")) return "crm";
  if (lower.includes("inventory") || lower.includes("warehouse")) return "inventory";
  if (lower.includes("health") || lower.includes("clinic")) return "healthcare";
  if (lower.includes("education") || lower.includes("school")) return "education";
  return "business";
}

function generateProjectName(prompt: string, domain: string): string {
  const restaurant = prompt.match(/restaurant[s]?/i);
  if (restaurant || domain === "restaurant") return "RestaurantOS";

  const named = prompt.match(/(?:build|create)\s+(?:a\s+)?(?:platform\s+(?:that|for)\s+)?(.+?)(?:\s+manage|\s+help|\s+for|\s*$)/i);
  if (named?.[1]) {
    const words = named[1]
      .replace(/[^a-zA-Z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "that", "helps", "local", "platform"].includes(w.toLowerCase()))
      .slice(0, 2);
    if (words.length) {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("") + "OS";
    }
  }

  const domainNames: Record<string, string> = {
    restaurant: "RestaurantOS",
    crm: "SalesHub",
    inventory: "InventoryOS",
    healthcare: "HealthOS",
    education: "EduPlatform",
    business: "BusinessOS",
  };
  return domainNames[domain] ?? "AppOS";
}
