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

export function featureFor(
  kind: "trees" | "care" | "fires",
  id: string,
  sites: Site[],
  careLogs: CareLog[],
  fires: FireReport[],
): MapFeature {
  if (kind === "fires") {
    const fire = fires.find((f) => f.id === id)!;
    return { kind: "fire", fire };
  }
  if (kind === "care") {
    const log = careLogs.find((l) => l.id === id)!;
    const site = sites.find((s) => s.id === log.site_id)!;
    return { kind: "care", log, site };
  }
  const site = sites.find((s) => s.id === id)!;
  return { kind: "site", site };
}
