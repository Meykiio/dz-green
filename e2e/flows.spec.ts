import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const API = "https://jnunqilxiajinylgehuh.supabase.co";
const ANON_KEY = "sb_publishable_qkH7kzDc8Dohru5j--104A_afZPeMmc";
const MOD_EMAIL = "e2e.moderator@test.local";
const MOD_PASSWORD = "ModeratorPass123!";
const MOD_ID = "11111111-1111-4111-8111-111111111111";

const ONE_PX_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==",
  "base64",
);

async function anonFetch(path: string): Promise<Response> {
  return fetch(`${API}/rest/v1${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
}

async function moderatorToken(): Promise<string> {
  const res = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: MOD_EMAIL, password: MOD_PASSWORD }),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Could not mint moderator token for E2E checks");
  return json.access_token;
}

async function modFetch(path: string, token: string): Promise<Response> {
  return fetch(`${API}/rest/v1${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
}

async function freshPage(browser: BrowserContext): Promise<Page> {
  const context = await browser.newContext({
    baseURL: "http://localhost:8081",
    geolocation: { latitude: 36.7538, longitude: 3.0588, accuracy: 20 },
    permissions: ["geolocation"],
  });
  return context.newPage();
}

test.describe.configure({ mode: "serial" });

test.describe("Green Algeria core flows (live)", () => {
  let plantedId = "";
  let plantMarker = "";
  let careMarker = "";
  let fireMarker = "";

  test.beforeAll(async () => {
    plantMarker = `E2E TEST - delete me plant ${Date.now()}`;
    careMarker = `E2E TEST - delete me care ${Date.now()}`;
    fireMarker = `E2E TEST - delete me fire ${Date.now()}`;
  });

  test("home page loads the public map", async ({ browser }) => {
    const page = await freshPage(browser);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("img", { name: /Interactive map of Algeria/ })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("anonymous planting lands as pending", async ({ browser }) => {
    const page = await freshPage(browser);
    await page.goto("/plant");
    await expect(page.getByRole("heading", { name: "I planted a tree" })).toBeVisible();
    const gpsButton = page.getByRole("button", { name: "Use my location" });
    await expect(gpsButton).toBeVisible({ timeout: 30_000 });

    // The click can land before hydration attaches the handler — retry until
    // the pin readout appears.
    const pinText = page.getByText(/Pin at 36\.75380, 3\.05880/);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await gpsButton.click();
      try {
        await expect(pinText).toBeVisible({ timeout: 8_000 });
        break;
      } catch {
        if (attempt === 2) throw new Error("GPS pin never appeared");
      }
    }

    const wilaya = page.locator("select").first();
    await expect(wilaya).toHaveValue("16");

    await page.locator('input[type="file"]').setInputFiles({
      name: "plant.jpg",
      mimeType: "image/jpeg",
      buffer: ONE_PX_JPEG,
    });
    await expect(page.locator('img[alt="Selected"]')).toBeVisible();

    await page.locator('input[type="number"]').fill("3");
    await page.getByPlaceholder("Aleppo pine, olive, eucalyptus…").fill("E2E Aleppo pine");
    await page.locator("textarea").fill(plantMarker);
    await page.locator('input[maxlength="80"]').fill("E2E Tester");

    await page.waitForTimeout(1300);
    await page.getByRole("button", { name: "Submit planting" }).click();
    await expect(page.getByRole("heading", { name: "Thank you — it's under review" })).toBeVisible({
      timeout: 60_000,
    });

    const token = await moderatorToken();
    const res = await modFetch(
      `/sites?select=id,status,notes,photo_url&notes=eq.${encodeURIComponent(plantMarker)}`,
      token,
    );
    const rows = (await res.json()) as Array<{
      id: string;
      status: string;
      notes: string;
      photo_url: string | null;
    }>;
    expect(res.status).toBe(200);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("pending");
    expect(rows[0].photo_url).not.toBeNull();
    plantedId = rows[0].id;
  });

  test("moderator approves the pending planting", async ({ browser }) => {
    expect(plantedId, "plant test must run first").not.toBe("");

    const page = await freshPage(browser);
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signIn = page.getByRole("button", { name: "Sign in" });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await emailInput.fill(MOD_EMAIL);
      await passwordInput.fill(MOD_PASSWORD);
      await signIn.click();
      try {
        await expect(page).toHaveURL("/", { timeout: 30_000 });
        break;
      } catch {
        if (page.url().endsWith("/")) break;
        // The first attempt may still be in flight (cold dev server). Wait for
        // the form to become actionable again before retrying.
        await expect(signIn).toBeEnabled({ timeout: 30_000 });
      }
    }
    await expect(page).toHaveURL("/");

    await page.goto("/moderate");
    await expect(page.getByRole("heading", { name: "Pending plantings" })).toBeVisible();

    const row = page.locator("li").filter({ hasText: plantMarker });
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await page.locator(`#note-${plantedId}`).fill("E2E TEST - approved ok");
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(row).toHaveCount(0, { timeout: 30_000 });

    const token = await moderatorToken();
    const res = await modFetch(
      `/sites?select=status,reviewed_by,reviewed_at,moderator_notes&id=eq.${plantedId}`,
      token,
    );
    const rows = (await res.json()) as Array<{
      status: string;
      reviewed_by: string | null;
      reviewed_at: string | null;
      moderator_notes: string | null;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("approved");
    expect(rows[0].reviewed_by).toBe(MOD_ID);
    expect(rows[0].reviewed_at).not.toBeNull();
    expect(rows[0].moderator_notes).toBe("E2E TEST - approved ok");
  });

  test("anonymous care log lands on the approved site", async ({ browser }) => {
    expect(plantedId, "plant test must run first").not.toBe("");

    const page = await freshPage(browser);
    await page.goto(`/care?site=${plantedId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Log care" })).toBeVisible();
    await expect(page.locator("select").first()).toHaveValue(plantedId);

    await page.getByRole("button", { name: "Checked on it" }).click();
    await page.locator("textarea").fill(careMarker);
    await page.waitForTimeout(1300);
    await page.getByRole("button", { name: "Log care" }).click();
    await expect(page.getByRole("heading", { name: "Care logged" })).toBeVisible({
      timeout: 30_000,
    });

    const res = await anonFetch(
      `/care_logs?select=site_id,action,notes&site_id=eq.${plantedId}&order=created_at.desc&limit=1`,
    );
    const rows = (await res.json()) as Array<{ site_id: string; action: string; notes: string }>;
    expect(res.status).toBe(200);
    expect(rows).toHaveLength(1);
    expect(rows[0].site_id).toBe(plantedId);
    expect(rows[0].action).toBe("checked");
    expect(rows[0].notes).toBe(careMarker);
  });

  test("fire report publishes as active with the Protection Civile disclaimer", async ({
    browser,
  }) => {
    const page = await freshPage(browser);
    await page.goto("/fire");
    await expect(page.getByText(/Call Protection Civile first: 14/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Report a fire" })).toBeVisible();
    const gpsButton = page.getByRole("button", { name: "Use my location" });
    await expect(gpsButton).toBeVisible({ timeout: 30_000 });

    // The click can land before hydration attaches the handler — retry until
    // the pin readout appears.
    const pinText = page.getByText(/Pin at 36\.75380, 3\.05880/);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await gpsButton.click();
      try {
        await expect(pinText).toBeVisible({ timeout: 8_000 });
        break;
      } catch {
        if (attempt === 2) throw new Error("GPS pin never appeared");
      }
    }

    await page.getByRole("button", { name: "Large / spreading" }).click();
    await page.locator("textarea").fill(fireMarker);
    await page.locator('input[maxlength="80"]').fill("E2E Reporter");
    await page.locator('input[type="tel"]').fill("0550 11 22 33");

    await page.waitForTimeout(1300);
    await page.getByRole("button", { name: "Post fire report" }).click();
    await expect(page.getByRole("heading", { name: "Report posted" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/call Protection Civile on 14/)).toBeVisible();

    const res = await anonFetch(
      `/fire_reports?select=status,severity,description,lat,lng&description=eq.${encodeURIComponent(fireMarker)}`,
    );
    const rows = (await res.json()) as Array<{
      status: string;
      severity: string;
      lat: number;
      lng: number;
    }>;
    expect(res.status).toBe(200);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("active");
    expect(rows[0].severity).toBe("large");
    expect(Math.abs(rows[0].lat - 36.7538)).toBeLessThan(0.01);
    expect(Math.abs(rows[0].lng - 3.0588)).toBeLessThan(0.01);

    const pii = await anonFetch(
      `/fire_reports?select=reporter_name&description=eq.${encodeURIComponent(fireMarker)}`,
    );
    expect(pii.status).toBe(401);
  });
});
