import { describe, expect, it } from "vitest";

import { localizeError } from "@/i18n";
import { errors as ar } from "@/i18n/dict/ar/errors";
import { errors as en } from "@/i18n/dict/en/errors";
import { errors as fr } from "@/i18n/dict/fr/errors";

describe("localizeError", () => {
  const [key, english] = Object.entries(en.mapServer)[0]!;

  it("maps a known server message into French for French users", () => {
    expect(localizeError(english, "fr")).toBe((fr.mapServer as Record<string, string>)[key]);
  });

  it("maps into Arabic for Arabic users", () => {
    expect(localizeError(english, "ar")).toBe((ar.mapServer as Record<string, string>)[key]);
  });

  it("leaves English and unknown messages unchanged", () => {
    expect(localizeError(english, "en")).toBe(english);
    expect(localizeError("something new", "fr")).toBe("something new");
  });

  it("localizes the generic toast", () => {
    expect(localizeError(en.toasts.generic, "fr")).toBe(fr.toasts.generic);
  });
});
