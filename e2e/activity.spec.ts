import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { pinEnglish, unmaskPii } from "./locale";

const ADMIN_EMAIL = "e2e.admin@test.local";
const ADMIN_PASSWORD = "AdminPass123!";
const MOD_EMAIL = "e2e.moderator@test.local";
const MOD_PASSWORD = "ModeratorPass123!";
const REG_EMAIL = "e2e.regular@test.local";
const REG_PASSWORD = "RegularPass123!";

async function freshPage(browser: BrowserContext): Promise<Page> {
  const context = await browser.newContext({ baseURL: "http://localhost:8081" });
  await pinEnglish(context);
  await unmaskPii(context);
  return context.newPage();
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/auth");
  await page.waitForLoadState("networkidle");
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const signIn = page.getByRole("button", { name: "Sign in" });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await signIn.click();
    try {
      await expect(page).toHaveURL("/", { timeout: 30_000 });
      return;
    } catch {
      if (page.url().endsWith("/")) return;
      await expect(signIn).toBeEnabled({ timeout: 30_000 });
    }
  }
  throw new Error(`Sign-in failed for ${email}`);
}

test.describe.configure({ mode: "serial" });

// Resource hygiene (see flows.spec.ts afterEach): close all contexts so
// leaked websockets and map instances can't starve the worker.
test.afterEach(async ({ browser }) => {
  for (const context of browser.contexts()) await context.close();
});

test.describe("Dashboards (live)", () => {
  test("signed-out visitors are sent to /auth from /activity", async ({ browser }) => {
    const page = await freshPage(browser);
    await page.goto("/activity");
    await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
  });

  test("a regular user sees their own activity across all three sections", async ({ browser }) => {
    const page = await freshPage(browser);
    await signIn(page, REG_EMAIL, REG_PASSWORD);
    await page.goto("/activity");
    await expect(page.getByRole("heading", { name: "Everything you've added to the map" })).toBeVisible({
      timeout: 30_000,
    });

    // The rows read "2 trees · Olive · in Alger" (the middle dot is part of
    // the row format), so match by species + wilaya.
    await expect(page.getByText(/2 trees · Olive.*Alger/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Under review").first()).toBeVisible();
    await expect(page.getByText(/5 trees · Aleppo pine.*Oran/)).toBeVisible();
    await expect(page.getByText("On the map").first()).toBeVisible();

    await expect(page.getByText("Watered")).toBeVisible();

    await expect(page.getByText("Alger · small")).toBeVisible();
    await expect(page.getByText("Active").first()).toBeVisible();

    // Nav carries the new link.
    await expect(page.locator('nav[aria-label="Main"]').getByText("My activity")).toBeVisible();
  });

  test("a user with no submissions gets the empty states", async ({ browser }) => {
    const page = await freshPage(browser);
    await signIn(page, MOD_EMAIL, MOD_PASSWORD);
    await page.goto("/activity");
    await expect(page.getByText("No plantings yet.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("No care logged yet.")).toBeVisible();
    await expect(page.getByText("No fire reports.")).toBeVisible();
  });

  test("the admin overview shows platform stats and wilaya oversight", async ({ browser }) => {
    const page = await freshPage(browser);
    await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Users")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Pending").first()).toBeVisible();
    await expect(page.getByText("Active fires").first()).toBeVisible();
    await expect(page.getByText("WILAYA OVERSIGHT")).toBeVisible();
    // exact: true — "Alger" is a substring of the hidden "Green Algeria"
    // brand in the off-canvas drawer, which .first() would otherwise hit.
    await expect(page.getByText("Alger", { exact: true })).toBeVisible({ timeout: 15_000 });
    // The role-management section is one tab over — confirm it mounts.
    await page.getByRole("tab", { name: "Users & roles" }).click();
    await expect(page.getByRole("heading", { name: "Users & roles" })).toBeVisible({
      timeout: 15_000,
    });
  });
});
