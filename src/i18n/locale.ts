export type Locale = "en" | "ar" | "fr";

const KEY = "ga-locale";

declare global {
  interface Window {
    __GA_LOCALE__?: Locale;
    /** Saved locale that could NOT be first-rendered (no cookie => SSR was
     *  Arabic). Flipped in a post-mount effect, never during hydration. */
    __GA_LOCALE_PENDING__?: Locale;
  }
}

let current: Locale = "ar";

function detect(): Locale {
  if (typeof window !== "undefined") {
    return window.__GA_LOCALE__ ?? "ar";
  }
  // Server: src/server.ts sets this per request from the visitor's cookie.
  return ((globalThis as { __GA_LOCALE_SSR__?: string }).__GA_LOCALE_SSR__ as Locale | undefined) ?? "ar";
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  current = locale;
  if (typeof window !== "undefined") {
    window.__GA_LOCALE__ = locale;
    try {
      localStorage.setItem(KEY, locale);
    } catch {
      /* private mode */
    }
    // Cookie mirror so SSR renders in the saved locale (hydration-mismatch
    // fix, 2026-08-30): without it, SSR is always Arabic while an EN-saved
    // client renders English — React #418, and effects never fire.
    document.cookie = `${KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }
}

export function initLocale(): void {
  current = detect();
}

export function cookieSafe(locale: Locale): Locale {
  return locale === "en" || locale === "fr" ? locale : "ar";
}
