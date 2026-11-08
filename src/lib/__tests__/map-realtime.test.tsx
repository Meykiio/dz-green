// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { I18nProvider } from "@/i18n";
import { isDataLight } from "@/hooks/useConnection";

const channel = { on: vi.fn(), subscribe: vi.fn() };
channel.on.mockReturnValue(channel);
channel.subscribe.mockReturnValue(channel);
const supabaseMock = { channel: vi.fn(() => channel), removeChannel: vi.fn(async () => "ok") };
vi.mock("@/integrations/supabase/client", () => ({ supabase: supabaseMock }));

const { useMapRealtime } = await import("@/components/home/useMapRealtime");

afterEach(cleanup);

describe("useMapRealtime connection budget", () => {
  let client: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <I18nProvider>{children}</I18nProvider>
    </QueryClientProvider>
  );
  beforeEach(() => {
    client = new QueryClient();
    vi.clearAllMocks();
  });

  it("opens one channel when enabled and does not refetch on first load", () => {
    const spy = vi.spyOn(client, "invalidateQueries");
    renderHook(() => useMapRealtime({ current: [] }, () => {}, true), { wrapper });
    expect(supabaseMock.channel).toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it("never opens a channel while disabled (hidden tab or data saver)", () => {
    renderHook(() => useMapRealtime({ current: [] }, () => {}, false), { wrapper });
    expect(supabaseMock.channel).not.toHaveBeenCalled();
  });

  it("closes on hide, reopens on show, and catches up once", () => {
    const spy = vi.spyOn(client, "invalidateQueries");
    const { rerender } = renderHook(({ on }) => useMapRealtime({ current: [] }, () => {}, on), {
      wrapper,
      initialProps: { on: true },
    });
    rerender({ on: false });
    expect(supabaseMock.removeChannel).toHaveBeenCalledTimes(1);
    rerender({ on: true });
    expect(supabaseMock.channel).toHaveBeenCalledTimes(2);
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey[0]);
    expect(keys.sort()).toEqual(["care_logs", "fire_reports", "sites"]);
  });
});

describe("isDataLight", () => {
  it("is on for Data Saver and 2G-class links only", () => {
    const c = (o: object) => Object.assign(new EventTarget(), o);
    expect(isDataLight(c({ saveData: true, effectiveType: "4g" }))).toBe(true);
    expect(isDataLight(c({ effectiveType: "2g" }))).toBe(true);
    expect(isDataLight(c({ effectiveType: "slow-2g" }))).toBe(true);
    expect(isDataLight(c({ effectiveType: "3g" }))).toBe(false);
    expect(isDataLight(undefined)).toBe(false);
  });
});
