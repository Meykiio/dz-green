import { describe, expect, it } from "vitest";

import { compass, pm25Band } from "@/lib/weather";
import { mapAirQuality, mapCurrent, mapRainTotals } from "@/lib/weather.server";

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

describe("pm25Band", () => {
  it("bands PM2.5 on the US AQI breakpoints", () => {
    expect(pm25Band(5)).toBe("good");
    expect(pm25Band(12)).toBe("good");
    expect(pm25Band(20)).toBe("moderate");
    expect(pm25Band(40)).toBe("unhealthySensitive");
    expect(pm25Band(80)).toBe("unhealthy");
  });
});

describe("mapAirQuality", () => {
  it("maps a valid payload and rejects a malformed one", () => {
    expect(mapAirQuality({ current: { pm2_5: 42.24, dust: 120.07 } })).toEqual({
      pm25: 42.2,
      dust: 120.1,
    });
    expect(() => mapAirQuality({})).toThrow();
  });
});
