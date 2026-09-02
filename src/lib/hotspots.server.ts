import type { Feature, FeatureCollection } from "geojson";

import { FLARE_ZONES } from "@/data/flare-zones";
import { wilayaCodeForPoint } from "@/lib/geo";
import type { Hotspot } from "@/lib/types";

/**
 * NASA FIRMS satellite hotspots — server-only fetch + parse + filter.
 * Source: VIIRS NOAA21_NRT (Suomi NPP retires 2026-11-01 — do not use SNPP).
 * Docs: https://firms.modaps.eosdis.nasa.gov/api/area/
 *
 * Static-source masking: the zone list is GENERATED from the EOG Global Gas
 * Flare Analysis 2024 (VIIRS Nightfire annual summary, Earth Observation
 * Group, Payne Institute for Public Policy — 314 Algerian flare points
 * clustered into 185 zones, see src/data/flare-zones.ts). It replaced the
 * hand-tuned list: authoritative, tighter radii (4-12km), and it also covers
 * the northern refineries (Arzew, Skikda) the hand list missed. The 4-day
 * persistence mask below stays as the live complement for post-2024 flares.
 */

const SOURCE = "VIIRS_NOAA21_NRT";
const ALGERIA_BBOX = "-8.7,18.9,12.1,38.0"; // west,south,east,north
// 4-day window (API max 5): the persistence mask needs the depth — a flare
// burns every night, so 2+ detections in 4 days exposes it; 2 days was too
// shallow (user reports of gas flares showing in Ouargla, 2026-09-01).
const DAY_RANGE = 4;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_BODY_BYTES = 5_000_000;

export function firmsAreaUrl(mapKey: string): string {
  return `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${SOURCE}/${ALGERIA_BBOX}/${DAY_RANGE}`;
}

/** Fail loud like the receipt salts: a missing key is a deploy mistake. */
export function getFirmsKey(): string {
  const key = process.env["FIRMS_MAP_KEY"];
  if (!key) throw new Error("FIRMS_MAP_KEY is not set (see .env.example).");
  return key;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function inFlareZone(lat: number, lng: number): boolean {
  return FLARE_ZONES.some((z) => haversineKm(lat, lng, z.lat, z.lng) <= z.radiusKm);
}

interface FirmsRow {
  lat: number;
  lng: number;
  brightTi4: number;
  acqDate: string;
  acqTime: string;
  satellite: string;
  confidence: string;
  frp: number;
  daynight: string;
}

/** Header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight */
export function parseFirmsCsv(text: string): FirmsRow[] {
  const lines = text.split("\n");
  const rows: FirmsRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const p = line.trim().split(",");
    if (p.length < 14) continue;
    const lat = Number(p[0]);
    const lng = Number(p[1]);
    const brightTi4 = Number(p[2]);
    const frp = Number(p[12]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    rows.push({
      lat,
      lng,
      brightTi4: Number.isFinite(brightTi4) ? brightTi4 : 0,
      acqDate: p[5] ?? "",
      acqTime: p[6] ?? "",
      satellite: p[7] ?? "",
      confidence: (p[9] ?? "").trim().toLowerCase(),
      frp: Number.isFinite(frp) ? frp : 0,
      daynight: (p[13] ?? "").trim().toUpperCase() === "D" ? "D" : "N",
    });
  }
  return rows;
}

const SATELLITE_NAMES: Record<string, string> = {
  N21: "NOAA-21",
  N20: "NOAA-20",
  NPP: "Suomi NPP",
};

/** VIIRS NRT acquisition time is HHMM UTC, not zero-padded ("124" = 01:24). */
function acqIso(date: string, time: string): string {
  const hhmm = time.padStart(4, "0");
  return `${date}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`;
}

/**
 * South of this latitude (industrial Sahara), a detection repeating at the
 * exact same pixel on 2+ distinct days (of the 4-day window) is masked as
 * static infrastructure: flares burn every night at the same spot, while
 * wildfires move, grow, or die. Northern repeats are never touched — real
 * fire fronts burn for days there.
 */
const PERSISTENCE_LAT_LIMIT = 33.5;

function persistentPixelKeys(rows: FirmsRow[]): Set<string> {
  const datesByPixel = new Map<string, Set<string>>();
  for (const r of rows) {
    const key = `${r.lat.toFixed(2)},${r.lng.toFixed(2)}`;
    const dates = datesByPixel.get(key) ?? new Set<string>();
    dates.add(r.acqDate);
    datesByPixel.set(key, dates);
  }
  const persistent = new Set<string>();
  for (const [key, dates] of datesByPixel) {
    if (dates.size >= 2) persistent.add(key);
  }
  return persistent;
}

/**
 * Rows → display hotspots. Filters: drop low confidence (NASA: mostly
 * sun-glint false alarms), anything outside Algeria (the API bbox is a
 * rectangle — it necessarily catches Morocco/Tunisia/the sea), anything
 * inside a static flare zone, and southern same-pixel repeats.
 */
export function rowsToHotspots(rows: FirmsRow[]): Hotspot[] {
  const persistent = persistentPixelKeys(rows);
  const out: Hotspot[] = [];
  for (const r of rows) {
    if (r.confidence === "l") continue;
    if (!wilayaCodeForPoint(r.lat, r.lng)) continue;
    if (inFlareZone(r.lat, r.lng)) continue;
    if (
      r.lat <= PERSISTENCE_LAT_LIMIT &&
      persistent.has(`${r.lat.toFixed(2)},${r.lng.toFixed(2)}`)
    ) {
      continue;
    }
    out.push({
      id: `${r.lat.toFixed(4)},${r.lng.toFixed(4)},${r.acqDate},${r.acqTime}`,
      lat: r.lat,
      lng: r.lng,
      confidence: r.confidence === "h" ? "high" : "nominal",
      frp: Math.round(r.frp * 10) / 10,
      brightnessC: Math.round((r.brightTi4 - 273.15) * 10) / 10,
      acquiredAt: acqIso(r.acqDate, r.acqTime),
      daynight: r.daynight === "D" ? "day" : "night",
      satellite: SATELLITE_NAMES[r.satellite] ?? r.satellite,
    });
  }
  return out;
}

export function hotspotsGeoJSON(hotspots: Hotspot[]): FeatureCollection {
  const features: Feature[] = hotspots.map((h) => ({
    type: "Feature",
    id: h.id,
    properties: { ...h },
    geometry: { type: "Point", coordinates: [h.lng, h.lat] },
  }));
  return { type: "FeatureCollection", features };
}

/** Fetch + parse + filter. Throws on network/HTTP failure (route maps to 502). */
export async function fetchHotspots(): Promise<FeatureCollection> {
  const res = await fetch(firmsAreaUrl(getFirmsKey()), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "user-agent": "green-algeria/1.0 (community wildfire map)" },
  });
  if (!res.ok) throw new Error(`FIRMS responded ${res.status}`);
  const text = await res.text();
  if (text.length > MAX_BODY_BYTES) throw new Error("FIRMS response too large");
  return hotspotsGeoJSON(rowsToHotspots(parseFirmsCsv(text)));
}
