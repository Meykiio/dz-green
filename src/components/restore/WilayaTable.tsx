import { ChevronLeft, ChevronRight } from "lucide-react";

import { useI18n } from "@/i18n";
import { formatKm2, type RestoreRow } from "@/lib/restore";
import { wilayaName } from "@/lib/wilayas";

/**
 * The ranked wilaya list. One row per wilaya, three figures, a bar showing
 * fire-touched land relative to the worst-hit wilaya. Rows are buttons
 * (keyboard + screen-reader friendly); the selected one is marked.
 */
export function WilayaTable({
  rows,
  selected,
  onSelect,
}: {
  rows: RestoreRow[];
  selected: string | undefined;
  onSelect: (code: string) => void;
}) {
  const { t, locale, isRtl } = useI18n();
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const maxBurned = Math.max(1, ...rows.map((r) => r.burnedKm2));
  const km2 = (n: number) => t("restore.km2", { n: formatKm2(n, locale) });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden grid-cols-[2.5rem_1fr_9rem_8rem_7rem_1.25rem] gap-3 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
        <span>#</span>
        <span>{t("restore.colWilaya")}</span>
        <span>{t("restore.colBurned")}</span>
        <span>{t("restore.colRisk")}</span>
        <span>{t("restore.colTrees")}</span>
        <span />
      </div>
      <ol>
        {rows.map((r, i) => {
          const active = r.code === selected;
          return (
            <li key={r.code} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(r.code)}
                aria-current={active ? "true" : undefined}
                className={`grid w-full grid-cols-[2rem_1fr_1.25rem] items-center gap-x-3 gap-y-1 px-4 py-3 text-start transition-colors hover:bg-muted/60 md:grid-cols-[2.5rem_1fr_9rem_8rem_7rem_1.25rem] ${active ? "bg-primary/10" : ""}`}
              >
                <span className="text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {r.code} · {wilayaName(r.code)}
                  </span>
                  <span className="mt-1 block h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-fire"
                      style={{ width: `${Math.round((r.burnedKm2 / maxBurned) * 100)}%` }}
                    />
                  </span>
                </span>
                <Chevron className="size-4 text-muted-foreground md:order-last" aria-hidden="true" />
                <span className="col-span-3 flex flex-wrap gap-x-4 gap-y-0.5 ps-11 text-xs text-muted-foreground md:col-span-1 md:block md:ps-0 md:text-sm md:text-foreground">
                  <span className="md:hidden">{t("restore.colBurned")}: </span>
                  {km2(r.burnedKm2)}
                </span>
                <span className="col-span-3 ps-11 text-xs text-muted-foreground md:col-span-1 md:ps-0 md:text-sm md:text-foreground">
                  <span className="md:hidden">{t("restore.colRisk")}: </span>
                  {km2(r.highKm2)}
                </span>
                <span className="col-span-3 ps-11 text-xs text-muted-foreground md:col-span-1 md:ps-0 md:text-sm md:text-foreground">
                  <span className="md:hidden">{t("restore.colTrees")}: </span>
                  {formatKm2(r.trees, locale)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
