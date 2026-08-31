import { describe, expect, it } from "vitest";

import {
  hotspotsGeoJSON,
  inFlareZone,
  parseFirmsCsv,
  rowsToHotspots,
} from "@/lib/hotspots.server";

const HEADER =
  "latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight";

function row(overrides: Partial<Record<string, string>> = {}): string {
  const cols = [
    "36.10", "9.70", "323.15", "0.43", "0.38", "2026-08-31", "124",
    "N21", "VIIRS", "n", "2.0NRT", "299.55", "12.3", "D",
  ];
  const idx: Record<string, number> = {
    latitude: 0, longitude: 1, bright_ti4: 2, acq_date: 5, acq_time: 6,
    satellite: 7, confidence: 9, frp: 12, daynight: 13,
  };
  for (const [k, v] of Object.entries(overrides)) {
    const i = idx[k];
    if (i !== undefined && v !== undefined) cols[i] = v;
  }
  return cols.join(",");
}

describe("parseFirmsCsv", () => {
  it("parses valid rows and skips malformed lines", () => {
    const csv = [HEADER, row(), "bad,row", "1,2,3", row({ latitude: "35.0" })].join("\n");
    const rows = parseFirmsCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]!).toMatchObject({ lat: 36.1, lng: 9.7, confidence: "n", daynight: "D" });
  });

  it("defaults daynight to N for unknown values", () => {
    const rows = parseFirmsCsv([HEADER, row({ daynight: "X" })].join("\n"));
    expect(rows[0]!.daynight).toBe("N");
  });
});

describe("rowsToHotspots", () => {
  it("drops low-confidence rows (NASA: mostly sun-glint false alarms)", () => {
    const csv = [HEADER, row({ confidence: "l" })].join("\n");
    expect(rowsToHotspots(parseFirmsCsv(csv))).toHaveLength(0);
  });

  it("drops flare-zone points even at high confidence (Hassi Messaoud)", () => {
    const csv = [HEADER, row({ latitude: "31.68", longitude: "6.07", confidence: "h" })].join("\n");
    expect(rowsToHotspots(parseFirmsCsv(csv))).toHaveLength(0);
  });

  it("keeps a northern nominal point and converts K to °C", () => {
    const csv = [HEADER, row()].join("\n");
    const h = rowsToHotspots(parseFirmsCsv(csv))[0]!;
    expect(h.confidence).toBe("nominal");
    expect(h.brightnessC).toBe(50); // 323.15 K - 273.15
    expect(h.frp).toBe(12.3);
    expect(h.daynight).toBe("day");
  });

  it("zero-pads HHMM acquisition time into ISO UTC", () => {
    const csv = [HEADER, row({ acq_time: "124" })].join("\n");
    const h = rowsToHotspots(parseFirmsCsv(csv))[0]!;
    expect(h.acquiredAt).toBe("2026-08-31T01:24:00Z");
  });

  it("maps satellite codes to display names", () => {
    const csv = [HEADER, row({ satellite: "N21" })].join("\n");
    const h = rowsToHotspots(parseFirmsCsv(csv))[0]!;
    expect(h.satellite).toBe("NOAA-21");
  });

  it("masks a southern pixel repeating on 2 days (static infrastructure)", () => {
    const csv = [
      HEADER,
      row({ latitude: "28.50", longitude: "7.50", acq_date: "2026-08-30" }),
      row({ latitude: "28.50", longitude: "7.50", acq_date: "2026-08-31" }),
    ].join("\n");
    expect(rowsToHotspots(parseFirmsCsv(csv))).toHaveLength(0);
  });

  it("keeps a northern pixel repeating on 2 days (real fire front)", () => {
    const csv = [
      HEADER,
      row({ latitude: "36.10", longitude: "9.70", acq_date: "2026-08-30" }),
      row({ latitude: "36.10", longitude: "9.70", acq_date: "2026-08-31" }),
    ].join("\n");
    expect(rowsToHotspots(parseFirmsCsv(csv))).toHaveLength(2);
  });

  it("keeps a southern pixel seen on one day only", () => {
    const csv = [HEADER, row({ latitude: "28.50", longitude: "7.50" })].join("\n");
    expect(rowsToHotspots(parseFirmsCsv(csv))).toHaveLength(1);
  });
});

describe("inFlareZone", () => {
  it("is true inside Hassi R'Mel radius, false for Algiers", () => {
    expect(inFlareZone(32.93, 3.27)).toBe(true);
    expect(inFlareZone(36.75, 3.06)).toBe(false);
  });
});

describe("hotspotsGeoJSON", () => {
  it("emits [lng, lat] geometry with the hotspot as properties", () => {
    const csv = [HEADER, row()].join("\n");
    const h = rowsToHotspots(parseFirmsCsv(csv))[0]!;
    const fc = hotspotsGeoJSON([h]);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0]!.geometry).toEqual({ type: "Point", coordinates: [9.7, 36.1] });
    expect(fc.features[0]!.properties).toMatchObject({ id: h.id, confidence: "nominal" });
  });
});
