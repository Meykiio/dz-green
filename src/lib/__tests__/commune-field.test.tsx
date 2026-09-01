// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";

import { useState } from "react";

import { CommuneField } from "@/components/CommuneField";
import { I18nProvider } from "@/i18n";

/**
 * Behavior tests (the pyramid's missing middle, 2026-09-01): user-visible
 * behavior, not internals. This is the component whose "Other" escape hatch
 * broke silently and was only caught by a browser probe — now a regression
 * test instead.
 */

afterEach(cleanup);

function renderField(props: { wilaya?: string; value?: string; onChange?: (v: string) => void }) {
  const onChange = props.onChange ?? (() => {});
  return render(
    <I18nProvider>
      <CommuneField wilaya={props.wilaya ?? ""} value={props.value ?? ""} onChange={onChange} />
    </I18nProvider>,
  );
}

describe("CommuneField", () => {
  it("is disabled until a wilaya is chosen", () => {
    renderField({ wilaya: "" });
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("lists the wilaya's communes with Arabic labels and Latin values", () => {
    renderField({ wilaya: "16" });
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select).toBeEnabled();
    // Algiers has 57 communes + placeholder + "other".
    expect(select.options.length).toBe(59);
    const kouba = [...select.options].find((o) => o.value === "Kouba");
    expect(kouba?.textContent).toBe("القبة");
  });

  it("stores the canonical Latin name when a commune is picked", async () => {
    let stored = "";
    renderField({ wilaya: "16", onChange: (v) => (stored = v) });
    await userEvent.selectOptions(screen.getByRole("combobox"), "Kouba");
    expect(stored).toBe("Kouba");
  });

  it("the Other escape hatch opens a free-text input from the empty state (the probe-caught bug)", async () => {
    // A stateful harness, like the real parent (controlled input loop).
    let stored = "";
    function Harness() {
      const [value, setValue] = useState("");
      return (
        <I18nProvider>
          <CommuneField wilaya="16" value={value} onChange={(v) => { stored = v; setValue(v); }} />
        </I18nProvider>
      );
    }
    render(<Harness />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    await userEvent.selectOptions(select, "__other__");
    // The select must STAY on "other" (it used to snap back to placeholder).
    expect(select.value).toBe("__other__");
    const input = screen.getByPlaceholderText("اكتب اسم البلدية");
    expect(input).toBeVisible();
    await userEvent.type(input, "حسين داي");
    expect(stored).toBe("حسين داي");
  });

  it("shows an existing non-list value as Other with the text preserved", () => {
    renderField({ wilaya: "16", value: "Some custom place" });
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("__other__");
    expect(screen.getByDisplayValue("Some custom place")).toBeVisible();
  });
});
