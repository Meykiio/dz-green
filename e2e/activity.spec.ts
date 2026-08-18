import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const ADMIN_EMAIL = "e2e.admin@test.local";
const ADMIN_PASSWORD = "AdminPass123!";
const MOD_EMAIL = "e2e.moderator@test.local";
const MOD_PASSWORD = "ModeratorPass123!";
const REG_EMAIL = "e2e.regular@test.local";
const REG_PASSWORD = "RegularPass123!";

async function freshPage(browser: BrowserContext): Promise<Page> {
  const context = await browser.newContext({ baseURL: "http://localhost:8081" });
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
    await expect(page.getByRole("heading", { name: "Everything you've added to the map" })).toBeVisible();

    await expect(page.getByText("2 trees · Olive in Alger")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Under review").first()).toBeVisible();
    await expect(page.getByText("5 trees · Aleppo pine in Oran")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("Users")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Pending").first()).toBeVisible();
    await expect(page.getByText("Active fires").first()).toBeVisible();
    await expect(page.getByText("WILAYA OVERSIGHT")).toBeVisible();
    await expect(page.getByText("Alger").first()).toBeVisible();
    // The role-management section is still intact below.
    await expect(page.getByRole("heading", { name: "Moderators & roles" })).toBeVisible();
  });
});
