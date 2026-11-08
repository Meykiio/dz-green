/**
 * Survival layer (Phase 2a), client-safe shapes and rules.
 * Design: docs/pending-migrations/2026-11_phase2_survival_design.md.
 *
 * Everything here works before the migration is applied: data helpers
 * treat a missing table or view as "feature not live yet" (see
 * isMissingRelation), never as an error page.
 */

export const SURVIVAL_STATUSES = ["alive", "stressed", "dead", "burned", "grazed", "not_found"] as const;
export type SurvivalStatus = (typeof SURVIVAL_STATUSES)[number];

export type Independence = "independent" | "self" | "staff" | "unknown";
export type CheckGrade = "unverified" | "verified" | "rejected";
export type DueState = "too_early" | "due_3m" | "due_12m" | "due_36m" | "up_to_date";

/** Public columns of a survival check (user_id and hashes are never sent). */
export interface SurvivalCheck {
  id: string;
  site_id: string;
  status: SurvivalStatus;
  trees_checked: number;
  trees_alive: number;
  photo_url: string;
  checked_date: string;
  notes: string | null;
  submitter_name: string | null;
  independence: Independence;
  grade: CheckGrade;
  reviewed_at: string | null;
  created_at: string;
}

export const SURVIVAL_CHECK_COLUMNS =
  "id,site_id,status,trees_checked,trees_alive,photo_url,checked_date,notes,submitter_name,independence,grade,reviewed_at,created_at";

export interface SiteSurvivalStatus {
  site_id: string;
  wilaya_code: string;
  last_status: SurvivalStatus | null;
  last_checked_date: string | null;
  due: DueState;
}

export interface WilayaSurvivalStats {
  wilaya_code: string;
  eligible_sites: number;
  checked_sites: number;
  trees_checked: number;
  trees_alive: number;
}

/** Below this many independently checked plantings we show "not enough data". */
export const MIN_SITES_FOR_RATE = 10;

/**
 * Who made the check, decided on the server only. Staff beats everything;
 * a signed-in checker who also planted the site is "self"; two different
 * signed-in people are "independent"; anything anonymous is "unknown".
 */
export function independenceFor(input: {
  checkerId: string | null;
  planterId: string | null;
  checkerIsStaff: boolean;
}): Independence {
  if (input.checkerId && input.checkerIsStaff) return "staff";
  if (!input.checkerId || !input.planterId) return "unknown";
  return input.checkerId === input.planterId ? "self" : "independent";
}

/** Headline survival rate, or null when the sample is too small to publish. */
export function survivalRate(s: Pick<WilayaSurvivalStats, "checked_sites" | "trees_checked" | "trees_alive">):
  number | null {
  if (s.checked_sites < MIN_SITES_FOR_RATE || s.trees_checked === 0) return null;
  return s.trees_alive / s.trees_checked;
}

/** Share of eligible plantings that have an independent or staff check. */
export function coverage(s: Pick<WilayaSurvivalStats, "eligible_sites" | "checked_sites">): number {
  return s.eligible_sites === 0 ? 0 : s.checked_sites / s.eligible_sites;
}

/**
 * True when Supabase reports the table/view does not exist yet (migration
 * not applied): PostgREST PGRST205 / PGRST204, or Postgres 42P01.
 */
export function isMissingRelation(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return false;
  return (
    e.code === "PGRST205" ||
    e.code === "PGRST204" ||
    e.code === "42P01" ||
    /does not exist|schema cache/i.test(e.message ?? "")
  );
}

export function isDue(due: DueState | undefined): boolean {
  return due === "due_3m" || due === "due_12m" || due === "due_36m";
}

/** Sensible "trees alive" default for the check form when the status changes. */
export function defaultAlive(status: SurvivalStatus, checked: number): number {
  return status === "alive" || status === "stressed" ? checked : 0;
}
