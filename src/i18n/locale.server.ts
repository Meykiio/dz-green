import { getRequest } from "@tanstack/react-start/server";

import { DEFAULT_LOCALE, localeFromAcceptLanguage, parseLocaleCookie, type Locale } from "./config";

/**
 * Server-only. Resolves the request's locale: the saved cookie wins, then the
 * browser's Accept-Language, then the English default. Loaded inside a server
 * function handler — never imported into a component or loader directly.
 */
export function readRequestLocale(): Locale {
  const headers = getRequest().headers;
  const fromCookie = parseLocaleCookie(headers.get("cookie"));
  if (fromCookie) return fromCookie;
  return localeFromAcceptLanguage(headers.get("accept-language")) ?? DEFAULT_LOCALE;
}
