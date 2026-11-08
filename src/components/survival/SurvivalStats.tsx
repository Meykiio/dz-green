import { useQuery } from "@tanstack/react-query";

import { useI18n } from "@/i18n";
import { coverage, MIN_SITES_FOR_RATE, survivalRate } from "@/lib/survival";
import { survivalStatsQuery } from "@/lib/survival-data";

/**
 * One wilaya's survival at 12 months, always with its sample, coverage and
 * method. Publishes no rate below MIN_SITES_FOR_RATE independently checked
 * plantings. Renders nothing until the survival feature is live.
 */
export function SurvivalStats({ wilayaCode }: { wilayaCode: string }) {
  const { t } = useI18n();
  const stats = useQuery(survivalStatsQuery);
  if (!stats.data) return null; // pending, error, or not live yet

  const row = stats.data.find((s) => s.wilaya_code === wilayaCode) ?? {
    wilaya_code: wilayaCode,
    eligible_sites: 0,
    checked_sites: 0,
    trees_checked: 0,
    trees_alive: 0,
  };
  const rate = survivalRate(row);

  return (
    <div className="mt-4 rounded-xl border border-border px-3 py-2.5">
      <h3 className="text-sm font-semibold">{t("survival.rateTitle")}</h3>
      {rate === null ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("survival.notEnough", { checked: row.checked_sites, min: MIN_SITES_FOR_RATE })}
        </p>
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular-nums text-plant">
          {t("survival.rate", { pct: Math.round(rate * 100) })}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {t("survival.sample", { checked: row.checked_sites, eligible: row.eligible_sites })}
        {row.eligible_sites > 0 ? ` (${Math.round(coverage(row) * 100)}%)` : ""}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{t("survival.method")}</p>
    </div>
  );
}
