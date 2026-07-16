export interface ProjectIntelligence {
  framework: string;
  language: string;
  database: string;
  architecture: string;
  entryPoints: number;
  importantFiles: number;
  packageManager: string;
  detected: string[];
}

export interface StackDetection {
  items: string[];
  packageManager: "npm" | "pnpm" | "yarn" | "cargo" | "go";
}

const REPO_STACKS: Record<string, StackDetection & Partial<ProjectIntelligence>> = {
  "sales-dashboard": {
    items: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    packageManager: "npm",
    framework: "React",
    language: "TypeScript",
    database: "PostgreSQL",
    architecture: "SPA + API",
  },
  "buselligence": {
    items: ["React", "TypeScript", "Node.js", "SQLite", "Express"],
    packageManager: "npm",
    framework: "React + Express",
    language: "TypeScript",
    database: "SQLite",
    architecture: "Monorepo",
  },
  default: {
    items: ["React", "TypeScript", "Node.js"],
    packageManager: "npm",
    framework: "React",
    language: "TypeScript",
    database: "PostgreSQL",
    architecture: "Full-stack",
  },
};

export function detectStack(repoName: string): StackDetection {
  const key = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "");
  for (const [pattern, stack] of Object.entries(REPO_STACKS)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return { items: stack.items, packageManager: stack.packageManager };
    }
  }
  return REPO_STACKS.default!;
}

export function scanProject(repoName: string, stack: string[]): ProjectIntelligence {
  const key = repoName.toLowerCase();
  const preset = Object.entries(REPO_STACKS).find(([k]) => key.includes(k))?.[1] ?? REPO_STACKS.default!;

  const isMonorepo = stack.includes("Monorepo") || repoName.includes("monorepo");
  const isNext = key.includes("next") || stack.some((s) => s.toLowerCase().includes("next"));

  return {
    framework: isNext ? "Next.js" : (preset.framework ?? "React"),
    language: preset.language ?? "TypeScript",
    database: preset.database ?? "PostgreSQL",
    architecture: isMonorepo ? "Monorepo" : (preset.architecture ?? "Full-stack"),
    entryPoints: 8 + Math.floor(Math.random() * 8),
    importantFiles: 18 + Math.floor(Math.random() * 12),
    packageManager: preset.packageManager ?? "npm",
    detected: stack,
  };
}
