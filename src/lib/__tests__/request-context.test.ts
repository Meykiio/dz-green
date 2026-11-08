import { AsyncLocalStorage } from "node:async_hooks";
import { afterEach, describe, expect, it } from "vitest";

import { requestStore, type RequestStore } from "@/lib/request-context";

describe("per-request SSR store", () => {
  const g = globalThis as { __GA_REQUEST_STORE__?: AsyncLocalStorage<RequestStore> };
  afterEach(() => {
    delete g.__GA_REQUEST_STORE__;
  });

  it("is undefined outside a request", () => {
    expect(requestStore()).toBeUndefined();
  });

  it("keeps concurrent requests apart", async () => {
    const storage = new AsyncLocalStorage<RequestStore>();
    g.__GA_REQUEST_STORE__ = storage;
    const render = (locale: string, delayMs: number) =>
      storage.run({ locale, geo: null }, async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        return requestStore()?.locale;
      });
    // The slow Arabic request starts first and finishes last: with a plain
    // global it would read "fr" (set by the later request).
    const [a, f] = await Promise.all([render("ar", 30), render("fr", 5)]);
    expect(a).toBe("ar");
    expect(f).toBe("fr");
  });
});
