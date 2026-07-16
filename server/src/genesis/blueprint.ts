import type { ParsedIdea } from "./parser.js";

export interface ProjectBlueprint {
  name: string;
  tagline: string;
  architecture: string[];
  modules: string[];
  stack: string[];
}

export interface ProductRoadmap {
  sprints: Array<{
    number: number;
    name: string;
    tasks: string[];
    status: "pending" | "active" | "completed";
  }>;
}

export function createBlueprint(idea: ParsedIdea): ProjectBlueprint {
  const arch = [
    idea.isMultiTenant ? "Multi-tenant SaaS" : "Single-tenant application",
    "PostgreSQL database",
    "React frontend",
    "REST API layer",
    "Authentication & sessions",
    "Role-based permissions",
  ];
  if (idea.hasAiAssistant) arch.push("AI assistant");

  return {
    name: idea.projectName,
    tagline: `From idea to application — ${idea.domain} platform`,
    architecture: arch,
    modules: idea.modules,
    stack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Buselligence Kernel"],
  };
}

export function createRoadmap(idea: ParsedIdea): ProductRoadmap {
  const mods = idea.modules;
  const sprint1Tasks = ["User accounts", `${idea.domain} setup`, mods[0] ? `${mods[0]} tracking` : "Core data model"];
  const sprint2Tasks = [
    mods[1] ? `${mods[1]} management` : "Integrations",
    "Reporting dashboard",
  ];
  const sprint3Tasks = ["AI recommendations", "Workflow automation", "Deploy & preview"];

  return {
    sprints: [
      { number: 1, name: "Sprint 1 — Foundation", tasks: sprint1Tasks, status: "pending" },
      { number: 2, name: "Sprint 2 — Growth", tasks: sprint2Tasks, status: "pending" },
      { number: 3, name: "Sprint 3 — Intelligence", tasks: sprint3Tasks, status: "pending" },
    ],
  };
}

export interface PreviewNav {
  label: string;
  children?: string[];
}

export function createPreview(idea: ParsedIdea): { title: string; navigation: PreviewNav[] } {
  return {
    title: idea.projectName,
    navigation: [
      { label: "Dashboard" },
      ...idea.modules.map((m) => ({ label: m })),
      { label: "Reports" },
      { label: "AI Assistant" },
    ],
  };
}
