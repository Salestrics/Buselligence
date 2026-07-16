export const OPEN_AGENT_PROTOCOL = {
  name: "Open Agent Protocol (OAP)",
  version: "1.0.0",
  description:
    "Buselligence standard for complete AI workers — like MCP, but for agents with memory, permissions, and lifecycle.",
  spec: {
    agentManifest: {
      required: ["id", "name", "version", "capabilities", "tools", "permissions"],
      optional: ["memory", "objectives", "team", "lifecycle"],
      example: {
        id: "sales-analyst",
        name: "Sales Analyst",
        version: "1.0.0",
        capabilities: ["pipeline_analysis", "forecasting"],
        tools: ["salesforce_mcp", "data_query"],
        permissions: ["read:data", "write:reports"],
        memory: { scope: "project", retention: "30d" },
        objectives: ["Analyze pipeline health", "Forecast revenue"],
        team: "business",
        lifecycle: ["plan", "execute", "report"],
      },
    },
    toolSchema: {
      format: "json-schema",
      transport: ["mcp", "http", "stdio"],
    },
    memoryFormat: {
      types: ["fact", "decision", "preference", "context"],
      storage: ["local", "encrypted", "user-owned"],
    },
    permissionsModel: {
      levels: ["read", "write", "execute", "deploy", "admin"],
      scopes: ["user", "project", "team", "organization"],
    },
    executionLifecycle: {
      stages: ["idle", "planning", "reasoning", "executing", "reviewing", "completed", "failed"],
      events: ["plan_created", "tool_called", "memory_updated", "review_passed", "deployed"],
    },
  },
};

export function validateAgentManifest(manifest: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const required = OPEN_AGENT_PROTOCOL.spec.agentManifest.required;
  const errors: string[] = [];

  for (const field of required) {
    if (!(field in manifest)) errors.push(`Missing required field: ${field}`);
  }

  return { valid: errors.length === 0, errors };
}
