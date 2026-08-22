import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

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
let maskCache: FeatureCollection | null = null;
let algeriaCache: MultiPolygon | null = null;
let coarseCache: { code: string; rings: { x: number; y: number }[][] }[] | null = null;

/**
 * Heavily decimated rings for the dim mask and the `within` label filter.
 * The full 31.6k-point boundaries cost too much in per-tile triangulation
 * and per-feature `within` evaluation (the 2026-08-22 slowdown report —
 * a zoom-to-idle measurement hung past 120s). ~2.5 map units ≈ 5km: the
 * dim edge and the label filter don't need better.
 */
function coarseRings() {
  if (coarseCache) return coarseCache;
  const EPS = 2.5;
  coarseCache = WILAYA_SHAPES.map((shape) => ({
    code: shape.code,
    rings: parseRings(shape.d).map((ring) => {
      if (ring.length <= 3) return ring;
      const out = [ring[0]!];
      let last = ring[0]!;
      for (let i = 1; i < ring.length - 1; i++) {
        const p = ring[i]!;
        if ((p.x - last.x) ** 2 + (p.y - last.y) ** 2 >= EPS * EPS) {
          out.push(p);
          last = p;
        }
      }
      out.push(ring[ring.length - 1]!);
      return out;
    }),
  }));
  return coarseCache;
}

/**
 * Algeria as one MultiPolygon (every wilaya's rings). Used by the basemap
 * label filter so only Algeria-related place names render.
 */
export function algeriaMultiPolygon(): MultiPolygon {
  if (algeriaCache) return algeriaCache;
  const polygons = coarseRings().map((shape) =>
    shape.rings.map((ring) =>
      ring.map((p) => {
        const { lat, lng } = unprojectToLatLng(p.x, p.y);
        return [lng, lat] as [number, number];
      }),
    ),
  );
  algeriaCache = { type: "MultiPolygon", coordinates: polygons };
  return algeriaCache;
}

/**
 * World polygon with every wilaya's outer ring cut out as a hole — the dim
 * mask that fades neighbouring countries so Algeria reads first. The holes
 * reuse the same simplified shapes as the boundary layers, so the dim edge
 * matches the green wilaya borders exactly.
 */
export function wilayaMaskGeoJSON(): FeatureCollection {
  if (maskCache) return maskCache;
  const world: [number, number][] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];
  const holes = coarseRings().map((shape) => {
    const outer = shape.rings[0]!;
    return outer.map((p) => {
      const { lat, lng } = unprojectToLatLng(p.x, p.y);
      return [lng, lat] as [number, number];
    });
  });
  maskCache = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [world, ...holes] },
      },
    ],
  };
  return maskCache;
}

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
