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

function renderSuggest(onPick: (s: string) => void, currentSpecies = "") {
  return render(
    <I18nProvider>
      <SpeciesSuggest photo={PHOTO} currentSpecies={currentSpecies} onPick={onPick} />
    </I18nProvider>,
  );
}

describe("SpeciesSuggest", () => {
  it("auto-fills the top match into an EMPTY species field, chips stay as alternatives", async () => {
    let picked = "";
    renderSuggest((s) => (picked = s));
    expect(picked).toBe("");

    await userEvent.click(screen.getByRole("button", { name: /تعرّف على النوع/ }));
    await screen.findByRole("button", { name: "Pinus brutia" });
    expect(picked).toBe("Aleppo pine (Pinus halepensis)"); // top match applied

    // Tapping an alternative still works.
    await userEvent.click(screen.getByRole("button", { name: "Pinus brutia" }));
    expect(picked).toBe("Pinus brutia");
  });

  it("never overwrites a species the user already typed", async () => {
    let picked = "زيتون";
    renderSuggest((s) => (picked = s), "زيتون");
    await userEvent.click(screen.getByRole("button", { name: /تعرّف على النوع/ }));
    await screen.findByRole("button", { name: "Pinus brutia" });
    expect(picked).toBe("زيتون"); // untouched
  });

  it("lets the user go back and retry", async () => {
    renderSuggest(() => {});
    await userEvent.click(screen.getByRole("button", { name: /تعرّف على النوع/ }));
    await screen.findByRole("button", { name: "Pinus brutia" });
    await userEvent.click(screen.getByRole("button", { name: "أعد المحاولة" }));
    expect(screen.getByRole("button", { name: /تعرّف على النوع/ })).toBeVisible();
  });
});
