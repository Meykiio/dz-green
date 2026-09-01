/**
 * Open-Meteo fire weather — server-only, no API key (free non-commercial).
 * Current conditions for a point: what a viewer/moderator needs to read a
 * fire's danger — temperature, humidity, wind (speed, direction, gusts).
 * Tiny in-memory cache (0.1° grid, 30 min) to stay polite on repeat clicks.
 * Shared pure helpers (compass, FireWeather) live in ./weather.
 */

import type { FireWeather } from "./weather";

const cache = new Map<string, { at: number; data: FireWeather }>();
const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

interface OpenMeteoCurrent {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
  };
}

/** Map the API response; throws on a malformed payload. */
export function mapCurrent(json: OpenMeteoCurrent): FireWeather {
  const c = json.current;
  if (
    !c ||
    typeof c.temperature_2m !== "number" ||
    typeof c.relative_humidity_2m !== "number" ||
    typeof c.wind_speed_10m !== "number" ||
    typeof c.wind_direction_10m !== "number"
  ) {
    throw new Error("Open-Meteo: malformed current payload");
  }
  return {
    temperatureC: Math.round(c.temperature_2m * 10) / 10,
    humidityPct: Math.round(c.relative_humidity_2m),
    windSpeedKmh: Math.round(c.wind_speed_10m),
    windGustsKmh: Math.round(c.wind_gusts_10m ?? 0),
    windDirectionDeg: c.wind_direction_10m,
  };
}

interface OpenMeteoDailyLocation {
  daily?: { precipitation_sum?: (number | null)[] };
}

/**
 * Rainfall totals (mm) over the past 14 days for a batch of points, one
 * multi-coordinate request (Open-Meteo accepts comma-separated coords).
 * Returns one total per input point, same order. Capped by the caller.
 */
export function mapRainTotals(json: OpenMeteoDailyLocation | OpenMeteoDailyLocation[]): number[] {
  const locations = Array.isArray(json) ? json : [json];
  return locations.map((loc) =>
    (loc.daily?.precipitation_sum ?? []).reduce<number>((sum, v) => sum + (v ?? 0), 0),
  );
}

export async function fetchDailyRainMm(
  points: { lat: number; lng: number }[],
): Promise<number[]> {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.lat.toFixed(4)).join(",");
  const lngs = points.map((p) => p.lng.toFixed(4)).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}` +
    `&daily=precipitation_sum&past_days=14&forecast_days=1&timezone=GMT`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const totals = mapRainTotals((await res.json()) as OpenMeteoDailyLocation[]);
  return totals.map((t) => Math.round(t * 10) / 10);
}

export interface AirQuality {
  pm25: number;
  dust: number;
}

interface OpenMeteoAirCurrent {
  current?: { pm2_5?: number; dust?: number };
}

export function mapAirQuality(json: OpenMeteoAirCurrent): AirQuality {
  const c = json.current;
  if (!c || typeof c.pm2_5 !== "number" || typeof c.dust !== "number") {
    throw new Error("Open-Meteo: malformed air-quality payload");
  }
  return { pm25: Math.round(c.pm2_5 * 10) / 10, dust: Math.round(c.dust * 10) / 10 };
}

/** CAMS air quality for a point (PM2.5 + Saharan dust), same cache map. */
export async function fetchAirQuality(lat: number, lng: number): Promise<AirQuality> {
  const key = `aq:${lat.toFixed(1)},${lng.toFixed(1)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.data as unknown as AirQuality;
  }
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(4)}` +
    `&longitude=${lng.toFixed(4)}&current=pm2_5,dust`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open-Meteo AQ responded ${res.status}`);
  const data = mapAirQuality((await res.json()) as OpenMeteoAirCurrent);
  cache.set(key, { at: Date.now(), data: data as unknown as FireWeather });
  return data;
}

export async function fetchFireWeather(lat: number, lng: number): Promise<FireWeather> {
  const key = `${lat.toFixed(1)},${lng.toFixed(1)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m`;
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const data = mapCurrent((await res.json()) as OpenMeteoCurrent);
  cache.set(key, { at: Date.now(), data });
  return data;
}
