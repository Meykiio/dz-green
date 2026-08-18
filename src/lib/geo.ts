import { MAP_BOUNDS, MAP_HEIGHT, MAP_WIDTH, WILAYA_SHAPES } from "@/data/algeria-wilayas";
import { mapCodeFor } from "@/lib/wilayas";

/** Web-Mercator latitude -> the same y units used to build the SVG paths. */
function mercY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  return (Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360)) * 180) / Math.PI;
}

/** Project real lat/lng into the hero map's SVG coordinate space. */
export function projectToMap(lat: number, lng: number): { x: number; y: number } {
  const { minLon, maxLon, minMercY, maxMercY } = MAP_BOUNDS;
  const x = ((lng - minLon) / (maxLon - minLon)) * MAP_WIDTH;
  const y = ((maxMercY - mercY(lat)) / (maxMercY - minMercY)) * MAP_HEIGHT;
  return { x, y };
}

/** Inverse of projectToMap — SVG coordinates back to real lat/lng. */
export function unprojectToLatLng(x: number, y: number): { lat: number; lng: number } {
  const { minLon, maxLon, minMercY, maxMercY } = MAP_BOUNDS;
  const lng = minLon + (x / MAP_WIDTH) * (maxLon - minLon);
  const my = maxMercY - (y / MAP_HEIGHT) * (maxMercY - minMercY);
  const lat = (Math.atan(Math.exp((my * Math.PI) / 180)) * 360) / Math.PI - 90;
  return { lat, lng };
}

/**
 * Display centre of a wilaya in real coordinates — used as the stored point
 * for wilaya-level submissions (no exact pin). This is the same cx/cy the
 * cluster bubbles render at, so wilaya-level pins land where visitors expect.
 */
export function wilayaCenterLatLng(code: string): { lat: number; lng: number } | null {
  const shape = SHAPE_BY_CODE[code];
  if (!shape) return null;
  return unprojectToLatLng(shape.cx, shape.cy);
}

export const SHAPE_BY_CODE = Object.fromEntries(WILAYA_SHAPES.map((s) => [s.code, s]));

interface Point {
  x: number;
  y: number;
}

export function parseRings(d: string): Point[][] {
  return d
    .split(/[mz]/i)
    .filter((segment) => segment.trim())
    .map((segment) =>
      (segment.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g) ?? []).map((pair) => {
        const [x, y] = pair.split(",");
        return { x: Number(x), y: Number(y) };
      }),
    );
}

let polygonCache: { code: string; rings: Point[][] }[] | null = null;

function wilayaPolygons() {
  if (!polygonCache) {
    polygonCache = WILAYA_SHAPES.map((s) => ({ code: s.code, rings: parseRings(s.d) }));
  }
  return polygonCache;
}

function pointInRing(px: number, py: number, ring: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]!.x;
    const yi = ring[i]!.y;
    const xj = ring[j]!.x;
    const yj = ring[j]!.y;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Historic wilaya code containing the given point, or null when the point is
 * outside every polygon (e.g. out at sea or beyond the mapped borders).
 * Note: post-2019 wilayas (49-58) have no geometry; their territory resolves
 * to the parent historic wilaya whose polygon contains it.
 */
export function wilayaCodeForPoint(lat: number, lng: number): string | null {
  const { x, y } = projectToMap(lat, lng);
  for (const shape of wilayaPolygons()) {
    if (shape.rings.some((ring) => pointInRing(x, y, ring))) return shape.code;
  }
  return null;
}

/**
 * Map bucket code for a real coordinate. The stored `wilaya_code` is
 * client-supplied and can disagree with the actual position (post-2019
 * wilayas, wrong dropdown pick), which used to split the cluster dot from
 * the pin. Resolve the bucket from the geometry first and only fall back to
 * the stored code when the point is outside every polygon (e.g. at sea).
 */
export function mapCodeForPoint(
  lat: number,
  lng: number,
  fallbackCode: string | null | undefined,
): string | null {
  return mapCodeFor(wilayaCodeForPoint(lat, lng) ?? fallbackCode);
}

/** Rough bounding box of a wilaya polygon, used for zoom transitions. */
export function shapeBounds(code: string) {
  const shape = SHAPE_BY_CODE[code];
  if (!shape) return null;
  const nums = shape.d.match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g) ?? [];
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const pair of nums) {
    const parts = pair.split(",");
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/** Great-circle distance in km. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const ALGERIA_CENTER = { lat: 28.03, lng: 2.65 };