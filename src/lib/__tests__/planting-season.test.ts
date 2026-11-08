import { describe, expect, it } from "vitest";

import { plantingSeason } from "@/lib/planting-season";

describe("plantingSeason (northern Algeria calendar)", () => {
  const m = (month: number) => plantingSeason(new Date(2026, month - 1, 15));
  it("November to March is planting time", () => {
    for (const month of [11, 12, 1, 2, 3]) expect(m(month)).toBe("now");
  });
  it("September and October are for preparation", () => {
    expect(m(9)).toBe("soon");
    expect(m(10)).toBe("soon");
  });
  it("April to August is too dry for new seedlings", () => {
    for (const month of [4, 5, 6, 7, 8]) expect(m(month)).toBe("off");
  });
});
