/**
 * Today's date as YYYY-MM-DD in the visitor's own timezone. The forms used
 * toISOString() (UTC), so in Algeria (UTC+1) between midnight and 1 am the
 * default and the max date were still "yesterday".
 */
export function todayLocalISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Latest date the server accepts: UTC today + 1 day, so a visitor whose
 * local date is already tomorrow relative to UTC (Algeria after midnight)
 * is never rejected as "future".
 */
export function latestAcceptedISO(now = new Date()): string {
  return new Date(now.getTime() + 24 * 3600_000).toISOString().slice(0, 10);
}
