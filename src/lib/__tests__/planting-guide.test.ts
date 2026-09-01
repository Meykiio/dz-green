import { describe, expect, it } from "vitest";

import { suggestForWilaya } from "@/lib/planting-guide";
import { SPECIES_GUIDE, WILAYA_CLIMATE } from "@/data/species-guide";
import { WILAYA_SPECIES } from "@/data/wilaya-species";

describe("suggestForWilaya", () => {
  it("returns [] for an unknown wilaya code", () => {
    expect(suggestForWilaya("99")).toEqual([]);
  });

  it("only suggests species that fit the wilaya's climate class", () => {
    for (const code of Object.keys(WILAYA_CLIMATE)) {
      const climate = WILAYA_CLIMATE[code]!;
      for (const s of suggestForWilaya(code)) {
        expect(s.species.fits, `${s.species.latin} for ${code} (${climate})`).toContain(climate);
      }
    }
  });

  it("evidence-ranked species come before climate-fit-only ones", () => {
    // Béjaïa (06) has Pistacia lentiscus + Olea europaea in its GBIF evidence.
    const out = suggestForWilaya("06");
    const firstFit = out.findIndex((s) => s.reason === "fit");
    const lastEvidence = out.map((s, i) => (s.reason === "evidence" ? i : -1)).filter((i) => i >= 0).pop();
    if (firstFit >= 0 && lastEvidence != null) {
      expect(lastEvidence).toBeLessThan(firstFit);
    }
    expect(out.some((s) => s.reason === "evidence")).toBe(true);
  });

  it("boosts a guide species recorded in the wilaya (Tamanrasset acacia)", () => {
    const hasAcacia = (WILAYA_SPECIES["11"] ?? []).some((e) => e.latin.startsWith("Vachellia tortilis"));
    expect(hasAcacia).toBe(true);
    const out = suggestForWilaya("11");
    const acacia = out.find((s) => s.species.latin.startsWith("Vachellia tortilis"));
    expect(acacia?.reason).toBe("evidence");
  });

  it("never suggests Mediterranean-only species for arid wilayas", () => {
    for (const code of ["01", "11", "30", "49"]) {
      for (const s of suggestForWilaya(code)) {
        expect(s.species.fits).toContain("arid");
      }
    }
  });

  it("caps at 4 suggestions", () => {
    for (const code of Object.keys(WILAYA_CLIMATE)) {
      expect(suggestForWilaya(code).length).toBeLessThanOrEqual(4);
    }
  });

  it("every climate class has at least 3 fitting guide species", () => {
    for (const climate of ["mediterranean", "semi-arid", "arid"] as const) {
      const fitting = SPECIES_GUIDE.filter((s) => s.fits.includes(climate));
      expect(fitting.length, climate).toBeGreaterThanOrEqual(3);
    }
  });
});
