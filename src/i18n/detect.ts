import { createServerFn } from "@tanstack/react-start";

import { DEFAULT_LOCALE, parseLocaleCookie, type Locale } from "./config";

/** Server function: read the request's locale from cookie / Accept-Language. */
export const detectServerLocale = createServerFn({ method: "GET" }).handler(
  async (): Promise<Locale> => {
    const { readRequestLocale } = await import("./locale.server");
    return readRequestLocale();
  },
);

/**
 * Isomorphic initial-locale resolver for the root loader. On the client the
 * cookie is already in `document.cookie` (set by the switcher), so we read it
 * synchronously and skip the server round-trip; during SSR we ask the server.
 */
export async function resolveInitialLocale(): Promise<Locale> {
  if (typeof document !== "undefined") {
    return parseLocaleCookie(document.cookie) ?? DEFAULT_LOCALE;
  }
  return detectServerLocale();
}
