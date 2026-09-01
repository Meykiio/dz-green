// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";

import { SpeciesSuggest } from "@/components/SpeciesSuggest";
import { I18nProvider } from "@/i18n";

/** Behavior tests: suggestion chips fill the species field — never auto-assert. */

vi.mock("@/lib/plantnet.functions", () => ({
  suggestSpecies: vi.fn(async () => [
    { label: "Aleppo pine (Pinus halepensis)", scientific: "Pinus halepensis", score: 0.62 },
    { label: "Pinus brutia", scientific: "Pinus brutia", score: 0.21 },
  ]),
}));

afterEach(cleanup);

const PHOTO = "data:image/jpeg;base64,AAAA";

function renderSuggest(onPick: (s: string) => void) {
  return render(
    <I18nProvider>
      <SpeciesSuggest photo={PHOTO} onPick={onPick} />
    </I18nProvider>,
  );
}

describe("SpeciesSuggest", () => {
  it("offers chips after identify and fills the species only when the user picks one", async () => {
    let picked = "";
    renderSuggest((s) => (picked = s));
    expect(picked).toBe("");

    await userEvent.click(screen.getByRole("button", { name: /تعرّف على النوع/ }));
    const chip = await screen.findByRole("button", { name: "Aleppo pine (Pinus halepensis)" });
    expect(picked).toBe(""); // still nothing — suggestion, never auto-assert

    await userEvent.click(chip);
    expect(picked).toBe("Aleppo pine (Pinus halepensis)");
  });

  it("lets the user go back and retry", async () => {
    renderSuggest(() => {});
    await userEvent.click(screen.getByRole("button", { name: /تعرّف على النوع/ }));
    await screen.findByRole("button", { name: "Pinus brutia" });
    await userEvent.click(screen.getByRole("button", { name: "أعد المحاولة" }));
    expect(screen.getByRole("button", { name: /تعرّف على النوع/ })).toBeVisible();
  });
});
