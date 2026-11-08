import type { Feature, FeatureCollection } from "geojson";

/**
 * The national fire-risk priority map (built by ml/fire-risk/run_national.py,
 * published as public/data/fire-risk-<year>.json, loaded on demand when the
 * risk layer is turned on). Only the top 30% of northern land is published.
 */
export const RISK_TARGET_YEAR = 2027;
export const RISK_MAP_URL = `/data/fire-risk-${RISK_TARGET_YEAR}.json`;

/** A 2 x 2 km cell of the fire-risk priority map. */
export interface RiskPoint {
  id: string;
  lat: number;
  lng: number;
  /**
   * Relative rank 0-1: the share of mapped land that scores lower.
   * 0.9 means riskier than 90% of northern Algeria's land. NOT a probability.
   */
  risk: number;
}

/** The published file's shape. `cells` is a flat [ix, iy, rank%] list. */
export interface RiskMapFile {
  version: string;
  targetYear: number;
  cellDeg: number;
  lon0: number;
  lat0: number;
  publishedFromRank: number;
  test: { auc: number; top10: number; top20: number };
  cells: number[];
}

/** Band cut-offs on the rank: High = top 10% of land, Medium = next 20%. */
export const RISK_BAND_HIGH = 0.9;
export const RISK_BAND_MEDIUM = 0.7;

export type RiskBand = "high" | "medium" | "low";

export function riskBand(rank: number): RiskBand {
  if (rank >= RISK_BAND_HIGH) return "high";
  if (rank >= RISK_BAND_MEDIUM) return "medium";
  return "low";
}

/** "Top N%" of the land this cell belongs to (1-100). */
export function riskTopShare(rank: number): number {
  return Math.min(100, Math.max(1, Math.round((1 - rank) * 100)));
}

export function decodeRiskMap(file: RiskMapFile): RiskPoint[] {
  const out: RiskPoint[] = [];
  const { cells, cellDeg, lon0, lat0 } = file;
  for (let i = 0; i + 2 < cells.length; i += 3) {
    const ix = cells[i]!;
    const iy = cells[i + 1]!;
    const lng = Math.round((lon0 + (ix + 0.5) * cellDeg) * 1e4) / 1e4;
    const lat = Math.round((lat0 + (iy + 0.5) * cellDeg) * 1e4) / 1e4;
    out.push({ id: `${ix},${iy}`, lat, lng, risk: cells[i + 2]! / 100 });
  }
  return out;
}

export function riskGeoJSON(points: RiskPoint[]): FeatureCollection {
  const features: Feature[] = points.map((p) => ({
    type: "Feature",
    id: p.id,
    properties: { kind: "risk", id: p.id, risk: p.risk },
    geometry: { type: "Point", coordinates: [p.lng, p.lat] },
  }));
  return { type: "FeatureCollection", features };
}

export const EMPTY_RISK: FeatureCollection = { type: "FeatureCollection", features: [] };
