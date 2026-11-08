import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { RISK_TARGET_YEAR } from "@/lib/risk";
import { buildRestoreRows, type WilayaRiskFile } from "@/lib/restore";
import type { Site } from "@/lib/types";

const file: WilayaRiskFile = {
  version: "t",
  targetYear: 2027,
  burnedYears: "2016-2025",
  wilayas: [
    { code: "06", landKm2: 3211, highKm2: 2139, mediumKm2: 1072, burnedKm2: 1768, highShare: 0.67 },
    { code: "21", landKm2: 4051, highKm2: 2668, mediumKm2: 1383, burnedKm2: 1974, highShare: 0.66 },
    { code: "16", landKm2: 780, highKm2: 10, mediumKm2: 90, burnedKm2: 40, highShare: 0.01 },
  ],
};

const site = (wilaya_code: string, tree_count: number) => ({ wilaya_code, tree_count }) as Site;

describe("buildRestoreRows", () => {
  it("joins community trees per wilaya", () => {
    const rows = buildRestoreRows(file, [site("16", 5), site("16", 2), site("06", 1)], "trees");
    expect(rows[0]).toMatchObject({ code: "16", trees: 7, plantings: 2 });
    expect(rows.find((r) => r.code === "21")).toMatchObject({ trees: 0, plantings: 0 });
  });

  it("sorts by burned land, then by High-risk land", () => {
    expect(buildRestoreRows(file, [], "burned").map((r) => r.code)).toEqual(["21", "06", "16"]);
    expect(buildRestoreRows(file, [], "risk").map((r) => r.code)).toEqual(["21", "06", "16"]);
  });
});

describe("the published wilaya file", () => {
  const real = JSON.parse(
    readFileSync(join(process.cwd(), "public", "data", `fire-risk-wilayas-${RISK_TARGET_YEAR}.json`), "utf8"),
  ) as WilayaRiskFile;

  it("covers the northern wilayas with consistent areas", () => {
    expect(real.wilayas.length).toBeGreaterThan(40);
    for (const w of real.wilayas) {
      expect(w.code).toMatch(/^\d{2}$/);
      expect(w.highKm2 + w.mediumKm2).toBeLessThanOrEqual(w.landKm2 + 1);
      expect(w.burnedKm2).toBeLessThanOrEqual(w.landKm2 + 1);
    }
  });

  it("puts the known north-east forest belt among the most fire-touched", () => {
    const top = buildRestoreRows(real, [], "burned").slice(0, 8).map((r) => r.code);
    for (const code of ["06", "15", "18", "21"]) expect(top).toContain(code);
  });
});

describe("wilayaNumParam (URL search values)", () => {
  it("accepts JSON-parsed numbers and numeric strings, rejects unknown codes", async () => {
    const { wilayaCodeOf, wilayaNumParam } = await import("@/lib/wilayas");
    expect(wilayaNumParam.parse(15)).toBe(15);
    expect(wilayaNumParam.parse("06")).toBe(6);
    expect(wilayaCodeOf(6)).toBe("06");
    expect(wilayaNumParam.safeParse(99).success).toBe(false);
    expect(wilayaNumParam.safeParse("abc").success).toBe(false);
    expect(wilayaNumParam.safeParse(1.5).success).toBe(false);
  });
});
