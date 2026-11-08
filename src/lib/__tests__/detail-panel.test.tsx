// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DetailPanel } from "@/components/map/DetailPanel";
import { I18nProvider } from "@/i18n";

vi.mock("@/lib/weather.functions", () => ({
  getFireWeather: vi.fn(async () => null),
  getAirQuality: vi.fn(async () => null),
}));

afterEach(cleanup);

function renderPanel(onClose: () => void) {
  const risk = { id: "5.1,36.6", lat: 36.6, lng: 5.1, risk: 0.95 };
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider>
        <DetailPanel feature={{ kind: "risk", risk }} careLogs={[]} onClose={onClose} />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("DetailPanel keyboard", () => {
  it("moves focus to the close button when opened", () => {
    renderPanel(() => {});
    const close = screen.getAllByRole("button").find((b) => b.getAttribute("aria-label"));
    expect(document.activeElement).toBe(close);
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    renderPanel(onClose);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the risk rank as a relative priority", () => {
    renderPanel(() => {});
    // Arabic is the default locale: "within the top 5% of mapped land".
    expect(screen.getByText(/ضمن أعلى 5%/)).toBeTruthy();
  });
});
