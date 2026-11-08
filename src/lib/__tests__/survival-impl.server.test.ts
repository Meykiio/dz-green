import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Survival check server paths, with Supabase faked per table:
 * not-live (missing table), duplicate photo, idempotent replay,
 * independence decided server-side, wilaya scope on review.
 */
type Result = { data?: unknown; error?: unknown };
const m = vi.hoisted(() => ({
  results: {} as Record<string, Result>,
  inserted: [] as Record<string, unknown>[],
  removed: [] as string[],
  userId: null as string | null,
}));

function builder(table: string) {
  const key = (op: string) => `${table}.${op}`;
  const resolve = (op: string) => Promise.resolve(m.results[key(op)] ?? { data: null, error: null });
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  Object.assign(chain, {
    select: self, eq: self, order: self,
    limit: () => Object.assign(resolve("list"), chain),
    maybeSingle: () => resolve("one"),
    single: () => resolve("insert"),
    insert: (row: Record<string, unknown>) => {
      m.inserted.push(row);
      return chain;
    },
    update: () => ({ eq: () => resolve("update") }),
  });
  return chain;
}

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (t: string) => builder(t),
    storage: { from: () => ({ remove: async (p: string[]) => void m.removed.push(...p) }) },
  },
}));
vi.mock("@/lib/submissions.server", () => {
  class GateError extends Error {}
  return {
    GateError,
    verifyGate: async () => "ok",
    optionalUserId: async () => m.userId,
    storePhoto: async () => "survival/photo.jpg",
  };
});
vi.mock("@/lib/staff.server", () => ({
  requireStaff: async () => ({ userId: "mod", isAdmin: false, wilayas: ["06"] }),
  assertScope: (staff: { wilayas: string[] }, w: string) => {
    if (!staff.wilayas.includes(w)) throw new Error("This submission is outside your assigned wilayas.");
  },
}));

const { submitSurvivalCheckImpl, reviewSurvivalCheckImpl } = await import("@/lib/survival-impl.server");

const PHOTO = `data:image/jpeg;base64,${btoa("fake-jpeg-bytes")}`;
const input = {
  site_id: "11111111-1111-4111-8111-111111111111",
  status: "alive" as const,
  trees_checked: 10,
  trees_alive: 8,
  photo: PHOTO,
  checked_date: "2026-11-01",
  client_request_id: "22222222-2222-4222-8222-222222222222",
};

beforeEach(() => {
  m.results = {
    "sites.one": { data: { id: input.site_id, status: "approved", user_id: "planter", tree_count: 10 } },
    "survival_checks.list": { data: [] },
    "survival_checks.insert": { data: { id: "new-check" } },
    "user_roles.list": { data: [] },
  };
  m.inserted = [];
  m.removed = [];
  m.userId = null;
});

describe("submitSurvivalCheckImpl", () => {
  it("says 'not live yet' when the migration is not applied", async () => {
    m.results["survival_checks.one"] = { error: { code: "PGRST205", message: "Could not find the table" } };
    await expect(submitSurvivalCheckImpl(input)).rejects.toThrow(/not live yet/);
  });

  it("returns the first result for a replayed request (no duplicate row)", async () => {
    m.results["survival_checks.one"] = { data: { id: "earlier-check" } };
    await expect(submitSurvivalCheckImpl(input)).resolves.toEqual({ id: "earlier-check", status: "published" });
    expect(m.inserted).toHaveLength(0);
  });

  it("rejects a photo already used for another check", async () => {
    m.results["survival_checks.list"] = { data: [{ id: "other" }] };
    await expect(submitSurvivalCheckImpl(input)).rejects.toThrow(/already used/);
    expect(m.inserted).toHaveLength(0);
  });

  it("refuses checks on plantings that are not approved", async () => {
    m.results["sites.one"] = { data: { id: input.site_id, status: "pending", user_id: null } };
    await expect(submitSurvivalCheckImpl(input)).rejects.toThrow(/not available/);
  });

  it("decides independence on the server: different signed-in person is independent", async () => {
    m.userId = "someone-else";
    await submitSurvivalCheckImpl(input);
    expect(m.inserted[0]).toMatchObject({ independence: "independent", user_id: "someone-else" });
  });

  it("marks the planter's own check as self and anonymous checks as unknown", async () => {
    m.userId = "planter";
    await submitSurvivalCheckImpl(input);
    m.userId = null;
    await submitSurvivalCheckImpl({ ...input, client_request_id: null });
    expect(m.inserted.map((r) => r["independence"])).toEqual(["self", "unknown"]);
  });

  it("refuses more alive than checked", async () => {
    await expect(submitSurvivalCheckImpl({ ...input, trees_alive: 11 })).rejects.toThrow(/more than/);
  });
});

describe("reviewSurvivalCheckImpl", () => {
  it("rejecting a check in the moderator's wilaya deletes its photo", async () => {
    m.results["survival_checks.one"] = { data: { id: "c1", photo_url: "survival/p.jpg", site_id: input.site_id } };
    m.results["sites.one"] = { data: { wilaya_code: "06" } };
    await expect(reviewSurvivalCheckImpl({ id: "c1", grade: "rejected" })).resolves.toEqual({ ok: true });
    expect(m.removed).toEqual(["survival/p.jpg"]);
  });

  it("refuses a check outside the moderator's wilayas", async () => {
    m.results["survival_checks.one"] = { data: { id: "c1", photo_url: "survival/p.jpg", site_id: input.site_id } };
    m.results["sites.one"] = { data: { wilaya_code: "15" } };
    await expect(reviewSurvivalCheckImpl({ id: "c1", grade: "verified" })).rejects.toThrow(/outside your assigned/);
    expect(m.removed).toHaveLength(0);
  });
});
