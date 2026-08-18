import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const API = "https://jnunqilxiajinylgehuh.supabase.co";
const ANON_KEY = "sb_publishable_qkH7kzDc8Dohru5j--104A_afZPeMmc";
const MOD_EMAIL = "e2e.moderator@test.local";
const MOD_PASSWORD = "ModeratorPass123!";

const ONE_PX_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==",
  "base64",
);

async function freshPage(browser: BrowserContext): Promise<Page> {
  const context = await browser.newContext({
    baseURL: "http://localhost:8081",
    geolocation: { latitude: 36.7538, longitude: 3.0588, accuracy: 20 },
    permissions: ["geolocation"],
  });
  return context.newPage();
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

async function fillPlantForm(page: Page, marker: string): Promise<void> {
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
  await page.locator('input[type="file"]').setInputFiles({
    name: "plant.jpg",
    mimeType: "image/jpeg",
    buffer: ONE_PX_JPEG,
  });
  await expect(page.locator('img[alt="Selected"]')).toBeVisible();
  await page.locator('input[type="number"]').fill("1");
  await page.locator("textarea").fill(marker);
  await page.waitForTimeout(1300);
}

test.describe.configure({ mode: "serial" });

test.describe("Receipt links and silent drops (live)", () => {
  let receiptToken = "";
  let marker = "";

  test.beforeAll(() => {
    marker = `E2E TEST - delete me receipt ${Date.now()}`;
  });

  test("receipt link round-trips pending then approved", async ({ browser }) => {
    const page = await freshPage(browser);
    await fillPlantForm(page, marker);
    await page.getByRole("button", { name: "Submit planting" }).click();
    await expect(page.getByRole("heading", { name: "Thank you — it's under review" })).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByText("Save your receipt link")).toBeVisible();
    const href = await page.locator('a[href^="/my/"]').getAttribute("href");
    expect(href).toBeTruthy();
    receiptToken = href!.split("/my/")[1]!;

    await page.goto(`/my/${receiptToken}`);
    await expect(page.getByText("Under review")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Tree planting")).toBeVisible();

    // Moderator approves the row.
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill(MOD_EMAIL);
    await page.locator('input[type="password"]').fill(MOD_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/", { timeout: 30_000 });
    await page.goto("/moderate");
    await expect(page.getByRole("heading", { name: "Pending plantings" })).toBeVisible();
    const row = page.locator("li").filter({ hasText: marker });
    await expect(row).toHaveCount(1, { timeout: 30_000 });
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(row).toHaveCount(0, { timeout: 30_000 });

    await page.goto(`/my/${receiptToken}`);
    await expect(page.getByText("Approved — on the map")).toBeVisible({ timeout: 15_000 });
  });

  test("unknown receipt tokens get a friendly not-found", async ({ browser }) => {
    const page = await freshPage(browser);
    await page.goto(`/my/${crypto.randomUUID()}`);
    await expect(page.getByText("This link doesn't match any submission")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("honeypot submissions are silently dropped", async ({ browser }) => {
    const hpMarker = `E2E TEST - delete me hp ${Date.now()}`;
    const page = await freshPage(browser);
    await fillPlantForm(page, hpMarker);
    await page.getByLabel("Website").fill("http://spam.example");
    await page.getByRole("button", { name: "Submit planting" }).click();

    // The bot sees a normal success screen…
    await expect(page.getByRole("heading", { name: "Thank you — it's under review" })).toBeVisible({
      timeout: 60_000,
    });
    // …but no receipt link (nothing was persisted)…
    await expect(page.getByText("Save your receipt link")).toHaveCount(0);

    // …and no row exists.
    const token = await moderatorToken();
    const res = await fetch(
      `${API}/rest/v1/sites?select=id&notes=eq.${encodeURIComponent(hpMarker)}`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as unknown[]).length).toBe(0);
  });

  test("wilaya-only planting is stored as wilaya-level (no fake precision)", async ({ browser }) => {
    const marker = `E2E TEST - delete me wilayaonly ${Date.now()}`;
    const page = await freshPage(browser);
    await page.goto("/plant");
    await expect(page.getByRole("heading", { name: "I planted a tree" })).toBeVisible();

    // Upload first: the preview only renders once React is hydrated, so its
    // appearance is the hydration proof for everything after it.
    const fileInput = page.locator('input[type="file"]');
    const preview = page.locator('img[alt="Selected"]');
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await fileInput.setInputFiles({
        name: "plant.jpg",
        mimeType: "image/jpeg",
        buffer: ONE_PX_JPEG,
      });
      try {
        await expect(preview).toBeVisible({ timeout: 6_000 });
        break;
      } catch {
        if (attempt === 2) throw new Error("Photo preview never appeared");
      }
    }

    // No GPS, no pin — just the wilaya dropdown.
    await page.locator("select").first().selectOption("16");
    await page.locator('input[type="number"]').fill("2");
    await page.locator("textarea").fill(marker);
    await page.waitForTimeout(1300);
    await page.getByRole("button", { name: "Submit planting" }).click();
    await expect(page.getByRole("heading", { name: "Thank you — it's under review" })).toBeVisible({
      timeout: 60_000,
    });

    const token = await moderatorToken();
    const res = await fetch(
      `${API}/rest/v1/sites?select=location_approximate,wilaya_code,lat,lng&notes=eq.${encodeURIComponent(marker)}`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(200);
    const rows = (await res.json()) as Array<{
      location_approximate: boolean;
      wilaya_code: string;
      lat: number;
      lng: number;
    }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].location_approximate).toBe(true);
    expect(rows[0].wilaya_code).toBe("16");
    // Stored at Alger's display centre, not at the GPS pin used by other tests.
    expect(Math.abs(rows[0].lat - 36.7538)).toBeGreaterThan(0.01);
  });
});
