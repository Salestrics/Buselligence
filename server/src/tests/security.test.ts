import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertSafeApiBaseUrl, assertSafeMcpRemoteUrl } from "../security/url-policy.js";
import { sanitizeStdioEnv } from "../security/mcp-policy.js";
import { checkAnonymousLimit } from "../chat.js";

describe("url-policy", () => {
  it("blocks private MCP URLs", () => {
    assert.throws(() => assertSafeMcpRemoteUrl("http://127.0.0.1/mcp"));
  });

  it("allows public HTTPS MCP URLs", () => {
    const url = assertSafeMcpRemoteUrl("https://example.com/mcp");
    assert.equal(url.hostname, "example.com");
  });

  it("restricts API base URL hosts", () => {
    assert.throws(() => assertSafeApiBaseUrl("https://evil.example/exfil"));
    const allowed = assertSafeApiBaseUrl("https://api.openai.com/v1");
    assert.equal(allowed.hostname, "api.openai.com");
  });
});

describe("mcp-policy", () => {
  it("sanitizes stdio env keys", () => {
    const env = sanitizeStdioEnv({
      VALID_KEY: "ok",
      "bad-key": "nope",
      PATH: "/usr/bin",
    });
    assert.equal(env.VALID_KEY, "ok");
    assert.equal(env["bad-key"], undefined);
  });
});

describe("anonymous quota", () => {
  it("denies missing anonymous session", () => {
    const result = checkAnonymousLimit(undefined, false, false);
    assert.equal(result.allowed, false);
  });

  it("allows authenticated users", () => {
    const result = checkAnonymousLimit(undefined, true, false);
    assert.equal(result.allowed, true);
  });
});
