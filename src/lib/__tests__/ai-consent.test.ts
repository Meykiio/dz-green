import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAiConsent, setAiConsent, shouldShowConsent } from "@/lib/ai-consent";

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  });
  return store;
}

describe("ai-consent", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    stubLocalStorage();
  });

  it("shows the banner when no choice is stored", () => {
    expect(getAiConsent()).toBeNull();
    expect(shouldShowConsent()).toBe(true);
  });

  it("hides after accept and persists the choice", () => {
    setAiConsent("accepted");
    expect(getAiConsent()).toBe("accepted");
    expect(shouldShowConsent()).toBe(false);
  });

  it("hides after decline and persists the choice", () => {
    setAiConsent("declined");
    expect(getAiConsent()).toBe("declined");
    expect(shouldShowConsent()).toBe(false);
  });

  it("ignores corrupt stored values", () => {
    window.localStorage.setItem("ga-ai-consent", "garbage");
    expect(getAiConsent()).toBeNull();
    expect(shouldShowConsent()).toBe(true);
  });
});
