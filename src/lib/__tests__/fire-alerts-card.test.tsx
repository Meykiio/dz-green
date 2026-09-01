// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach } from "vitest";

import { FireAlertsCard } from "@/components/fire/FireAlertsCard";
import { I18nProvider } from "@/i18n";

/** Behavior tests: the card's honesty states (no silent hiding). */

afterEach(cleanup);

function renderCard() {
  return render(
    <I18nProvider>
      <FireAlertsCard />
    </I18nProvider>,
  );
}

describe("FireAlertsCard", () => {
  it("explains itself when push is unavailable (insecure context) instead of vanishing", async () => {
    // happy-dom has no PushManager and no serviceWorker — the LAN-http case.
    renderCard();
    await waitFor(() => {
      expect(screen.getByText(/التنبيهات غير متوفرة هنا/)).toBeVisible();
    });
    // And crucially: no enable button is offered in this state.
    expect(screen.queryByRole("button", { name: /فعّل التنبيهات/ })).toBeNull();
  });
});
