import { Loader2 } from "lucide-react";

import { useI18n } from "@/i18n";

/**
 * Legend for the fire-risk priority layer, shown whenever the layer is on
 * (UX rule from the fire-AI plan: no unexplained colours on the map). Also
 * carries the layer's loading and error states, since its data is fetched
 * on demand. Placement avoids the geolocate control: it sits bottom-end on
 * desktop (legend goes top-end) and top-end on phones (legend goes bottom).
 */
export function RiskLegend({ status }: { status: "pending" | "error" | "success" }) {
  const { t } = useI18n();
  return (
    <div
      className="absolute bottom-14 end-3 z-10 w-56 rounded-xl border border-border bg-card/95 p-3 text-xs shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] backdrop-blur md:bottom-auto md:top-4"
      aria-live="polite"
    >
      <p className="font-semibold">{t("home.riskLegend.title")}</p>
      {status === "pending" && (
        <p className="mt-2 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          {t("home.riskLegend.loading")}
        </p>
      )}
      {status === "error" && <p className="mt-2 text-destructive">{t("home.riskLegend.error")}</p>}
      {status === "success" && (
        <ul className="mt-2 space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-risk-high" aria-hidden="true" />
            {t("home.riskLegend.high")}
          </li>
          <li className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-full bg-risk-medium" aria-hidden="true" />
            {t("home.riskLegend.medium")}
          </li>
        </ul>
      )}
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{t("home.riskLegend.note")}</p>
    </div>
  );
}
