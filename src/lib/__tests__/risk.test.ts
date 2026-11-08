import { describe, expect, it } from "vitest";

import { RISK_POINTS, riskBand, riskGeoJSON, riskTopShare } from "@/lib/risk";

describe("risk rank (relative priority, not a probability)", () => {
  it("is spread evenly: about 10% of cells are High, 20% Medium", () => {
    const high = RISK_POINTS.filter((p) => riskBand(p.risk) === "high").length;
    const medium = RISK_POINTS.filter((p) => riskBand(p.risk) === "medium").length;
    expect(high / RISK_POINTS.length).toBeGreaterThan(0.09);
    expect(high / RISK_POINTS.length).toBeLessThan(0.12);
    expect(medium / RISK_POINTS.length).toBeGreaterThan(0.18);
    expect(medium / RISK_POINTS.length).toBeLessThan(0.22);
  });

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

describe("risk points data", () => {
  it("exposes the Kabylie grid with valid coordinates and scores", () => {
    expect(RISK_POINTS.length).toBeGreaterThan(3000);
    for (const p of RISK_POINTS.slice(0, 50)) {
      expect(p.lat).toBeGreaterThan(35);
      expect(p.lat).toBeLessThan(38);
      expect(p.lng).toBeGreaterThan(3);
      expect(p.lng).toBeLessThan(8);
      expect(p.risk).toBeGreaterThanOrEqual(0);
      expect(p.risk).toBeLessThanOrEqual(1);
      expect(p.id).toBe(`${p.lng},${p.lat}`);
    }
  });

  it("has unique ids", () => {
    const ids = new Set(RISK_POINTS.map((p) => p.id));
    expect(ids.size).toBe(RISK_POINTS.length);
  });
});

describe("riskGeoJSON", () => {
  it("builds a valid FeatureCollection with risk properties", () => {
    const fc = riskGeoJSON();
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(RISK_POINTS.length);
    const f = fc.features[0]!;
    expect(f.type).toBe("Feature");
    expect(f.geometry.type).toBe("Point");
    expect(f.properties).toMatchObject({ kind: "risk" });
    expect(typeof (f.properties as { risk: number }).risk).toBe("number");
  });
});
