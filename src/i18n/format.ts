/**
 * Substitute `{name}` placeholders in a message template. Locale-independent —
 * the message strings themselves already carry the translation; this only
 * fills in runtime values (counts, names, dates already formatted for display).
 */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
