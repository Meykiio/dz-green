import { Link } from "@tanstack/react-router";
import { Droplets, Sprout, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { suggestForFireExposed, suggestForWilaya } from "@/lib/planting-guide";
import { formatKm2, type RestoreRow } from "@/lib/restore";
import { wilayaName } from "@/lib/wilayas";
import { SurvivalStats } from "@/components/survival/SurvivalStats";

/** One wilaya's restoration picture: figures, species that suit it, and the
 *  two actions that matter (plant here, look after what is planted). */
export function WilayaRestorePanel({ row, onClose }: { row: RestoreRow; onClose: () => void }) {
  const { t, locale } = useI18n();
  const n = (v: number) => formatKm2(v, locale);
  // Wilayas with notable fire risk get fire-aware suggestions (no pines or
  // eucalyptus); elsewhere the regular climate + evidence guide.
  const fireExposed = row.highShare >= 0.05 || row.burnedKm2 >= 100;
  const suggestions = fireExposed ? suggestForFireExposed(row.code) : suggestForWilaya(row.code);

  return (
    <section
      aria-labelledby="restore-panel-title"
      className="rounded-2xl border border-border bg-card p-5 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="restore-panel-title" className="text-xl font-semibold tracking-tight">
          {t("restore.detailTitle", { wilaya: wilayaName(row.code) })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("restore.close")}
          className="tap-target -me-2 -mt-2 grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <li>{t("restore.detailBurned", { n: n(row.burnedKm2) })}</li>
        <li>
          {t("restore.detailRisk", { n: n(row.highKm2), share: Math.round(row.highShare * 100) })}
        </li>
        <li>{t("restore.detailTrees", { n: n(row.trees) })}</li>
      </ul>

      <SurvivalStats wilayaCode={row.code} />

      <h3 className="mt-5 text-sm font-semibold">{t("restore.speciesTitle")}</h3>
      {suggestions.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("restore.noSpecies")}</p>
      ) : (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {suggestions.map(({ species, reason }) => (
            <li key={species.latin} className="rounded-xl border border-border px-3 py-2">
              <p className="font-medium">{locale === "ar" ? species.ar : species.en}</p>
              <p className="text-xs italic text-muted-foreground">{species.latin}</p>
              <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-plant">
                <span>{reason === "evidence" ? t("restore.speciesEvidence") : t("restore.speciesFit")}</span>
                {species.fire === "resilient" && (
                  <span className="font-medium text-care">· {t("restore.fireResilient")}</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
      {fireExposed && suggestions.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{t("restore.fireExposedNote")}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/plant" search={{ wilaya: Number(row.code) }}>
            <Sprout className="size-4" />
            {t("restore.plantHere")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/care">
            <Droplets className="size-4" />
            {t("restore.careCta")}
          </Link>
        </Button>
      </div>
    </section>
  );
}
