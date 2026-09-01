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
