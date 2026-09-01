import { describe, expect, it } from "vitest";

import { medianFix } from "@/lib/gps";

describe("medianFix", () => {
  it("returns null with no fixes", () => {
    expect(medianFix([])).toBeNull();
  });

  it("medians the last 3 good fixes, rejecting a lucky outlier", () => {
    const fixes = [
      { lat: 36.0, lng: 3.0, accuracy: 5 }, // lucky outlier, far off
      { lat: 36.75, lng: 3.06, accuracy: 20 },
      { lat: 36.751, lng: 3.061, accuracy: 18 },
      { lat: 36.749, lng: 3.059, accuracy: 22 },
    ];
    const out = medianFix(fixes)!;
    expect(out.lat).toBeCloseTo(36.75, 2);
    expect(out.lng).toBeCloseTo(3.06, 2);
    expect(out.accuracy).toBe(18); // best of the three
  });

  it("uses only fixes at ±100m or better when enough exist", () => {
    const fixes = [
      { lat: 30.0, lng: 0.0, accuracy: 400 },
      { lat: 36.75, lng: 3.06, accuracy: 30 },
      { lat: 36.76, lng: 3.07, accuracy: 25 },
    ];
    const out = medianFix(fixes)!;
    expect(out.lat).toBeCloseTo(36.755, 2);
  });

  it("falls back to the single best fix when good fixes are scarce", () => {
    const fixes = [
      { lat: 36.0, lng: 3.0, accuracy: 300 },
      { lat: 36.75, lng: 3.06, accuracy: 150 },
    ];
    const out = medianFix(fixes)!;
    expect(out.accuracy).toBe(150);
    expect(out.lat).toBe(36.75);
  });
});
