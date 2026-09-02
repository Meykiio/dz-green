import { getLocale, type Locale } from "./locale";

export type CountKind =
  | "tree"
  | "fire"
  | "wilaya"
  | "site"
  | "submission"
  | "activeFire"
  | "treeNeed";

const EN_UNIT: Record<CountKind, (n: number) => string> = {
  tree: (n) => (n === 1 ? "tree" : "trees"),
  fire: (n) => (n === 1 ? "fire" : "fires"),
  wilaya: (n) => (n === 1 ? "wilaya" : "wilayas"),
  site: (n) => (n === 1 ? "site" : "sites"),
  submission: (n) => (n === 1 ? "submission" : "submissions"),
  activeFire: (n) => (n === 1 ? "active fire" : "active fires"),
  treeNeed: (n) => (n === 1 ? "tree needs water" : "trees need water"),
};

/**
 * Arabic numeral agreement: 1 → singular, 2 → dual, 3–10 → plural,
 * 11+ → singular after the number. Digits stay Western (Algerian reading).
 */
const AR_UNIT: Record<CountKind, { one: string; two: string; few: string; many: string }> = {
  tree: { one: "شجرة", two: "شجرتان", few: "أشجار", many: "شجرة" },
  fire: { one: "حريق", two: "حريقان", few: "حرائق", many: "حريقًا" },
  wilaya: { one: "ولاية", two: "ولايتان", few: "ولايات", many: "ولاية" },
  site: { one: "موقع", two: "موقعان", few: "مواقع", many: "موقعًا" },
  submission: { one: "بلاغ", two: "بلاغان", few: "بلاغات", many: "بلاغًا" },
  activeFire: { one: "حريق نشط", two: "حريقان نشطان", few: "حرائق نشطة", many: "حريقًا نشطًا" },
  treeNeed: {
    one: "شجرة تحتاج إلى سقاية",
    two: "شجرتان تحتاجان إلى سقاية",
    few: "أشجار تحتاج إلى سقاية",
    many: "شجرة تحتاج إلى سقاية",
  },
};

function arWord(kind: CountKind, n: number): string {
  const u = AR_UNIT[kind];
  if (n === 1) return u.one;
  if (n === 2) return u.two;
  if (n >= 3 && n <= 10) return u.few;
  return u.many;
}

/** French numeral agreement (CLDR, verified via Intl.PluralRules): 0-1 singular, 2+ plural. */
const FR_UNIT: Record<CountKind, { one: string; other: string }> = {
  tree: { one: "arbre", other: "arbres" },
  fire: { one: "feu", other: "feux" },
  wilaya: { one: "wilaya", other: "wilayas" },
  site: { one: "site", other: "sites" },
  submission: { one: "signalement", other: "signalements" },
  activeFire: { one: "feu actif", other: "feux actifs" },
  treeNeed: { one: "arbre a besoin d'eau", other: "arbres ont besoin d'eau" },
};

function frWord(kind: CountKind, n: number): string {
  const u = FR_UNIT[kind];
  return n <= 1 ? u.one : u.other;
}

/** Localized count phrase, e.g. "24 trees" / "3 أشجار" / "3 arbres". */
export function count(n: number, kind: CountKind, locale: Locale = getLocale()): string {
  if (locale === "ar") return `${n} ${arWord(kind, n)}`;
  if (locale === "fr") return `${n} ${frWord(kind, n)}`;
  return `${n} ${EN_UNIT[kind](n)}`;
}

const DATE_LOCALE: Record<Locale, string> = { ar: "ar-DZ", en: "en-DZ", fr: "fr-FR" };

export function formatDate(
  date: Date | string,
  locale: Locale = getLocale(),
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  return new Date(date).toLocaleDateString(DATE_LOCALE[locale], {
    ...opts,
    numberingSystem: "latn",
  });
}

export function formatDateShort(date: Date | string): string {
  return formatDate(date, getLocale(), { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, getLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
