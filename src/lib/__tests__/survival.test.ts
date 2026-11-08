import { describe, expect, it } from "vitest";

import {
  coverage,
  independenceFor,
  isDue,
  isMissingRelation,
  MIN_SITES_FOR_RATE,
  survivalRate,
} from "@/lib/survival";

describe("independenceFor (server-side only)", () => {
  const a = "11111111-1111-4111-8111-111111111111";
  const b = "22222222-2222-4222-8222-222222222222";
  it("staff beats everything", () => {
    expect(independenceFor({ checkerId: a, planterId: a, checkerIsStaff: true })).toBe("staff");
  });
  it("same signed-in person is self", () => {
    expect(independenceFor({ checkerId: a, planterId: a, checkerIsStaff: false })).toBe("self");
  });
  it("two different signed-in people are independent", () => {
    expect(independenceFor({ checkerId: a, planterId: b, checkerIsStaff: false })).toBe("independent");
  });
  it("anything anonymous is unknown", () => {
    expect(independenceFor({ checkerId: null, planterId: b, checkerIsStaff: false })).toBe("unknown");
    expect(independenceFor({ checkerId: a, planterId: null, checkerIsStaff: false })).toBe("unknown");
  });
});

describe("survivalRate / coverage", () => {
  it("withholds the rate below the minimum sample", () => {
    expect(survivalRate({ checked_sites: MIN_SITES_FOR_RATE - 1, trees_checked: 100, trees_alive: 50 })).toBeNull();
  });
  it("computes trees alive over trees checked", () => {
    expect(survivalRate({ checked_sites: 12, trees_checked: 200, trees_alive: 86 })).toBeCloseTo(0.43);
  });
  it("coverage is checked over eligible, zero-safe", () => {
    expect(coverage({ eligible_sites: 40, checked_sites: 10 })).toBe(0.25);
    expect(coverage({ eligible_sites: 0, checked_sites: 0 })).toBe(0);
  });
});

describe("isMissingRelation (feature not live yet)", () => {
  it("recognises PostgREST and Postgres missing-table errors", () => {
    expect(isMissingRelation({ code: "PGRST205", message: "Could not find the table" })).toBe(true);
    expect(isMissingRelation({ code: "42P01", message: 'relation "x" does not exist' })).toBe(true);
    expect(isMissingRelation({ code: "23505", message: "duplicate key" })).toBe(false);
    expect(isMissingRelation(null)).toBe(false);
  });
});

describe("isDue", () => {
  it("only the three check windows count as due", () => {
    expect(isDue("due_3m") && isDue("due_12m") && isDue("due_36m")).toBe(true);
    expect(isDue("too_early") || isDue("up_to_date") || isDue(undefined)).toBe(false);
  });
});
