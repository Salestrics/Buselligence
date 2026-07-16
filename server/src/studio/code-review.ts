import type { CodeReviewResult } from "./types.js";

const SECRET_PATTERNS = [
  /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
  /password\s*=\s*['"][^'"]+['"]/i,
  /sk-[a-zA-Z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
];

const SLOW_QUERY_PATTERNS = [
  /SELECT\s+\*\s+FROM/i,
  /LIKE\s+'%.*%'/i,
  /CROSS\s+JOIN/i,
  /NOT\s+IN\s*\(/i,
];

export function reviewCode(
  files: Array<{ path: string; content: string }>
): CodeReviewResult {
  const security: CodeReviewResult["security"] = [];
  const performance: CodeReviewResult["performance"] = [];
  const quality: CodeReviewResult["quality"] = [];
  const suggestions: string[] = [];

  for (const file of files) {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(file.content)) {
        security.push({
          status: "fail",
          message: `Possible exposed secret in ${file.path}`,
        });
      }
    }

    if (file.path.endsWith(".sql")) {
      for (const pattern of SLOW_QUERY_PATTERNS) {
        if (pattern.test(file.content)) {
          performance.push({
            status: "warn",
            message: `Database query may be slow in ${file.path}`,
          });
        }
      }
    }

    if (file.path.endsWith(".ts") || file.path.endsWith(".tsx")) {
      if (!file.content.includes("interface") && !file.content.includes("type ")) {
        quality.push({
          status: "warn",
          message: `Consider adding TypeScript types in ${file.path}`,
        });
      } else {
        quality.push({
          status: "pass",
          message: `Type safety maintained in ${file.path}`,
        });
      }
    }
  }

  if (security.length === 0) {
    security.push({ status: "pass", message: "No exposed secrets detected" });
  }

  if (performance.length === 0) {
    performance.push({ status: "pass", message: "No performance concerns detected" });
  }

  if (quality.length === 0) {
    quality.push({ status: "pass", message: "Code quality looks good" });
  }

  if (performance.some((p) => p.status === "warn")) {
    suggestions.push("Add indexes on frequently filtered columns");
    suggestions.push("Consider pagination for large result sets");
    suggestions.push("Use EXPLAIN ANALYZE to validate query plans");
  }

  const passed = !security.some((s) => s.status === "fail");

  return { passed, security, performance, quality, suggestions };
}

export const CODE_REVIEW_AGENT_PROMPT = `You are the Buselligence AI Code Review Agent. Before deployment, review code for:

1. **Security** — exposed secrets, SQL injection, XSS, auth bypass
2. **Performance** — slow queries, N+1 problems, missing indexes
3. **Quality** — type safety, error handling, test coverage

Output a structured review with pass/warn/fail for each category and actionable suggestions.`;
