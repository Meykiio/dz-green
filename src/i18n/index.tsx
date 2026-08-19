import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_BCP47,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  dirFor,
  type Locale,
} from "./config";
import { ar } from "./messages/ar";
import { en, type Messages } from "./messages/en";
import { fr } from "./messages/fr";

const CATALOGUES: Record<Locale, Messages> = { en, ar, fr };

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  /** The active catalogue — read as `t.nav.map`, fully typed. */
  t: Messages;
  setLocale: (next: Locale) => void;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Seeds the locale from the value the root loader resolved server-side, so the
 * first client render matches the SSR HTML (no hydration mismatch, no flash).
 * State lives in the React tree — not a module singleton — so concurrent SSR
 * requests never share a locale.
 */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
      document.documentElement.dir = dirFor(next);
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir: dirFor(locale),
      t: CATALOGUES[locale],
      setLocale,
      formatNumber: (v, options) => new Intl.NumberFormat(LOCALE_BCP47[locale], options).format(v),
      formatDate: (v, options) =>
        new Intl.DateTimeFormat(LOCALE_BCP47[locale], options ?? DEFAULT_DATE_OPTIONS).format(
          new Date(v),
        ),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    // Defensive: keeps a stray consumer from crashing SSR. Should not happen —
    // the provider wraps the whole app in __root.
    return {
      locale: DEFAULT_LOCALE,
      dir: dirFor(DEFAULT_LOCALE),
      t: CATALOGUES[DEFAULT_LOCALE],
      setLocale: () => {},
      formatNumber: (v, options) =>
        new Intl.NumberFormat(LOCALE_BCP47[DEFAULT_LOCALE], options).format(v),
      formatDate: (v, options) =>
        new Intl.DateTimeFormat(
          LOCALE_BCP47[DEFAULT_LOCALE],
          options ?? DEFAULT_DATE_OPTIONS,
        ).format(new Date(v)),
    };
  }
  return value;
}

export { type Locale } from "./config";
