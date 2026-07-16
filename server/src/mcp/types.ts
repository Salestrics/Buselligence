export type McpTransport = "stdio" | "sse" | "http";

export interface McpStdioConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface McpRemoteConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface McpServerConfig {
  transport: McpTransport;
  stdio?: McpStdioConfig;
  remote?: McpRemoteConfig;
}

export interface McpServerRow {
  id: string;
  user_id: string;
  name: string;
  transport: McpTransport;
  config: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export interface McpServerPublic {
  id: string;
  name: string;
  transport: McpTransport;
  config: McpServerConfig;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface McpServerInput {
  name: string;
  transport: McpTransport;
  config: McpServerConfig;
  enabled?: boolean;
}

export interface McpTestResult {
  ok: boolean;
  toolCount: number;
  tools: Array<{ name: string; description?: string }>;
  message?: string;
}
