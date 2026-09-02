import { queryOptions } from "@tanstack/react-query";
import type { FeatureCollection } from "geojson";

import { supabase } from "@/integrations/supabase/client";
import { getRainFallback } from "@/lib/weather.functions";

import type { CareLog, FireReport, Site } from "./types";

export const SITE_COLUMNS =
  "id,lat,lng,wilaya_code,location_approximate,commune,photo_url,species,tree_count,planted_date,notes,planter_display_name,status,created_at";
const CARE_COLUMNS = "id,site_id,action,submitter_name,photo_url,notes,logged_date,created_at";
const FIRE_COLUMNS =
  "id,lat,lng,wilaya_code,location_approximate,commune,severity,description,photo_url,status,created_at,resolved_at";

/** Public URL for a stored photo path (bucket is private, served via proxy). */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `/api/public/photo/${path}`;
}

export const sitesQuery = queryOptions({
  queryKey: ["sites", "approved"],
  queryFn: async (): Promise<Site[]> => {
    const { data, error } = await supabase
      .from("sites")
      .select(SITE_COLUMNS)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;
    return (data ?? []) as Site[];
  },
  staleTime: 30_000,
});

export const careLogsQuery = queryOptions({
  queryKey: ["care_logs"],
  queryFn: async (): Promise<CareLog[]> => {
    const { data, error } = await supabase
      .from("care_logs")
      .select(CARE_COLUMNS)
      .order("logged_date", { ascending: false })
      .limit(3000);
    if (error) throw error;
    return (data ?? []) as CareLog[];
  },
  staleTime: 30_000,
});

export const fireReportsQuery = queryOptions({
  queryKey: ["fire_reports"],
  queryFn: async (): Promise<FireReport[]> => {
    const { data, error } = await supabase
      .from("fire_reports")
      .select(FIRE_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data ?? []) as FireReport[];
  },
  staleTime: 15_000,
});

/**
 * NASA FIRMS satellite hotspots via our server route (display-only layer).
 * Refetches every 10 min; on failure the previous data stays (query error
 * keeps cache) — the layer just goes quiet, never breaks the map.
 */
export const hotspotsQuery = queryOptions({
  queryKey: ["hotspots"],
  queryFn: async (): Promise<FeatureCollection> => {
    const res = await fetch("/api/public/hotspots");
    if (!res.ok) throw new Error(`hotspots ${res.status}`);
    return (await res.json()) as FeatureCollection;
  },
  staleTime: 600_000,
  refetchInterval: 600_000,
});

/**
 * 14-day rainfall for thirsty-candidate sites (rain-aware needsWater).
 * Keyed by the sorted candidate ids so the query is stable across renders.
 */
export function rainFallbackQuery(candidates: { id: string; lat: number; lng: number }[]) {
  const key = candidates
    .map((c) => c.id)
    .sort()
    .join(",");
  return queryOptions({
    queryKey: ["rain-fallback", key],
    queryFn: async (): Promise<Record<string, number>> => {
      const out = await getRainFallback({ data: { sites: candidates } });
      return out ?? {};
    },
    staleTime: 3 * 60 * 60 * 1000,
    enabled: candidates.length > 0,
  });
}

export interface ActiveAnnouncement {
  id: string;
  title_ar: string;
  body_ar: string;
  title_en: string;
  body_en: string;
  title_fr: string;
  body_fr: string;
  kind: "info" | "success" | "warning";
  color: "ink" | "plant" | "care" | "fire" | "amber";
  /** Marquee loop duration in seconds (10 fast → 120 very slow). */
  speed_seconds: number;
}

/** The announcement's text in the visitor's locale (trilingual fields). */
export function localizedAnnouncement(
  a: ActiveAnnouncement,
  locale: "en" | "ar" | "fr",
): { title: string; body: string } {
  if (locale === "ar") return { title: a.title_ar, body: a.body_ar };
  if (locale === "fr") return { title: a.title_fr, body: a.body_fr };
  return { title: a.title_en, body: a.body_en };
}

/**
 * The active announcements (admin-controlled, possibly several at once —
 * they scroll together in the strip). Shared by the banner and the chrome
 * (which shifts down when any are present) — one network call, cache shared
 * via the query key. RLS limits anon reads to active rows.
 */
export const announcementQuery = queryOptions({
  queryKey: ["announcement", "active"],
  queryFn: async (): Promise<ActiveAnnouncement[]> => {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title_ar, body_ar, title_en, body_en, title_fr, body_fr, kind, color, speed_seconds")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []) as ActiveAnnouncement[];
  },
  staleTime: 300_000,
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Date + exact time — for moderation decisions, where "when" matters. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}