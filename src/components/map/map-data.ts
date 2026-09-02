import type { Feature, FeatureCollection } from "geojson";

import type { CareLog, FireReport, MapFeature, Site } from "@/lib/types";

export function featureCollection(
  sites: Site[],
  careLogs: CareLog[],
  fires: FireReport[],
): FeatureCollection {
  const siteById = new Map(sites.map((s) => [s.id, s]));
  const features: Feature[] = [];
  for (const site of sites) {
    features.push({
      type: "Feature",
      properties: { kind: "trees", id: site.id },
      geometry: { type: "Point", coordinates: [site.lng, site.lat] },
    });
  }
  for (const log of careLogs) {
    const site = siteById.get(log.site_id);
    if (!site) continue;
    features.push({
      type: "Feature",
      properties: { kind: "care", id: log.id },
      // Slight offset so a care dot peeks out from under/over the site's own
      // tree dot instead of stacking exactly on it.
      geometry: { type: "Point", coordinates: [site.lng + 0.03, site.lat - 0.03] },
    });
  }
  for (const fire of fires) {
    features.push({
      type: "Feature",
      properties: { kind: "fires", id: fire.id },
      geometry: { type: "Point", coordinates: [fire.lng, fire.lat] },
    });
  }
  return { type: "FeatureCollection", features };
}

export function onlyKind(data: FeatureCollection, kind: string): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.features.filter((f) => f.properties?.["kind"] === kind),
  };
}

export function withoutKind(data: FeatureCollection, kind: string): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: data.features.filter((f) => f.properties?.["kind"] !== kind),
  };
}

/**
 * Resolve a clicked feature id back to its full row. Returns null when the
 * id is not in the current arrays — the click handler then simply does
 * nothing. Two real ways to get here: the dot was removed between render
 * and click (refetch swap, fire resolved and filtered out), or the source
 * briefly holds data newer than the arrays. A null beats the old
 * `.find(...)!` crash on the core surface (BUG-01, audit 2026-09-02).
 */
export function featureFor(
  kind: "trees" | "care" | "fires",
  id: string,
  sites: Site[],
  careLogs: CareLog[],
  fires: FireReport[],
): MapFeature | null {
  if (kind === "fires") {
    const fire = fires.find((f) => f.id === id);
    return fire ? { kind: "fire", fire } : null;
  }
  if (kind === "care") {
    const log = careLogs.find((l) => l.id === id);
    if (!log) return null;
    const site = sites.find((s) => s.id === log.site_id);
    return site ? { kind: "care", log, site } : null;
  }
  const site = sites.find((s) => s.id === id);
  return site ? { kind: "site", site } : null;
}
