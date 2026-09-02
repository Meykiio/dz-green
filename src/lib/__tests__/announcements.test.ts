import { describe, expect, it } from "vitest";

import { localizedAnnouncement, type ActiveAnnouncement } from "@/lib/data";

const a: ActiveAnnouncement = {
  id: "x",
  title_ar: "عنوان عربي",
  body_ar: "نص عربي",
  title_en: "English title",
  body_en: "English body",
  title_fr: "Titre français",
  body_fr: "Texte français",
  kind: "info",
  color: "plant",
  speed_seconds: 32,
};

describe("localizedAnnouncement", () => {
  it("picks the Arabic fields in AR locale", () => {
    expect(localizedAnnouncement(a, "ar")).toEqual({ title: "عنوان عربي", body: "نص عربي" });
  });

  it("picks the English fields in EN locale", () => {
    expect(localizedAnnouncement(a, "en")).toEqual({ title: "English title", body: "English body" });
  });

  it("picks the French fields in FR locale", () => {
    expect(localizedAnnouncement(a, "fr")).toEqual({ title: "Titre français", body: "Texte français" });
  });
});
