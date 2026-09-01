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

  it("a post-2019 wilaya resolves to its historic parent", () => {
    const child = WILAYAS.find((w) => w.mapCode !== w.code)!;
    expect(shouldNotify(child.code, child.mapCode)).toBe(true);
    const other = WILAYAS.find((w) => w.mapCode !== child.mapCode && w.code === w.mapCode)!;
    expect(shouldNotify(child.code, other.code)).toBe(false);
  });
});
