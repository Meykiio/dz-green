import { describe, expect, it } from "vitest";
import { volunteerSchema } from "@/lib/volunteers.functions";

const good = {
  name: "Yasmine",
  email: "yasmine@example.com",
  phone: "0550123456",
  wilaya_code: "16",
  intents: ["review", "triage"],
};

describe("volunteerSchema", () => {
  it("accepts a complete application", () => {
    const parsed = volunteerSchema.safeParse({
      ...good,
      extra_wilayas: "31, 31",
      availability: "a few evenings a week",
      message: "I love the map",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.intents).toEqual(["review", "triage"]);
  });

  it("accepts minimal fields with a honeypot", () => {
    expect(volunteerSchema.safeParse({ ...good, hp: "" }).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(volunteerSchema.safeParse({ ...good, name: "" }).success).toBe(false);
  });

  it("rejects a bad email", () => {
    expect(volunteerSchema.safeParse({ ...good, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects empty intents", () => {
    expect(volunteerSchema.safeParse({ ...good, intents: [] }).success).toBe(false);
  });

  it("rejects an unknown intent", () => {
    expect(
      volunteerSchema.safeParse({ ...good, intents: ["review", "hack"] }).success,
    ).toBe(false);
  });

  it("rejects a missing wilaya", () => {
    expect(volunteerSchema.safeParse({ ...good, wilaya_code: "" }).success).toBe(false);
  });

  it("rejects a message over 600 chars", () => {
    expect(volunteerSchema.safeParse({ ...good, message: "x".repeat(601) }).success).toBe(false);
  });
});
