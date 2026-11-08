import { describe, expect, it } from "vitest";

import { SlidingWindowLimiter } from "@/lib/rate-limit";

describe("SlidingWindowLimiter", () => {
  it("allows up to the limit inside the window, then blocks", () => {
    const l = new SlidingWindowLimiter(3, 1000);
    expect([l.allow("a", 0), l.allow("a", 1), l.allow("a", 2)]).toEqual([true, true, true]);
    expect(l.allow("a", 3)).toBe(false);
  });

  it("frees capacity as old hits leave the window", () => {
    const l = new SlidingWindowLimiter(2, 1000);
    l.allow("a", 0);
    l.allow("a", 500);
    expect(l.allow("a", 900)).toBe(false);
    expect(l.allow("a", 1001)).toBe(true);
  });

  it("keeps keys independent", () => {
    const l = new SlidingWindowLimiter(1, 1000);
    expect(l.allow("a", 0)).toBe(true);
    expect(l.allow("b", 0)).toBe(true);
    expect(l.allow("a", 1)).toBe(false);
  });

  it("bounds memory by evicting keys", () => {
    const l = new SlidingWindowLimiter(1, 1000, 100);
    for (let i = 0; i < 1000; i++) l.allow(`k${i}`, i * 10);
    expect((l as unknown as { hits: Map<string, number[]> }).hits.size).toBeLessThanOrEqual(101);
  });
});
