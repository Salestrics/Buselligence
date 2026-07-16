import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = path.join(import.meta.dirname, ".auth", "demo-user.json");

setup("authenticate demo user", async ({ page }) => {
  await page.goto("/sign-in?demo=1&next=/start");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/start/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", { name: /Your first 60 seconds with Buselligence/i })
  ).toBeVisible();

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
