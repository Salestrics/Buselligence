import { test, expect } from "@playwright/test";

test.describe("Demo authentication", () => {
  test("authenticated studio API returns projects", async ({ page }) => {
    await page.goto("/workspace");
    const response = await page.request.get("/api/studio/projects");

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.projects).toBeDefined();
    expect(Array.isArray(body.projects)).toBeTruthy();
  });

  test("protected product pages load after sign-in", async ({ page }) => {
    const routes = [
      { path: "/kernel", heading: "Unified AI Runtime" },
      { path: "/build", heading: "Describe it. Watch it come alive." },
      { path: "/desktop", heading: "Buselligence is an AI computer for developers." },
      { path: "/workspace", heading: "Your AI-powered workspace" },
    ] as const;

    for (const { path, heading } of routes) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, exact: false })).toBeVisible({
        timeout: 20_000,
      });
    }
  });
});
