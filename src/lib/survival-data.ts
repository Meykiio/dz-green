import { queryOptions } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  isMissingRelation,
  SURVIVAL_CHECK_COLUMNS,
  type SiteSurvivalStatus,
  type SurvivalCheck,
  type WilayaSurvivalStats,
} from "@/lib/survival";

/**
 * Survival reads (RLS + column grants do the authorization). Each query
 * returns `null` while the migration is not applied, so the UI can say
 * "coming soon" instead of failing. Untyped client: the generated types
 * predate the table; regenerate them after the migration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as SupabaseClient<any>;

async function orNotLive<T>(run: () => PromiseLike<{ data: unknown; error: unknown }>): Promise<T | null> {
  const { data, error } = await run();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data as T;
}

/** Checks for one planting, newest first (Q1). */
export const siteChecksQuery = (siteId: string) =>
  queryOptions({
    queryKey: ["survival_checks", "site", siteId],
    queryFn: () =>
      orNotLive<SurvivalCheck[]>(() =>
        db
          .from("survival_checks")
          .select(SURVIVAL_CHECK_COLUMNS)
          .eq("site_id", siteId)
          .order("checked_date", { ascending: false })
          .limit(50),
      ),
    staleTime: 30_000,
  });

/** Last status + due window for every approved planting (Q2). */
export const siteSurvivalStatusQuery = queryOptions({
  queryKey: ["survival_checks", "status"],
  queryFn: () =>
    orNotLive<SiteSurvivalStatus[]>(() =>
      db
        .from("site_survival_status")
        .select("site_id,wilaya_code,last_status,last_checked_date,due")
        .limit(5000),
    ),
  staleTime: 60_000,
});

/** Survival at 12 months per wilaya (Q3). */
export const survivalStatsQuery = queryOptions({
  queryKey: ["survival_checks", "stats"],
  queryFn: () =>
    orNotLive<WilayaSurvivalStats[]>(() =>
      db
        .from("survival_stats_wilaya")
        .select("wilaya_code,eligible_sites,checked_sites,trees_checked,trees_alive"),
    ),
  staleTime: 300_000,
});

/** Unverified checks visible to this moderator (RLS scopes the wilayas) (Q5). */
export const survivalReviewQuery = queryOptions({
  queryKey: ["survival_checks", "review"],
  queryFn: () =>
    orNotLive<SurvivalCheck[]>(() =>
      db
        .from("survival_checks")
        .select(SURVIVAL_CHECK_COLUMNS)
        .eq("grade", "unverified")
        .order("created_at", { ascending: true })
        .limit(100),
    ),
  staleTime: 15_000,
});
