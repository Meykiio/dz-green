import { describe, expect, it } from "vitest";

import { compass } from "@/lib/weather";
import { mapCurrent, mapRainTotals } from "@/lib/weather.server";

describe("compass", () => {
  it("maps degrees to 8-wind keys", () => {
    expect(compass(0)).toBe("n");
    expect(compass(22)).toBe("n");
    expect(compass(44)).toBe("ne");
    expect(compass(45)).toBe("ne");
    expect(compass(90)).toBe("e");
    expect(compass(200)).toBe("s");
    expect(compass(210)).toBe("sw");
    expect(compass(315)).toBe("nw");
    expect(compass(359)).toBe("n");
  });

  it("normalizes out-of-range degrees", () => {
    expect(compass(360)).toBe("n");
    expect(compass(-45)).toBe("nw");
  });
});

describe("mapCurrent", () => {
  it("maps a valid Open-Meteo current payload", () => {
    const w = mapCurrent({
      current: {
        temperature_2m: 38.24,
        relative_humidity_2m: 12.4,
        wind_speed_10m: 31.6,
        wind_direction_10m: 45,
        wind_gusts_10m: 52.2,
      },
    });
    expect(w).toEqual({
      temperatureC: 38.2,
      humidityPct: 12,
      windSpeedKmh: 32,
      windGustsKmh: 52,
      windDirectionDeg: 45,
    });
  });

  it("throws on a malformed payload", () => {
    expect(() => mapCurrent({})).toThrow();
    expect(() => mapCurrent({ current: { temperature_2m: 20 } })).toThrow();
  });
});

describe("mapRainTotals", () => {
  it("sums daily precipitation per location, aligned with input order", () => {
    const totals = mapRainTotals([
      { daily: { precipitation_sum: [1.5, 0, 2.5, null as unknown as number] } },
      { daily: { precipitation_sum: [0, 0, 0] } },
      { daily: {} },
    ]);
    expect(totals).toEqual([4, 0, 0]);
  });

  it("accepts a single-location (non-array) payload", () => {
    expect(mapRainTotals({ daily: { precipitation_sum: [3, 7] } })).toEqual([10]);
  });
});
