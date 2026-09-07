import type { Feature, FeatureCollection } from "geojson";

import { RISK_GRID } from "@/data/risk-grid";

/** A scored point from the Kabylie fire-risk model (climatological estimate). */
export interface RiskPoint {
  id: string;
  lat: number;
  lng: number;
  /** Model fire-risk score 0-1 for typical summer conditions. */
  risk: number;
}

export const RISK_POINTS: RiskPoint[] = RISK_GRID.map(([lng, lat, risk]) => ({
  id: `${lng},${lat}`,
  lat,
  lng,
  risk,
}));

export function riskGeoJSON(): FeatureCollection {
  const features: Feature[] = RISK_POINTS.map((p) => ({
    type: "Feature",
    id: p.id,
    properties: { kind: "risk", id: p.id, risk: p.risk },
    geometry: { type: "Point", coordinates: [p.lng, p.lat] },
  }));
  return { type: "FeatureCollection", features };
}
