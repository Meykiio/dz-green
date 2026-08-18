import type { Feature, FeatureCollection, Polygon } from "geojson";

import { WILAYA_SHAPES } from "@/data/algeria-wilayas";
import { parseRings, unprojectToLatLng } from "@/lib/geo";

/**
 * Wilaya boundaries as a GeoJSON FeatureCollection, converted from the
 * projected SVG path data back to real lat/lng (the inverse projection).
 * Used by the hero map for the boundary fill/line layers and wilaya zoom.
 */
export interface WilayaBoundaryProperties {
  code: string;
  name: string;
}

let cache: FeatureCollection | null = null;

export function wilayaBoundariesGeoJSON(): FeatureCollection {
  if (cache) return cache;
  const features: Feature[] = WILAYA_SHAPES.map((shape) => {
    const rings = parseRings(shape.d).map((ring) =>
      ring.map((p) => {
        const { lat, lng } = unprojectToLatLng(p.x, p.y);
        return [lng, lat] as [number, number];
      }),
    );
    return {
      type: "Feature",
      properties: { code: shape.code, name: shape.name } satisfies WilayaBoundaryProperties,
      geometry: { type: "Polygon", coordinates: rings },
    };
  });
  cache = { type: "FeatureCollection", features };
  return cache;
}

/** Bounding box of a wilaya in [west, south, east, north] order. */
export function wilayaBounds(code: string): [number, number, number, number] | null {
  const feature = wilayaBoundariesGeoJSON().features.find(
    (f) => (f.properties as WilayaBoundaryProperties).code === code,
  );
  if (!feature) return null;
  let west = Infinity,
    south = Infinity,
    east = -Infinity,
    north = -Infinity;
  const geometry = feature.geometry as Polygon;
  for (const ring of geometry.coordinates) {
    for (const coord of ring) {
      const lng = coord[0]!;
      const lat = coord[1]!;
      west = Math.min(west, lng);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      north = Math.max(north, lat);
    }
  }
  return [west, south, east, north];
}
