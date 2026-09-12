import type { BrowserContext } from "@playwright/test";

/**
 * The platform is Arabic-first by default (2026-08-28); these specs assert
 * English copy. Pin the saved locale to English before any page loads —
 * SSR reads the ga-locale cookie (src/server.ts), so this makes every
 * assertion in the suite deterministic.
 */
export async function pinEnglish(context: BrowserContext): Promise<void> {
  await context.addCookies([
    { name: "ga-locale", value: "en", url: "http://localhost:8081" },
  ]);
}

/**
 * The staff pages mask PII by default (filming mode, 2026-08-29), which
 * renders emails as "e2***@domain" — the admin specs match unmasked
 * emails, so turn masking off in the test contexts.
 */
export async function unmaskPii(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem("ga-privacy", "off");
    } catch {
      /* storage blocked */
    }
  });
}
