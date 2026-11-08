import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useEffect, useMemo } from "react";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { WilayaRestorePanel } from "@/components/restore/WilayaRestorePanel";
import { WilayaTable } from "@/components/restore/WilayaTable";
import { Button } from "@/components/ui/button";
import { ssrT, useI18n } from "@/i18n";
import { sitesQuery, wilayaRiskQuery } from "@/lib/data";
import { buildRestoreRows, type RestoreSort } from "@/lib/restore";
import { wilayaCodeOf, wilayaNumParam } from "@/lib/wilayas";
import { PlantingSeasonNote } from "@/components/PlantingSeasonNote";

// Sort and selection live in the URL so a link to "Bejaia, by fire risk"
// can be shared (and survives a reload).
const searchSchema = z.object({
  sort: z.enum(["burned", "risk", "trees"]).optional().catch(undefined),
  w: wilayaNumParam.optional().catch(undefined),
});

export const Route = createFileRoute("/restore")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: ssrT("meta.restoreTitle") },
      { name: "description", content: ssrT("meta.restoreDesc") },
      { property: "og:title", content: ssrT("meta.restoreTitle") },
      { property: "og:description", content: ssrT("meta.restoreDesc") },
    ],
  }),
  component: RestorePage,
});

const SORTS: RestoreSort[] = ["burned", "risk", "trees"];
const SORT_LABEL = { burned: "restore.sortBurned", risk: "restore.sortRisk", trees: "restore.sortTrees" };

function RestorePage() {
  const { t } = useI18n();
  const { sort = "burned", w: wNum } = Route.useSearch();
  const w = wNum == null ? undefined : wilayaCodeOf(wNum);
  const navigate = useNavigate({ from: "/restore" });
  const risk = useQuery(wilayaRiskQuery);
  const sites = useQuery(sitesQuery);

  const rows = useMemo(
    () => (risk.data ? buildRestoreRows(risk.data, sites.data ?? [], sort) : []),
    [risk.data, sites.data, sort],
  );
  const selected = rows.find((r) => r.code === w);

  // Bring the panel into view on phones when a wilaya is picked.
  useEffect(() => {
    if (!w || window.matchMedia("(min-width: 1024px)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("restore-panel-title")?.scrollIntoView({
      block: "start",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [w]);
  const setSearch = (next: { sort?: RestoreSort; w?: number | undefined }) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true, resetScroll: false });

  return (
    <AppShell>
      <article className="mx-auto w-full max-w-4xl px-4 py-10">
        <p className="eyebrow">{t("restore.eyebrow")}</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">{t("restore.hero")}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t("restore.lead")}</p>

        <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label={t("restore.sortLabel")}>
          <span className="text-sm text-muted-foreground">{t("restore.sortLabel")}</span>
          {SORTS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === sort ? "default" : "outline"}
              aria-pressed={s === sort}
              onClick={() => setSearch({ sort: s })}
            >
              {t(SORT_LABEL[s])}
            </Button>
          ))}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div>
            {risk.isPending && <p className="py-10 text-center text-muted-foreground">{t("restore.loading")}</p>}
            {risk.isError && (
              <div className="rounded-2xl border border-border bg-card p-5" role="alert">
                <p className="font-medium">{t("restore.error")}</p>
                <Button variant="outline" className="mt-3" onClick={() => void risk.refetch()}>
                  {t("restore.retry")}
                </Button>
              </div>
            )}
            {risk.data && (
              <WilayaTable rows={rows} selected={w} onSelect={(code) => setSearch({ w: Number(code) })} />
            )}
          </div>

          {/* On phones the panel moves above the 49-row list when a wilaya is
              picked (otherwise it would open far below the tap). */}
          <div className={`space-y-6 lg:sticky lg:top-20 ${selected ? "order-first lg:order-none" : ""}`}>
            {selected ? (
              <WilayaRestorePanel row={selected} onClose={() => setSearch({ w: undefined })} />
            ) : (
              risk.data && (
                <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  {t("restore.pick")}
                </p>
              )
            )}
            <Advice />
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">{t("restore.method")}</p>
      </article>
    </AppShell>
  );
}

function Advice() {
  const { t } = useI18n();
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Leaf className="size-4 text-plant" />
        {t("restore.adviceTitle")}
      </h2>
      <PlantingSeasonNote className="mt-3" />
      <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm text-muted-foreground">
        <li>{t("restore.advice1")}</li>
        <li>{t("restore.advice2")}</li>
        <li>{t("restore.advice3")}</li>
        <li>{t("restore.advice4")}</li>
      </ul>
    </section>
  );
}
