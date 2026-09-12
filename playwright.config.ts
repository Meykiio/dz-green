import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  // One retry: the suite is live (real dev server + real Supabase); a single
  // dropped connection mid-serial-run used to fail a whole describe.
  retries: 1,
  // Cap the whole run so a wedged dev server fails loud instead of hanging.
  globalTimeout: 15 * 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8081",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run dev -- --port 8081",
    url: "http://localhost:8081",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
