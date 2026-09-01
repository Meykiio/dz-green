import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";

import { useI18n } from "@/i18n";
import { suggestSpecies } from "@/lib/plantnet.functions";
import type { SpeciesSuggestion } from "@/lib/plantnet.server";

/**
 * "Identify from the photo" — PlantNet suggestions as one-tap chips that fill
 * the species field. Suggestion only, never auto-assert. Quiet when the
 * service is down or unsure (the form never depends on it).
 */
export function SpeciesSuggest({
  photo,
  onPick,
}: {
  photo: string;
  onPick: (species: string) => void;
}) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<SpeciesSuggestion[] | null>(null);
  const [failed, setFailed] = useState(false);

  const identify = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const out = await suggestSpecies({ data: { image: photo, locale } });
      if (out && out.length > 0) setSuggestions(out);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
    setBusy(false);
  };

  return (
    <div className="mt-2">
      {suggestions === null ? (
        <button
          type="button"
          onClick={identify}
          disabled={busy}
          className="tap-target inline-flex items-center gap-1.5 rounded-full border border-plant/40 bg-plant/10 px-3 py-1.5 text-xs font-semibold text-plant transition-transform active:scale-[0.97] disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Leaf className="size-3.5" />}
          {busy ? t("forms.plant.identifying") : t("forms.plant.identify")}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t("forms.plant.isIt")}</span>
          {suggestions.map((s) => (
            <button
              key={s.scientific}
              type="button"
              onClick={() => onPick(s.label)}
              className="tap-target rounded-full border border-plant/40 bg-plant/10 px-3 py-1.5 text-xs font-semibold text-plant transition-transform active:scale-[0.97]"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSuggestions(null)}
            className="text-xs text-muted-foreground underline"
          >
            {t("forms.plant.identifyRetry")}
          </button>
        </div>
      )}
      {failed && (
        <p className="mt-1 text-xs text-muted-foreground">{t("forms.plant.identifyFailed")}</p>
      )}
    </div>
  );
}
