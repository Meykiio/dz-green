import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";

import { useI18n } from "@/i18n";
import { suggestSpecies } from "@/lib/plantnet.functions";
import type { SpeciesSuggestion } from "@/lib/plantnet.server";

/**
 * PlantNet accepts JPEG/PNG only (verified live: WebP → 400 "Unsupported
 * file type"), while PhotoInput compresses to WebP by default — so the
 * identify call re-encodes to JPEG on a canvas first (no deps, no quality
 * concern at identification sizes).
 */
async function toJpegDataUrl(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith("data:image/jpeg")) return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * "Identify from the photo" — PlantNet suggestions as one-tap chips that fill
 * the species field. Suggestion only, never auto-assert. Quiet when the
 * service is down or unsure (the form never depends on it).
 */
export function SpeciesSuggest({
  photo,
  currentSpecies,
  onPick,
}: {
  photo: string;
  /** The species field's current value — auto-fill only happens when empty. */
  currentSpecies: string;
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
      const jpeg = await toJpegDataUrl(photo);
      const out = await suggestSpecies({ data: { image: jpeg, locale } });
      if (out && out.length > 0) {
        setSuggestions(out);
        // Auto-fill the top match (owner request) — only into an empty field,
        // never over something the user typed. Chips stay as alternatives.
        if (!currentSpecies.trim() && out[0]) onPick(out[0].label);
      } else {
        setFailed(true);
      }
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
