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

export interface AlertContact {
  id: string;
  type: "email" | "phone";
  value: string;
  region_filter: { wilayas: string[] };
  active: boolean;
  created_at: string;
}

/** A selectable thing on the hero map. */
export type MapFeature =
  | { kind: "site"; site: Site }
  | { kind: "care"; log: CareLog; site: Site }
  | { kind: "fire"; fire: FireReport };

export const CARE_WINDOW_DAYS = 14;

/** Client-side derived flag: no care log in the last 14 days. */
export function needsWater(site: Site, logs: CareLog[]): boolean {
  const last = logs
    .filter((l) => l.site_id === site.id)
    .map((l) => new Date(l.logged_date).getTime())
    .sort((a, b) => b - a)[0];
  const reference = last ?? new Date(site.planted_date).getTime();
  return Date.now() - reference > CARE_WINDOW_DAYS * 86400000;
}