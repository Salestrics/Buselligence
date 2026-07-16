const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /\.internal$/i,
  /\.local$/i,
];

const ALLOWED_PROVIDER_HOSTS = new Set([
  "api.openai.com",
  "api.anthropic.com",
  "generativelanguage.googleapis.com",
  "api.github.com",
  "github.com",
]);

function isPrivateHost(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

export function assertSafeOutboundUrl(
  rawUrl: string,
  options?: { allowLocalhost?: boolean; purpose?: string }
): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL${options?.purpose ? ` for ${options.purpose}` : ""}`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  const host = parsed.hostname.toLowerCase();

  if (options?.allowLocalhost && (host === "localhost" || host === "127.0.0.1")) {
    return parsed;
  }

  if (isPrivateHost(host)) {
    throw new Error("Private and internal network URLs are not allowed");
  }

  return parsed;
}

export function assertSafeMcpRemoteUrl(rawUrl: string): URL {
  return assertSafeOutboundUrl(rawUrl, { purpose: "MCP remote transport" });
}

export function assertSafeApiBaseUrl(rawUrl: string): URL {
  const parsed = assertSafeOutboundUrl(rawUrl, {
    allowLocalhost: process.env.NODE_ENV !== "production",
    purpose: "API base URL",
  });

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error("API base URL must use HTTPS in production");
  }

  const host = parsed.hostname.toLowerCase();
  const allowed =
    ALLOWED_PROVIDER_HOSTS.has(host) ||
    host.endsWith(".openai.azure.com") ||
    (process.env.NODE_ENV !== "production" &&
      (host === "localhost" || host === "127.0.0.1"));

  if (!allowed) {
    throw new Error(
      "API base URL host is not on the provider allowlist. Use your provider's official API endpoint."
    );
  }

  return parsed;
}

export function assertSafePostgresHost(host: string): void {
  const normalized = host.toLowerCase().trim();
  if (!normalized) {
    throw new Error("Database host is required");
  }
  if (isPrivateHost(normalized) && process.env.ALLOW_PRIVATE_DB_HOSTS !== "true") {
    throw new Error(
      "Private database hosts are blocked. Set ALLOW_PRIVATE_DB_HOSTS=true only in trusted local dev."
    );
  }
}
