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
    document.documentElement.lang = locale === "ar" ? "ar" : "en";
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }
}

export function initLocale(): void {
  current = detect();
}

export function cookieSafe(locale: Locale): Locale {
  return locale === "en" ? "en" : "ar";
}
