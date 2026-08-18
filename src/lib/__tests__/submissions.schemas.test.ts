import { describe, expect, it } from "vitest";
import { careSchema, fireSchema, plantingSchema } from "@/lib/submissions.functions";

const UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const PHOTO = "data:image/jpeg;base64," + "A".repeat(20);

const validPlanting = {
  lat: 36.7538,
  lng: 3.0588,
  wilaya_code: "16",
  photo: PHOTO,
  tree_count: 10,
  planted_date: "2026-03-01",
};

describe("plantingSchema", () => {
  it("accepts a complete valid submission", () => {
    expect(plantingSchema.safeParse(validPlanting).success).toBe(true);
  });

  it("accepts a wilaya-only submission (no coordinates)", () => {
    const { lat: _lat, lng: _lng, ...wilayaOnly } = validPlanting;
    expect(plantingSchema.safeParse(wilayaOnly).success).toBe(true);
  });

  it("rejects a half coordinate pair (lat without lng)", () => {
    const { lng: _lng, ...half } = validPlanting;
    expect(plantingSchema.safeParse(half).success).toBe(false);
  });

  it("rejects a future planted_date", () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    expect(plantingSchema.safeParse({ ...validPlanting, planted_date: future }).success).toBe(
      false,
    );
  });

  it.each([
    ["missing photo", { ...validPlanting, photo: undefined }],
    ["photo shorter than 20 chars", { ...validPlanting, photo: "A".repeat(19) }],
    ["tree_count 0", { ...validPlanting, tree_count: 0 }],
    ["tree_count 100001", { ...validPlanting, tree_count: 100001 }],
    ["lat 90.1", { ...validPlanting, lat: 90.1 }],
    ["lng -180.1", { ...validPlanting, lng: -180.1 }],
    ["wilaya_code empty", { ...validPlanting, wilaya_code: "" }],
    ["wilaya_code 5 chars", { ...validPlanting, wilaya_code: "12345" }],
    ["planted_date 7 chars", { ...validPlanting, planted_date: "2026-03" }],
    ["planted_date 11 chars", { ...validPlanting, planted_date: "2026-03-010" }],
    ["notes over 1000 chars", { ...validPlanting, notes: "x".repeat(1001) }],
    ["planter name over 80 chars", { ...validPlanting, planter_display_name: "x".repeat(81) }],
  ])("rejects %s", (_label, input) => {
    expect(plantingSchema.safeParse(input).success).toBe(false);
  });
});

const validCare = {
  site_id: UUID,
  action: "watered",
  logged_date: "2026-08-01",
};

describe("careSchema", () => {
  it("accepts a complete valid submission", () => {
    expect(careSchema.safeParse(validCare).success).toBe(true);
  });

  it("rejects a future logged_date", () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    expect(careSchema.safeParse({ ...validCare, logged_date: future }).success).toBe(false);
  });

  it.each([
    ["site_id not a uuid", { ...validCare, site_id: "not-a-uuid" }],
    ["unknown action", { ...validCare, action: "evaporated" }],
    ["missing action", { ...validCare, action: undefined }],
    ["missing logged_date", { ...validCare, logged_date: undefined }],
    ["photo shorter than 20 chars", { ...validCare, photo: "A".repeat(19) }],
  ])("rejects %s", (_label, input) => {
    expect(careSchema.safeParse(input).success).toBe(false);
  });
});

const validFire = {
  lat: 36.7538,
  lng: 3.0588,
  wilaya_code: "16",
  severity: "small",
  description: "Smoke near the national road.",
  reporter_name: "Sifeddine",
  reporter_phone: "0550 12 34 56",
};

describe("fireSchema", () => {
  it("accepts a complete valid submission", () => {
    expect(fireSchema.safeParse(validFire).success).toBe(true);
  });

  it("accepts missing optional fields", () => {
    expect(fireSchema.safeParse({ lat: 36.7, lng: 3.0, wilaya_code: "16" }).success).toBe(true);
  });

  it("accepts a wilaya-only report (no coordinates)", () => {
    expect(fireSchema.safeParse({ wilaya_code: "16" }).success).toBe(true);
  });

  it("rejects a half coordinate pair (lng without lat)", () => {
    expect(fireSchema.safeParse({ lng: 3.0, wilaya_code: "16" }).success).toBe(false);
  });

  it.each([
    ["unknown severity", { ...validFire, severity: "huge" }],
    ["description over 600 chars", { ...validFire, description: "x".repeat(601) }],
    ["reporter name over 80 chars", { ...validFire, reporter_name: "x".repeat(81) }],
    ["reporter phone over 40 chars", { ...validFire, reporter_phone: "x".repeat(41) }],
    ["lat 91", { ...validFire, lat: 91 }],
    ["missing lat", { ...validFire, lat: undefined }],
  ])("rejects %s", (_label, input) => {
    expect(fireSchema.safeParse(input).success).toBe(false);
  });
});
