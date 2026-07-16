export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  org: string;
  description?: string;
  language?: string;
  defaultBranch: string;
}

export interface GitHubOrg {
  id: string;
  name: string;
  login: string;
}

export const DEMO_ORGS: GitHubOrg[] = [
  { id: "1", name: "Salestrics", login: "Salestrics" },
  { id: "2", name: "Personal", login: "personal" },
];

export const DEMO_REPOS: GitHubRepo[] = [
  {
    id: "r1",
    name: "sales-dashboard",
    fullName: "Salestrics/sales-dashboard",
    org: "Salestrics",
    description: "Sales analytics dashboard with AI insights",
    language: "TypeScript",
    defaultBranch: "main",
  },
  {
    id: "r2",
    name: "Buselligence",
    fullName: "Salestrics/Buselligence",
    org: "Salestrics",
    description: "Open-source AI runtime",
    language: "TypeScript",
    defaultBranch: "main",
  },
  {
    id: "r3",
    name: "crm-platform",
    fullName: "Salestrics/crm-platform",
    org: "Salestrics",
    description: "Multi-tenant CRM",
    language: "TypeScript",
    defaultBranch: "main",
  },
  {
    id: "r4",
    name: "ai-experiment",
    fullName: "personal/ai-experiment",
    org: "personal",
    description: "Agent experiments",
    language: "Python",
    defaultBranch: "main",
  },
];

export function listOrgs(): GitHubOrg[] {
  return DEMO_ORGS;
}

export function listRepos(org?: string): GitHubRepo[] {
  if (!org) return DEMO_REPOS;
  return DEMO_REPOS.filter((r) => r.org === org);
}

export function getRepo(fullName: string): GitHubRepo | null {
  return DEMO_REPOS.find((r) => r.fullName === fullName || r.name === fullName) ?? null;
}

export interface GitHubConnection {
  connected: boolean;
  username: string;
  avatarUrl?: string;
}

export function getGitHubConnection(userId: string): GitHubConnection {
  return {
    connected: true,
    username: "demo-developer",
    avatarUrl: "https://github.com/identicons/demo.png",
  };
}
