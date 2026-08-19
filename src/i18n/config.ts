/**
 * i18n configuration — the single source of truth for supported languages,
 * text direction, and the persistence cookie. Kept dependency-free and
 * isomorphic so both the server (SSR locale detection) and the client
 * (language switcher) import the same helpers.
 */

export const LOCALES = ["en", "ar", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

/** Fallback when nothing else is known — English, per the project decision. */
export const DEFAULT_LOCALE: Locale = "en";

/** Right-to-left languages. Only Arabic today. */
export const RTL_LOCALES: readonly Locale[] = ["ar"];

/** Cookie name — mirrors the `ga-*` convention used by the theme store. */
export const LOCALE_COOKIE = "ga-locale";

/** One year, in seconds — the language choice should survive between visits. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Native name of each language, for the switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
};

/** The BCP-47 tag handed to `Intl.*` formatters. */
export const LOCALE_BCP47: Record<Locale, string> = {
  en: "en",
  ar: "ar-DZ",
  fr: "fr-DZ",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/** Collapse a full tag (`ar-DZ`, `fr_FR`) to a supported base locale, or null. */
export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const base = value.toLowerCase().split(/[-_]/)[0];
  return isLocale(base) ? base : null;
}

/** Parse our locale out of a raw `Cookie:` header value. */
export function parseLocaleCookie(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === LOCALE_COOKIE) return normalizeLocale(decodeURIComponent(rest.join("=")));
  }
  return null;
}

/** Best supported match from an `Accept-Language` header, else the default. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { locale: normalizeLocale(tag), q: q ? Number(q) : 1 };
    })
    .filter((entry): entry is { locale: Locale; q: number } => entry.locale !== null)
    .sort((a, b) => b.q - a.q);
  return ranked[0]?.locale ?? DEFAULT_LOCALE;
}
