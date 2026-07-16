import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", heading: "Give every person the power of AI" },
  { path: "/start", heading: "Your first 60 seconds with Buselligence" },
  { path: "/why", heading: "AI should be programmable, extensible, and owned by everyone" },
  { path: "/sign-in", heading: "Sign in" },
] as const;

test.describe("Public pages load", () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`${path} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, exact: false })).toBeVisible({
        timeout: 15_000,
      });
    });
  }

  test("landing page shows trademark attribution", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/Buselligence™ and The Buselligence Project™ are trademarks of Salestrics Inc/i)
    ).toBeVisible();
  });
});

test.describe("Visual snapshots", () => {
  test("landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Give every person/i })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("landing.png", { fullPage: true });
  });

  test("start page", async ({ page }) => {
    await page.goto("/start", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: /Your first 60 seconds with Buselligence/i })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("start.png", { fullPage: true });
  });

  test("sign-in demo page", async ({ page }) => {
    await page.goto("/sign-in?demo=1");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Demo account ready")).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("sign-in-demo.png", { fullPage: true });
  });
});
