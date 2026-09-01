export type SiteStatus = "pending" | "approved" | "rejected";
export type CareAction = "watered" | "checked" | "needs_attention" | "other";
export type FireStatus = "active" | "resolved" | "false_alarm";

export interface Site {
  id: string;
  lat: number;
  lng: number;
  wilaya_code: string;
  /** True when stored as wilaya-level (no exact pin) — show the honest badge. */
  location_approximate: boolean;
  commune: string | null;
  photo_url: string;
  species: string | null;
  tree_count: number;
  planted_date: string;
  notes: string | null;
  planter_display_name: string | null;
  status: SiteStatus;
  created_at: string;
  moderator_notes?: string | null;
}

export interface CareLog {
  id: string;
  site_id: string;
  action: CareAction;
  submitter_name: string | null;
  photo_url: string | null;
  notes: string | null;
  logged_date: string;
  created_at: string;
}

export interface FireReport {
  id: string;
  lat: number;
  lng: number;
  wilaya_code: string;
  /** True when stored as wilaya-level (no exact pin). */
  location_approximate: boolean;
  commune: string | null;
  severity: "small" | "large" | null;
  description: string | null;
  photo_url: string | null;
  status: FireStatus;
  created_at: string;
  resolved_at: string | null;
}

/** A NASA FIRMS satellite detection (display-only, never stored). */
export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  confidence: "nominal" | "high";
  /** Fire radiative power, MW. */
  frp: number;
  /** Pixel brightness temperature, °C (from bright_ti4 K). */
  brightnessC: number;
  /** ISO UTC acquisition time. */
  acquiredAt: string;
  daynight: "day" | "night";
  satellite: string;
}

/** A selectable thing on the hero map. */
export type MapFeature =
  | { kind: "site"; site: Site }
  | { kind: "care"; log: CareLog; site: Site }
  | { kind: "fire"; fire: FireReport }
  | { kind: "hotspot"; hotspot: Hotspot };

export const CARE_WINDOW_DAYS = 14;

/** Rain at/above this in the care window counts as nature watering the site. */
export const RAIN_RESET_MM = 10;

/**
 * Client-side derived flag: no care log in the last 14 days.
 * Uses `created_at` (server time), not the user-entered `logged_date` —
 * a backdated log must not fake freshness (issue #39).
 * Rain-aware (2026-09-01): when the rainfall for the site's spot over the
 * window is known (Open-Meteo), enough rain clears the flag — nature watered
 * it. `rainMm` null/undefined = rainfall unknown = time-only behavior.
 */
export function needsWater(site: Site, logs: CareLog[], rainMm?: number | null): boolean {
  const last = logs
    .filter((l) => l.site_id === site.id)
    .map((l) => new Date(l.created_at).getTime())
    .sort((a, b) => b - a)[0];
  const reference = last ?? new Date(site.planted_date).getTime();
  const overdue = Date.now() - reference > CARE_WINDOW_DAYS * 86400000;
  if (!overdue) return false;
  if (rainMm != null && rainMm >= RAIN_RESET_MM) return false;
  return true;
}