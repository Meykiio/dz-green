import { describe, expect, it } from "vitest";

import { latestAcceptedISO, todayLocalISO } from "@/lib/dates";

describe("dates", () => {
  it("todayLocalISO formats the local calendar date", () => {
    expect(todayLocalISO(new Date(2026, 0, 5, 0, 30))).toBe("2026-01-05");
  });

  it("server accepts up to one day ahead of UTC", () => {
    // 23:30 UTC on 7 Nov is already 00:30 on 8 Nov in Algiers.
    const now = new Date(Date.UTC(2026, 10, 7, 23, 30));
    expect(latestAcceptedISO(now)).toBe("2026-11-08");
  });
});
