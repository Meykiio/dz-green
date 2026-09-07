import { describe, expect, it } from "vitest";
import { z } from "zod";

import { isCommunityVerified } from "@/lib/confirmations.server";

const voteSchema = z.object({
  fireReportId: z.string().uuid(),
  verdict: z.enum(["yes", "no", "unsure"]),
  deviceSecret: z.string().min(8).max(200),
});

describe("fire confirmation vote schema", () => {
  it("accepts a valid vote", () => {
    const v = voteSchema.parse({
      fireReportId: "123e4567-e89b-12d3-a456-426614174000",
      verdict: "yes",
      deviceSecret: "device-secret-123",
    });
    expect(v.verdict).toBe("yes");
  });

  it("rejects a bad verdict and a short secret", () => {
    expect(() =>
      voteSchema.parse({ fireReportId: "123e4567-e89b-12d3-a456-426614174000", verdict: "maybe", deviceSecret: "device-secret-123" }),
    ).toThrow();
    expect(() =>
      voteSchema.parse({ fireReportId: "123e4567-e89b-12d3-a456-426614174000", verdict: "yes", deviceSecret: "short" }),
    ).toThrow();
  });

  it("rejects a non-uuid fire id", () => {
    expect(() =>
      voteSchema.parse({ fireReportId: "not-a-uuid", verdict: "no", deviceSecret: "device-secret-123" }),
    ).toThrow();
  });
});

describe("isCommunityVerified", () => {
  it("requires at least 3 yes votes", () => {
    expect(isCommunityVerified(2, 0)).toBe(false);
    expect(isCommunityVerified(3, 0)).toBe(true);
  });

  it("requires >70% yes ratio", () => {
    expect(isCommunityVerified(3, 2)).toBe(false); // 60%
    expect(isCommunityVerified(7, 2)).toBe(true); // ~78%
  });

  it("handles zero votes safely", () => {
    expect(isCommunityVerified(0, 0)).toBe(false);
  });
});
