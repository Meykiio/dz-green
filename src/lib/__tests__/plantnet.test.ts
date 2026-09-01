import { describe, expect, it } from "vitest";

import { mapPlantNet } from "@/lib/plantnet.server";

describe("mapPlantNet", () => {
  it("maps top results with common name preferred", () => {
    const out = mapPlantNet({
      results: [
        {
          score: 0.62,
          species: {
            scientificNameWithoutAuthor: "Pinus halepensis",
            commonNames: ["Aleppo pine"],
          },
        },
        {
          score: 0.21,
          species: { scientificNameWithoutAuthor: "Pinus brutia", commonNames: [] },
        },
        { score: 0.05, species: { scientificNameWithoutAuthor: "Olea europaea" } },
      ],
    });
    expect(out).toHaveLength(2); // the 0.05 result is below MIN_SCORE
    expect(out[0]).toEqual({
      label: "Aleppo pine (Pinus halepensis)",
      scientific: "Pinus halepensis",
      score: 0.62,
    });
    expect(out[1]!.label).toBe("Pinus brutia"); // no common name → scientific
  });

  it("returns [] on empty or malformed payloads", () => {
    expect(mapPlantNet({})).toEqual([]);
    expect(mapPlantNet({ results: [] })).toEqual([]);
  });
});
