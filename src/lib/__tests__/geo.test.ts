import { describe, expect, it } from "vitest";
import {
  mapCodeForPoint,
  projectToMap,
  SHAPE_BY_CODE,
  wilayaCenterLatLng,
  wilayaCodeForPoint,
} from "@/lib/geo";
import { WILAYAS } from "@/lib/wilayas";

const cases: Array<[number, number, string | null, string]> = [
  [36.7538, 3.0588, "16", "Algiers"],
  [35.6969, -0.6331, "31", "Oran"],
  [22.785, 5.5228, "11", "Tamanrasset"],
  [36.9, 7.767, "23", "Annaba"],
  [36.365, 6.615, "25", "Constantine"],
  [36.47, 2.83, "09", "Blida"],
  [34.882, -1.316, "13", "Tlemcen"],
  [32.49, 3.67, "47", "Ghardaia"],
  [31.95, 5.32, "30", "Ouargla"],
  [31.62, -2.22, "08", "Bechar"],
  [37.25, 6.0, null, "Mediterranean sea (north of the coast)"],
  [34.0, -4.0, null, "Morocco (outside the border)"],
  // The 2025 division (Law 26-06): new wilayas resolve to their own codes.
  [34.11, 2.1, "59", "Aflou"],
  [35.39, 5.37, "60", "Barika"],
  [35.22, 5.7, "61", "El Kantara"],
  [34.75, 8.06, "62", "Bir El Ater"],
  [34.41, -1.31, "63", "El Aricha"],
  [35.21, 2.32, "64", "Ksar Chellala"],
  [35.45, 2.9, "65", "Aïn Oussera"],
  [33.75, 4.1, "66", "Messaad"],
  [35.89, 2.75, "67", "Ksar El Boukhari"],
  [35.21, 4.18, "68", "Bou Saâda"],
  [32.9, 0.55, "69", "El Abiodh Sidi Cheikh"],
  // The 2019 wilayas now have their own polygons too.
  [29.26, 0.24, "49", "Timimoun"],
  [33.1, 6.06, "55", "Touggourt"],
];

describe("wilayaCodeForPoint", () => {
  it.each(cases)("resolves (%p, %p) to %p — %s", (lat, lng, expected) => {
    expect(wilayaCodeForPoint(lat, lng)).toBe(expected);
  });
});

describe("mapCodeForPoint", () => {
  it("uses the actual position over a wrong stored wilaya_code (the 2026-08-17 disappearing-dot case)", () => {
    const lat = 32.112335614009;
    const lng = 3.79398293666586;
    expect(mapCodeForPoint(lat, lng, "05")).toBe("47");
  });

  it("keeps a correct stored code", () => {
    expect(mapCodeForPoint(36.7538, 3.0588, "16")).toBe("16");
  });

  it("falls back to the stored code when the point is outside every polygon", () => {
    expect(mapCodeForPoint(37.25, 6.0, "16")).toBe("16");
    expect(mapCodeForPoint(34.0, -4.0, "13")).toBe("13");
  });
});

describe("wilayaCenterLatLng", () => {
  it("returns a real coordinate inside Algeria's bounds for every historic wilaya", () => {
    for (const w of WILAYAS.filter((w) => w.code === w.mapCode)) {
      const center = wilayaCenterLatLng(w.code);
      expect(center, `wilaya ${w.code}`).not.toBeNull();
      expect(center!.lat).toBeGreaterThan(18);
      expect(center!.lat).toBeLessThan(40);
      expect(center!.lng).toBeGreaterThan(-9);
      expect(center!.lng).toBeLessThan(12);
    }
  });

  it("round-trips through the projection (centre maps back to the shape's cx/cy)", () => {
    const center = wilayaCenterLatLng("16")!;
    const { x, y } = projectToMap(center.lat, center.lng);
    const shape = SHAPE_BY_CODE["16"]!;
    expect(x).toBeCloseTo(shape.cx, 6);
    expect(y).toBeCloseTo(shape.cy, 6);
  });

  it("returns null for an unknown code", () => {
    expect(wilayaCenterLatLng("99")).toBeNull();
  });
});
