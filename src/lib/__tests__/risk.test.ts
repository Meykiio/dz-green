import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  RISK_TARGET_YEAR,
  decodeRiskMap,
  riskBand,
  riskGeoJSON,
  riskTopShare,
  type RiskMapFile,
} from "@/lib/risk";

const sample: RiskMapFile = {
  version: "test",
  targetYear: 2027,
  cellDeg: 0.018,
  lon0: -2.3,
  lat0: 34.5,
  publishedFromRank: 0.7,
  test: { auc: 0.9, top10: 0.6, top20: 0.8 },
  cells: [0, 0, 95, 10, 20, 71],
};

describe("decodeRiskMap", () => {
  it("turns [ix, iy, rank%] triples into cell-centre points", () => {
    const [a, b] = decodeRiskMap(sample);
    expect(a).toEqual({ id: "0,0", lng: -2.291, lat: 34.509, risk: 0.95 });
    expect(b!.id).toBe("10,20");
    expect(b!.lng).toBeCloseTo(-2.3 + 10.5 * 0.018, 4);
    expect(b!.lat).toBeCloseTo(34.5 + 20.5 * 0.018, 4);
    expect(b!.risk).toBe(0.71);
  });

  it("builds a FeatureCollection with risk properties", () => {
    const fc = riskGeoJSON(decodeRiskMap(sample));
    expect(fc.features).toHaveLength(2);
    expect(fc.features[0]!.properties).toMatchObject({ kind: "risk", risk: 0.95 });
  });
});

describe("risk rank (relative priority, not a probability)", () => {
  it("maps rank to bands and top-share", () => {
    expect(riskBand(0.95)).toBe("high");
    expect(riskBand(0.9)).toBe("high");
    expect(riskBand(0.75)).toBe("medium");
    expect(riskBand(0.5)).toBe("low");
    expect(riskTopShare(0.95)).toBe(5);
    expect(riskTopShare(1)).toBe(1);
    expect(riskTopShare(0)).toBe(100);
  });
});

describe("the published national map file", () => {
  const file = JSON.parse(
    readFileSync(join(process.cwd(), "public", "data", `fire-risk-${RISK_TARGET_YEAR}.json`), "utf8"),
  ) as RiskMapFile;
  const points = decodeRiskMap(file);

  it("covers northern Algeria with only Medium and High cells", () => {
    expect(points.length).toBeGreaterThan(10_000);
    const range = (k: "lat" | "lng" | "risk") => {
      let lo = Infinity;
      let hi = -Infinity;
      for (const p of points) {
        lo = Math.min(lo, p[k]);
        hi = Math.max(hi, p[k]);
      }
      return { lo, hi };
    };
    const lat = range("lat");
    const lng = range("lng");
    const risk = range("risk");
    expect(lat.lo).toBeGreaterThan(34.4);
    expect(lat.hi).toBeLessThan(37.3);
    expect(lng.lo).toBeGreaterThan(-2.4);
    expect(lng.hi).toBeLessThan(8.8);
    expect(risk.lo).toBeGreaterThanOrEqual(0.7);
    expect(risk.hi).toBeLessThan(1);
  });

  it("splits about 1/3 High (top 10%) and 2/3 Medium (next 20%)", () => {
    const high = points.filter((p) => riskBand(p.risk) === "high").length / points.length;
    expect(high).toBeGreaterThan(0.3);
    expect(high).toBeLessThan(0.37);
  });

  it("has unique cells and carries its honest test numbers", () => {
    expect(new Set(points.map((p) => p.id)).size).toBe(points.length);
    expect(file.test.auc).toBeGreaterThan(0.5);
    expect(file.targetYear).toBe(RISK_TARGET_YEAR);
  });
});
