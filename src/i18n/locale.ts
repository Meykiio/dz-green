export type Locale = "en" | "ar";

const KEY = "ga-locale";

declare global {
  interface Window {
    __GA_LOCALE__?: Locale;
  }
}

let current: Locale = "ar";

function detect(): Locale {
  if (typeof window !== "undefined" && window.__GA_LOCALE__) return window.__GA_LOCALE__;
  return "ar";
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
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }
}

export function initLocale(): void {
  current = detect();
}

/** Server-side: pick the locale from the request cookie (SSR must match client). */
export function initLocaleFromCookie(cookieHeader: string | null): void {
  if (!cookieHeader) return;
  const match = cookieHeader.match(/(?:^|;\s*)ga-locale=(en|ar)(?:;|$)/);
  if (match) current = match[1] as Locale;
}

export function cookieSafe(locale: Locale): Locale {
  return locale === "en" ? "en" : "ar";
}
