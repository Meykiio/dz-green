import { useMemo } from "react";
import { Leaf, TriangleAlert } from "lucide-react";

import { useI18n } from "@/i18n";
import { suggestForWilaya } from "@/lib/planting-guide";
import { wilayaName } from "@/lib/wilayas";

/**
 * "What to plant here" — curated species that fit the wilaya's climate, with
 * the ones GBIF recorded *inside that wilaya* first. Suggestion only (local
 * advice always wins); a tap fills the species field, never auto-asserts.
 */
export function PlantingGuide({
  wilaya,
  onPick,
}: {
  wilaya: string;
  onPick: (species: string) => void;
}) {
  const { t, locale } = useI18n();
  const suggestions = useMemo(() => (wilaya ? suggestForWilaya(wilaya) : []), [wilaya]);
  if (!wilaya || suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-plant/30 bg-plant/5 p-4">
      <p className="eyebrow flex items-center gap-1.5 text-plant">
        <Leaf className="size-3.5" />
        {t("forms.plant.guideTitle", { wilaya: wilayaName(wilaya) })}
      </p>
      <div className="mt-2.5 space-y-2">
        {suggestions.map(({ species, reason, count }) => (
          <div key={species.latin} className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPick(locale === "ar" ? `${species.ar} (${species.latin})` : `${species.en} (${species.latin})`)}
              className="tap-target rounded-full border border-plant/40 bg-plant/10 px-3 py-1.5 text-xs font-semibold text-plant transition-transform active:scale-[0.97]"
            >
              {locale === "ar" ? species.ar : species.en}
              <span className="font-normal italic"> · {species.latin}</span>
            </button>
            <span className="text-xs text-muted-foreground">
              {reason === "evidence"
                ? t("forms.plant.guideEvidence", { count: count ?? 0 })
                : t("forms.plant.guideFit")}
              {" — "}
              {locale === "ar" ? species.noteAr : species.noteEn}
            </span>
            {species.cautionAr && (
              <span className="inline-flex items-center gap-1 text-xs text-fire">
                <TriangleAlert className="size-3" />
                {locale === "ar" ? species.cautionAr : species.cautionEn}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">{t("forms.plant.guideNote")}</p>
    </div>
  );
}
