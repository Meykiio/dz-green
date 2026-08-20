import { describe, expect, it } from "vitest";
import { feedbackSchema } from "@/lib/feedback.functions";

describe("feedbackSchema", () => {
  it("accepts a plain message", () => {
    expect(feedbackSchema.safeParse({ message: "Nice map" }).success).toBe(true);
  });

  it("accepts a page and empty honeypot", () => {
    expect(
      feedbackSchema.safeParse({ message: "Nice map", page: "/about", hp: "" }).success,
    ).toBe(true);
  });

  it("accepts an optional device user-agent", () => {
    const parsed = feedbackSchema.safeParse({
      message: "Map disappeared",
      device: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.device).toBe("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36");
  });

  it("rejects a device string over 300 chars", () => {
    expect(feedbackSchema.safeParse({ message: "x", device: "x".repeat(301) }).success).toBe(
      false,
    );
  });

  it("trims whitespace-only messages to empty and rejects them", () => {
    expect(feedbackSchema.safeParse({ message: "   " }).success).toBe(false);
  });

  it("rejects a message over 2000 chars", () => {
    expect(feedbackSchema.safeParse({ message: "x".repeat(2001) }).success).toBe(false);
  });

  it("trims the message before validating length", () => {
    const parsed = feedbackSchema.safeParse({ message: "  nice map  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.message).toBe("nice map");
  });

  it("rejects an empty message", () => {
    expect(feedbackSchema.safeParse({ message: "" }).success).toBe(false);
  });
});