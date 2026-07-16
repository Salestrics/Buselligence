export type UserMode = "beginner" | "developer" | "enterprise";

export interface ModeConfig {
  mode: UserMode;
  label: string;
  description: string;
  interface: string;
  examples: string[];
  features: string[];
}

export const MODE_CONFIGS: Record<UserMode, ModeConfig> = {
  beginner: {
    mode: "beginner",
    label: "AI For Everyone",
    description: "Same platform, simpler interface. No coding required.",
    interface: "conversational",
    examples: [
      "Help me create a website for my bakery",
      "Track my business expenses",
      "Explain how to use social media for my shop",
    ],
    features: ["Natural language only", "Guided workflows", "App builder", "Learning system"],
  },
  developer: {
    mode: "developer",
    label: "Developer Mode",
    description: "Full studio access — Monaco IDE, Git, teams, lifecycle.",
    interface: "studio",
    examples: [
      "Modify React architecture for better performance",
      "Add multi-tenant auth middleware",
      "Refactor payment service with tests",
    ],
    features: ["Developer Studio", "AI Engineering Team", "Codebase engine", "Git workflows"],
  },
  enterprise: {
    mode: "enterprise",
    label: "Enterprise Mode",
    description: "Deploy agent workforces, collaborative workspaces, governance.",
    interface: "command_center",
    examples: [
      "Deploy agent workforce for customer support",
      "Set up team workspace with shared context",
      "Run security audit across all projects",
    ],
    features: [
      "Agent teams",
      "Collaborative workspaces",
      "Governance & audit",
      "Local/self-hosted deployment",
    ],
  },
};

export function getModeConfig(mode: UserMode): ModeConfig {
  return MODE_CONFIGS[mode];
}

export function listModes(): ModeConfig[] {
  return Object.values(MODE_CONFIGS);
}

export function adaptPromptForMode(prompt: string, mode: UserMode): string {
  if (mode === "beginner") {
    return `[Beginner Mode — explain simply, no jargon, guide step by step]\n${prompt}`;
  }
  if (mode === "enterprise") {
    return `[Enterprise Mode — include governance, team impact, and deployment considerations]\n${prompt}`;
  }
  return prompt;
}
