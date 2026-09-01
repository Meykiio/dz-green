/** Shared (client + server) weather helpers — pure, no fetching. */

const COMPASS_8 = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
export type Compass = (typeof COMPASS_8)[number];

/** Degrees → 8-wind compass key (i18n'd in the UI). */
export function compass(deg: number): Compass {
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return COMPASS_8[idx]!;
}

export interface FireWeather {
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  /** 0-359, meteorological (the direction the wind comes FROM). */
  windDirectionDeg: number;
}

export type Pm25Band = "good" | "moderate" | "unhealthySensitive" | "unhealthy";

/** PM2.5 µg/m³ → a simple, explainable band (US AQI breakpoints). */
export function pm25Band(pm25: number): Pm25Band {
  if (pm25 <= 12) return "good";
  if (pm25 <= 35.4) return "moderate";
  if (pm25 <= 55.4) return "unhealthySensitive";
  return "unhealthy";
}
