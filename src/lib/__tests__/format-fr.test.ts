import { describe, expect, it } from "vitest";

import { count } from "@/i18n/format";

describe("count() French rules (CLDR: 0-1 singular, 2+ plural)", () => {
  it("0 and 1 are singular", () => {
    expect(count(0, "tree", "fr")).toBe("0 arbre");
    expect(count(1, "tree", "fr")).toBe("1 arbre");
  });

  it("2+ is plural", () => {
    expect(count(2, "tree", "fr")).toBe("2 arbres");
    expect(count(11, "tree", "fr")).toBe("11 arbres");
  });

  it("handles every kind", () => {
    expect(count(1, "fire", "fr")).toBe("1 feu");
    expect(count(3, "wilaya", "fr")).toBe("3 wilayas");
    expect(count(1, "activeFire", "fr")).toBe("1 feu actif");
    expect(count(5, "treeNeed", "fr")).toBe("5 arbres ont besoin d'eau");
  });
});

describe("timeAgo (fire item age)", () => {
  const now = Date.UTC(2026, 10, 8, 12, 0, 0);
  it("uses minutes, then hours, then days", async () => {
    const { timeAgo } = await import("@/i18n/format");
    expect(timeAgo(new Date(now - 5 * 60_000), "en", now)).toBe("5 minutes ago");
    expect(timeAgo(new Date(now - 3 * 3600_000), "en", now)).toBe("3 hours ago");
    expect(timeAgo(new Date(now - 4 * 86400_000), "en", now)).toBe("4 days ago");
  });
  it("speaks French and Arabic", async () => {
    const { timeAgo } = await import("@/i18n/format");
    expect(timeAgo(new Date(now - 3 * 3600_000), "fr", now)).toBe("il y a 3 heures");
    expect(timeAgo(new Date(now - 3 * 3600_000), "ar", now)).toMatch(/قبل/);
  });
});
