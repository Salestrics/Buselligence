export type LifecycleStage =
  | "idea"
  | "planning"
  | "architecture"
  | "development"
  | "testing"
  | "security_review"
  | "deployment"
  | "monitoring"
  | "optimization";

export interface LifecycleState {
  currentStage: LifecycleStage;
  stages: Array<{
    stage: LifecycleStage;
    status: "completed" | "active" | "pending";
    artifacts: string[];
  }>;
  progress: number;
}

const STAGE_ORDER: LifecycleStage[] = [
  "idea",
  "planning",
  "architecture",
  "development",
  "testing",
  "security_review",
  "deployment",
  "monitoring",
  "optimization",
];

export function getLifecycleState(projectStatus?: string): LifecycleState {
  const stageMap: Record<string, LifecycleStage> = {
    planning: "planning",
    executing: "development",
    completed: "monitoring",
    paused: "planning",
  };

  const current = stageMap[projectStatus ?? "planning"] ?? "planning";
  const currentIdx = STAGE_ORDER.indexOf(current);

  const stages = STAGE_ORDER.map((stage, i) => ({
    stage,
    status: (i < currentIdx ? "completed" : i === currentIdx ? "active" : "pending") as
      | "completed"
      | "active"
      | "pending",
    artifacts: getArtifacts(stage),
  }));

  return {
    currentStage: current,
    stages,
    progress: Math.round((currentIdx / (STAGE_ORDER.length - 1)) * 100),
  };
}

function getArtifacts(stage: LifecycleStage): string[] {
  const artifacts: Record<LifecycleStage, string[]> = {
    idea: ["Problem statement", "User personas"],
    planning: ["Requirements doc", "Sprint plan", "Task breakdown"],
    architecture: ["System diagram", "API spec", "Database schema"],
    development: ["Source code", "Components", "API endpoints"],
    testing: ["Unit tests", "Integration tests", "Test coverage report"],
    security_review: ["Security scan", "Dependency audit", "OWASP checklist"],
    deployment: ["Deploy config", "Environment vars", "Health checks"],
    monitoring: ["Metrics dashboard", "Alert rules", "Logs"],
    optimization: ["Performance report", "Cost analysis", "Recommendations"],
  };
  return artifacts[stage];
}
