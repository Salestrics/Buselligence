import { test, expect } from "@playwright/test";

test.describe("Self-hosted API", () => {
  test("health endpoint reports v8 runtime", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.name).toBe("Buselligence");
    expect(body.version).toBe("8.0.0");
    expect(body.license).toBe("MIT");
  });

  test("studio API requires authentication", async ({ request }) => {
    const response = await request.get("/api/studio/projects");
    expect(response.status()).toBe(401);
  });
});
