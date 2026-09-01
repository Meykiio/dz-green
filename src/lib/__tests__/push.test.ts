import { describe, expect, it } from "vitest";

import { shouldNotify } from "@/lib/push.server";
import { WILAYAS } from "@/lib/wilayas";

describe("shouldNotify", () => {
  it("null subscriber wilaya gets every fire (all of Algeria)", () => {
    expect(shouldNotify(null, "16")).toBe(true);
    expect(shouldNotify(null, "01")).toBe(true);
  });

  it("matching wilaya gets the fire, others don't", () => {
    expect(shouldNotify("16", "16")).toBe(true);
    expect(shouldNotify("16", "31")).toBe(false);
  });

  it("post-2019/2025 wilayas match their own code (69-polygon map)", () => {
    // mapCode is identity since the 69-polygon map; territory continuity for
    // moderators is handled at the DB level (assignments expanded to children).
    const child = WILAYAS.find((w) => Number(w.code) >= 49)!;
    expect(shouldNotify(child.code, child.code)).toBe(true);
    const other = WILAYAS.find((w) => w.code !== child.code)!;
    expect(shouldNotify(child.code, other.code)).toBe(false);
  });
});
