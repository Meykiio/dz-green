import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const ADMIN_EMAIL = "e2e.admin@test.local";
const ADMIN_PASSWORD = "AdminPass123!";
const MOD2_EMAIL = "e2e.mod2@test.local";
const MOD2_PASSWORD = "Mod2Pass123!";
const MARKER_B = "ADMIN E2E - delete me B";
const MARKER_C = "ADMIN E2E - delete me C";

async function freshPage(browser: BrowserContext): Promise<Page> {
  const context = await browser.newContext({
    baseURL: "http://localhost:8081",
    geolocation: { latitude: 35.6969, longitude: -0.6333, accuracy: 20 },
    permissions: ["geolocation"],
  });
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
      // The first attempt may still be in flight (cold dev server). Wait for
      // the form to become actionable again before retrying.
      await expect(signIn).toBeEnabled({ timeout: 30_000 });
    }
  }
  throw new Error(`Sign-in failed for ${email}`);
}

test.describe.configure({ mode: "serial" });

test.describe("Admin role management (live)", () => {
  let adminPage: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:8081",
      geolocation: { latitude: 35.6969, longitude: -0.6333, accuracy: 20 },
      permissions: ["geolocation"],
    });
    adminPage = await context.newPage();
    await signIn(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test("admin sees users and assigns a wilaya", async () => {
    await adminPage.goto("/admin");
    await expect(adminPage.getByRole("heading", { name: "Moderators & roles" })).toBeVisible();

    const row = adminPage.locator("div.border-border.bg-card", { hasText: MOD2_EMAIL });
    // The server function can fail transiently on a cold dev server; reload
    // until the user list arrives.
    await expect(async () => {
      if ((await row.count()) === 0) await adminPage.reload();
      await expect(row).toHaveCount(1);
    }).toPass({ timeout: 60_000, intervals: [2_000, 5_000, 10_000] });
    await expect(row).toContainText("Moderator");
    await expect(row).toContainText("no wilayas assigned yet");

    await row.getByRole("button", { name: "Assign wilayas" }).click();
    await expect(adminPage.getByRole("dialog")).toContainText(MOD2_EMAIL);
    await adminPage.locator("label", { hasText: /^Oran$/ }).click();
    await adminPage.getByRole("button", { name: "Save" }).click();

    await expect(adminPage.getByText("Wilayas updated")).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText("1 wilaya: Oran", { timeout: 15_000 });
  });

  test("assigned moderator sees only that wilaya and approves", async ({ browser }) => {
    const mod2 = await freshPage(browser);
    await signIn(mod2, MOD2_EMAIL, MOD2_PASSWORD);
    await mod2.goto("/moderate");
    await expect(mod2.getByRole("heading", { name: "Pending plantings" })).toBeVisible();

    const rowB = mod2.locator("li", { hasText: MARKER_B });
    await expect(rowB).toHaveCount(1, { timeout: 30_000 });
    await expect(rowB).toContainText("Oran");
    await expect(mod2.locator("li", { hasText: MARKER_C })).toHaveCount(0);

    await rowB.getByRole("button", { name: "Approve" }).click();
    await expect(rowB).toHaveCount(0, { timeout: 30_000 });
    await mod2.close();
  });

  test("removing the wilaya and the role locks the moderator out", async ({ browser }) => {
    await adminPage.goto("/admin");
    const row = adminPage.locator("div.border-border.bg-card", { hasText: MOD2_EMAIL });
    await expect(row).toContainText("1 wilaya: Oran", { timeout: 15_000 });

    await row.getByRole("button", { name: "Assign wilayas" }).click();
    await adminPage.locator("label", { hasText: /^Oran$/ }).click();
    await adminPage.getByRole("button", { name: "Save" }).click();
    await expect(adminPage.getByText("Wilayas updated")).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText("no wilayas assigned yet", { timeout: 15_000 });

    await row.getByRole("button", { name: "Remove role" }).click();
    await expect(adminPage.getByText("Role updated")).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText("No role", { timeout: 15_000 });

    const mod2 = await freshPage(browser);
    await signIn(mod2, MOD2_EMAIL, MOD2_PASSWORD);
    await mod2.goto("/moderate");
    await expect(mod2).toHaveURL("/", { timeout: 20_000 });
    await mod2.close();
  });
});
