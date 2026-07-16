export interface TeamMember {
  id: string;
  role: string;
  title: string;
  objectives: string[];
  tools: string[];
  hasMemory: boolean;
}

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  lead: TeamMember;
  members: TeamMember[];
}

export const ENGINEERING_TEAM: AgentTeam = {
  id: "engineering",
  name: "AI Engineering Team",
  description: "Full-stack development team with specialized roles",
  lead: {
    id: "lead_architect",
    role: "Lead Architect",
    title: "Lead Architect",
    objectives: ["System design", "Technical decisions", "Team coordination"],
    tools: ["architecture_design", "code_review", "planning"],
    hasMemory: true,
  },
  members: [
    {
      id: "frontend_engineer",
      role: "Frontend Engineer",
      title: "Frontend Engineer",
      objectives: ["React/UI components", "State management", "Responsive design"],
      tools: ["react_codegen", "css_design", "component_library"],
      hasMemory: true,
    },
    {
      id: "backend_engineer",
      role: "Backend Engineer",
      title: "Backend Engineer",
      objectives: ["API design", "Business logic", "Integrations"],
      tools: ["api_codegen", "node_express", "mcp_tools"],
      hasMemory: true,
    },
    {
      id: "database_engineer",
      role: "Database Engineer",
      title: "Database Engineer",
      objectives: ["Schema design", "Query optimization", "Migrations"],
      tools: ["sql_codegen", "schema_explorer", "explain_plan"],
      hasMemory: true,
    },
    {
      id: "qa_engineer",
      role: "QA Engineer",
      title: "QA Engineer",
      objectives: ["Test coverage", "Edge cases", "Regression prevention"],
      tools: ["test_generation", "test_runner", "coverage_report"],
      hasMemory: true,
    },
    {
      id: "security_engineer",
      role: "Security Engineer",
      title: "Security Engineer",
      objectives: ["Vulnerability scanning", "Secret detection", "OWASP compliance"],
      tools: ["security_scan", "dependency_audit", "permission_review"],
      hasMemory: true,
    },
    {
      id: "devops_engineer",
      role: "DevOps Engineer",
      title: "DevOps Engineer",
      objectives: ["CI/CD", "Deployment", "Monitoring"],
      tools: ["deploy", "docker", "monitoring"],
      hasMemory: true,
    },
  ],
};

export const PRODUCT_TEAM: AgentTeam = {
  id: "product",
  name: "AI Product Team",
  description: "Product planning, requirements, and delivery",
  lead: {
    id: "project_manager",
    role: "Project Manager",
    title: "Autonomous Project Manager",
    objectives: ["Sprint planning", "Task decomposition", "Progress tracking"],
    tools: ["planning", "task_management", "execution"],
    hasMemory: true,
  },
  members: [
    {
      id: "product_analyst",
      role: "Product Analyst",
      title: "Requirements Analyst",
      objectives: ["Gather requirements", "User stories", "Acceptance criteria"],
      tools: ["requirements_analysis", "user_stories"],
      hasMemory: true,
    },
    {
      id: "ux_designer",
      role: "UX Designer",
      title: "UX Designer",
      objectives: ["UI mapping", "User flows", "Design system"],
      tools: ["design_studio", "wireframes"],
      hasMemory: true,
    },
  ],
};

export const ALL_TEAMS: AgentTeam[] = [ENGINEERING_TEAM, PRODUCT_TEAM];

export function listTeams(): AgentTeam[] {
  return ALL_TEAMS;
}

export function getTeam(teamId: string): AgentTeam | null {
  return ALL_TEAMS.find((t) => t.id === teamId) ?? null;
}

export function assignTaskToTeam(
  teamId: string,
  task: string
): { team: string; assignments: Array<{ role: string; task: string }> } {
  const team = getTeam(teamId);
  if (!team) return { team: "unknown", assignments: [] };

  const assignments: Array<{ role: string; task: string }> = [
    { role: team.lead.role, task: `Coordinate: ${task}` },
  ];

  const lower = task.toLowerCase();
  for (const member of team.members) {
    if (
      (lower.includes("ui") || lower.includes("frontend") || lower.includes("react")) &&
      member.role.includes("Frontend")
    ) {
      assignments.push({ role: member.role, task });
    } else if (
      (lower.includes("api") || lower.includes("backend")) &&
      member.role.includes("Backend")
    ) {
      assignments.push({ role: member.role, task });
    } else if (
      (lower.includes("database") || lower.includes("schema") || lower.includes("sql")) &&
      member.role.includes("Database")
    ) {
      assignments.push({ role: member.role, task });
    } else if (
      (lower.includes("test") || lower.includes("qa")) &&
      member.role.includes("QA")
    ) {
      assignments.push({ role: member.role, task });
    } else if (
      (lower.includes("security") || lower.includes("auth")) &&
      member.role.includes("Security")
    ) {
      assignments.push({ role: member.role, task });
    } else if (
      (lower.includes("deploy") || lower.includes("ci")) &&
      member.role.includes("DevOps")
    ) {
      assignments.push({ role: member.role, task });
    }
  }

  if (assignments.length === 1) {
    assignments.push({ role: team.members[0]!.role, task });
  }

  return { team: team.name, assignments };
}
