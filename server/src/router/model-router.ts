import type { ModelRouteDecision } from "../studio/types.js";

export type TaskType =
  | "simple_question"
  | "complex_analysis"
  | "code_generation"
  | "data_reasoning"
  | "documentation"
  | "code_review";

const ROUTING_TABLE: Record<TaskType, ModelRouteDecision> = {
  simple_question: {
    task: "simple_question",
    provider: "openai",
    model: "gpt-4o-mini",
    reason: "Fast, cost-effective for straightforward Q&A",
  },
  complex_analysis: {
    task: "complex_analysis",
    provider: "openai",
    model: "gpt-4o",
    reason: "Deep reasoning for financial and strategic analysis",
  },
  code_generation: {
    task: "code_generation",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    reason: "Strong code generation and refactoring",
  },
  data_reasoning: {
    task: "data_reasoning",
    provider: "openai",
    model: "gpt-4o",
    reason: "Specialized agent for SQL, metrics, and data lineage",
  },
  documentation: {
    task: "documentation",
    provider: "openai",
    model: "gpt-4o-mini",
    reason: "Efficient for docs, README, and release notes",
  },
  code_review: {
    task: "code_review",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    reason: "Thorough security and quality analysis",
  },
};

export function classifyTask(prompt: string): TaskType {
  const lower = prompt.toLowerCase();
  if (
    /create|build|generate|implement|fix|refactor|deploy/.test(lower) &&
    /code|app|api|component|dashboard|react|sql/.test(lower)
  ) {
    return "code_generation";
  }
  if (/review|audit|security|vulnerability/.test(lower)) return "code_review";
  if (/document|readme|api doc|release note/.test(lower)) return "documentation";
  if (/sql|query|metric|revenue|churn|pipeline|forecast/.test(lower))
    return "data_reasoning";
  if (/analyze|compare|why did|root cause|executive/.test(lower))
    return "complex_analysis";
  if (prompt.length < 100) return "simple_question";
  return "complex_analysis";
}

export function routeModel(prompt: string): ModelRouteDecision {
  const task = classifyTask(prompt);
  return ROUTING_TABLE[task];
}

export function listRoutes(): ModelRouteDecision[] {
  return Object.values(ROUTING_TABLE);
}

export interface RouterConfig {
  enabled: boolean;
  providers: Array<{
    id: string;
    name: string;
    models: string[];
    local?: boolean;
  }>;
  routing: ModelRouteDecision[];
}

export function getRouterConfig(): RouterConfig {
  return {
    enabled: true,
    providers: [
      { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "o1"] },
      {
        id: "anthropic",
        name: "Anthropic",
        models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
      },
      {
        id: "google",
        name: "Google",
        models: ["gemini-2.0-flash", "gemini-1.5-pro"],
      },
      {
        id: "local",
        name: "Local Models",
        models: ["llama3", "mistral", "codellama"],
        local: true,
      },
    ],
    routing: listRoutes(),
  };
}
