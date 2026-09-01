import { describe, expect, it } from "vitest";
import { CARE_WINDOW_DAYS, needsWater, type CareLog, type Site } from "@/lib/types";

const DAY = 86400000;

function site(overrides: Partial<Site> = {}): Site {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    lat: 36.75,
    lng: 3.05,
    wilaya_code: "16",
    location_approximate: false,
    commune: "Alger",
    photo_url: "",
    species: null,
    tree_count: 1,
    planted_date: new Date(Date.now() - 100 * DAY).toISOString().slice(0, 10),
    notes: null,
    planter_display_name: null,
    status: "approved",
    created_at: new Date(Date.now() - 100 * DAY).toISOString(),
    ...overrides,
  };
}

function log(daysAgo: number, overrides: Partial<CareLog> = {}): CareLog {
  return {
    id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    site_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    action: "watered",
    submitter_name: null,
    photo_url: null,
    notes: null,
    logged_date: new Date(Date.now() - daysAgo * DAY).toISOString().slice(0, 10),
    created_at: new Date(Date.now() - daysAgo * DAY).toISOString(),
    ...overrides,
  };
}

const OTHER_SITE_ID = "dddddddd-dddd-4ddd-8ddd-ddddddddddd1";

describe("needsWater (CARE_WINDOW_DAYS = 14)", () => {
  it("is false with no logs and a planted date 13 days ago", () => {
    expect(
      needsWater(
        site({ planted_date: new Date(Date.now() - 13 * DAY).toISOString().slice(0, 10) }),
        [],
      ),
    ).toBe(false);
  });

  it("is true with no logs and a planted date 15 days ago", () => {
    expect(
      needsWater(
        site({ planted_date: new Date(Date.now() - 15 * DAY).toISOString().slice(0, 10) }),
        [],
      ),
    ).toBe(true);
  });

  it("is true at the calendar boundary (planted exactly 14 days ago)", () => {
    expect(
      needsWater(
        site({ planted_date: new Date(Date.now() - 14 * DAY).toISOString().slice(0, 10) }),
        [],
      ),
    ).toBe(true);
  });

  it("is false when planted today", () => {
    expect(
      needsWater(site({ planted_date: new Date(Date.now()).toISOString().slice(0, 10) }), []),
    ).toBe(false);
  });

  it("is false with a care log 13 days ago regardless of planted date", () => {
    expect(needsWater(site(), [log(13)])).toBe(false);
  });

  it("issue #39: a backdated logged_date cannot fake freshness (created_at wins)", () => {
    const backdated = log(0, {
      logged_date: new Date(Date.now() - 60 * DAY).toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    });
    expect(needsWater(site(), [backdated])).toBe(false);
  });

  it("rain-aware: >= 10mm in the window clears an overdue site", () => {
    const old = site({ planted_date: new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10) });
    expect(needsWater(old, [], 12.4)).toBe(false);
  });

  it("rain-aware: < 10mm keeps an overdue site thirsty", () => {
    const old = site({ planted_date: new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10) });
    expect(needsWater(old, [], 3.2)).toBe(true);
  });

  it("rain-aware: null/undefined rainfall falls back to the time-only rule", () => {
    const old = site({ planted_date: new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10) });
    expect(needsWater(old, [], null)).toBe(true);
    expect(needsWater(old, [])).toBe(true);
  });

  it("rain-aware: recent care wins regardless of rainfall", () => {
    expect(needsWater(site(), [log(2)], 0)).toBe(false);
  });

  it("issue #39: an old created_at makes the site thirsty even with a recent logged_date", () => {
    const oldInsert = log(0, {
      logged_date: new Date().toISOString().slice(0, 10),
      created_at: new Date(Date.now() - 20 * DAY).toISOString(),
    });
    expect(needsWater(site(), [oldInsert])).toBe(true);
  });

  it("is true with a care log 15 days ago", () => {
    expect(needsWater(site(), [log(15)])).toBe(true);
  });

  it("is false with a care log today", () => {
    expect(needsWater(site(), [log(0)])).toBe(false);
  });

  it("uses the most recent care log, not the oldest", () => {
    expect(needsWater(site(), [log(20), log(5)])).toBe(false);
  });

  it("ignores care logs for other sites and falls back to planted date", () => {
    expect(needsWater(site(), [log(1, { site_id: OTHER_SITE_ID })])).toBe(true);
  });
});
