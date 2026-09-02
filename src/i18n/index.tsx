import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ar, en, fr } from "./dict";
import { getLocale, initLocale, setLocale as persistLocale, type Locale } from "./locale";
import { count, formatDate, type CountKind } from "./format";
import { errors as enErrors } from "./dict/en/errors";
import { errors as arErrors } from "./dict/ar/errors";

export type { Locale, CountKind };

function lookup<D extends Record<string, unknown>>(root: D, path: string): unknown {
  let cur: unknown = root;
  for (const part of path.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

export interface I18n {
  locale: Locale;
  t: (path: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  count: (n: number, kind: CountKind) => string;
  formatDate: (date: Date | string, opts?: Intl.DateTimeFormatOptions) => string;
  formatDateShort: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR renders in the visitor's cookie locale; the no-flash script exposes
  // the same value on window.__GA_LOCALE__ before the bundle runs — so the
  // first client render always matches the SSR text (React #418 fix).
  const [locale, setLocaleState] = useState<Locale>(() => {
    initLocale();
    return getLocale();
  });

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  // Saved locale that disagreed with the cookie (ITP expiry / legacy save):
  // SSR + first render were Arabic, so flip now — one clean post-mount
  // re-render, never a hydration mismatch. setLocale re-mints the cookie.
  useEffect(() => {
    const pending = window.__GA_LOCALE_PENDING__;
    if (!pending) return;
    delete window.__GA_LOCALE_PENDING__;
    if (pending !== getLocale()) setLocale(pending);
  }, [setLocale]);

  const value = useMemo<I18n>(() => {
    const dict = locale === "ar" ? ar : locale === "fr" ? fr : en;
    const t = (path: string, params?: Record<string, string | number>): string => {
      let raw = lookup(dict, path);
      if (typeof raw !== "string") raw = lookup(en, path);
      if (typeof raw !== "string") return path;
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
        name in params ? String(params[name]) : `{${name}}`,
      );
    };
    const fDate = (date: Date | string, opts?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, opts);
    return {
      locale,
      t,
      setLocale,
      count: (n, kind) => count(n, kind, locale),
      formatDate: fDate,
      formatDateShort: (date) => formatDate(date, locale, { day: "numeric", month: "short", year: "numeric" }),
      formatDateTime: (date) =>
        formatDate(date, locale, {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      isRtl: locale === "ar",
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
/** Rewrite a known server error string into a localized message. */
export function localizeError(raw: string, locale: Locale = getLocale()): string {
  if (locale === "en") return raw;
  const entries = Object.entries(enErrors.mapServer);
  const found = entries.find(([, v]) => v === raw);
  if (found) {
    const target = (arErrors.mapServer as Record<string, string>)[found[0]];
    if (target) return target;
  }
  if (raw === enErrors.toasts.generic) return arErrors.toasts.generic;
  return raw;
}

/**
 * No-flash script: apply the SSR locale before first paint. The COOKIE wins —
 * it is what the server rendered from, so the first client render must match
 * it exactly (React #418). localStorage alone (legacy saves, or Safari ITP
 * expiring the cookie after 7 days) must NOT override the first render; it is
 * stashed as pending and flipped post-mount, which also re-mints the cookie.
 */
export function localeInitScript(): string {
  return `try{var m=document.cookie.match(/(?:^|;\\s*)ga-locale=(en|ar|fr)(?:;|$)/);var c=m?m[1]:null;var s=localStorage.getItem("ga-locale");var l=c||"ar";if(l!=="ar"){document.documentElement.lang=l;document.documentElement.dir="ltr"}window.__GA_LOCALE__=l;if(!c&&(s==="en"||s==="ar"||s==="fr")&&s!==l)window.__GA_LOCALE_PENDING__=s}catch(e){}`;
}

/** Server-side-safe translate for route `head()` (uses the singleton locale). */
export function ssrT(path: string, params?: Record<string, string | number>): string {
  initLocale();
  const dict = getLocale() === "ar" ? ar : getLocale() === "fr" ? fr : en;
  let raw = lookup(dict, path);
  if (typeof raw !== "string") raw = lookup(en, path);
  if (typeof raw !== "string") return path;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}
