import type { Site } from "@/lib/types";
import { RISK_TARGET_YEAR } from "@/lib/risk";

/**
 * "Where to plant" data: per-wilaya fire history and 2027 risk from the
 * national model (public/data/fire-risk-wilayas-<year>.json, built by
 * ml/fire-risk/run_national.py) joined with the community's approved trees.
 */
export const WILAYA_RISK_URL = `/data/fire-risk-wilayas-${RISK_TARGET_YEAR}.json`;

export interface WilayaRiskRow {
  code: string;
  /** Mapped land of the wilaya inside the model's northern grid. */
  landKm2: number;
  /** Riskiest 10% of northern land falling in this wilaya (2027). */
  highKm2: number;
  /** Next 20%. */
  mediumKm2: number;
  /** Land in 2 km squares where NASA detected a vegetation fire, last 10 seasons. */
  burnedKm2: number;
  highShare: number;
}

export interface WilayaRiskFile {
  version: string;
  targetYear: number;
  burnedYears: string;
  wilayas: WilayaRiskRow[];
}

export interface RestoreRow extends WilayaRiskRow {
  /** Trees on approved community plantings in this wilaya. */
  trees: number;
  plantings: number;
}

export type RestoreSort = "burned" | "risk" | "trees";

/** Join the model's figures with the community's trees and sort. */
export function buildRestoreRows(file: WilayaRiskFile, sites: Site[], sort: RestoreSort): RestoreRow[] {
  const trees = new Map<string, { trees: number; plantings: number }>();
  for (const s of sites) {
    const t = trees.get(s.wilaya_code) ?? { trees: 0, plantings: 0 };
    t.trees += s.tree_count;
    t.plantings += 1;
    trees.set(s.wilaya_code, t);
  }
  const rows = file.wilayas.map((w) => ({ ...w, ...(trees.get(w.code) ?? { trees: 0, plantings: 0 }) }));
  const key: Record<RestoreSort, (r: RestoreRow) => number> = {
    burned: (r) => r.burnedKm2,
    risk: (r) => r.highKm2,
    trees: (r) => r.trees,
  };
  return rows.sort((a, b) => key[sort](b) - key[sort](a) || a.code.localeCompare(b.code));
}

/** Integer km2 with thin-space thousands, locale digits handled by the caller. */
export function formatKm2(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en", {
    maximumFractionDigits: 0,
  }).format(n);
}
