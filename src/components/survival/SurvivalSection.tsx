import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { isDue } from "@/lib/survival";
import { siteChecksQuery, siteSurvivalStatusQuery } from "@/lib/survival-data";

/**
 * Survival timeline for one planting in the map detail panel: next check
 * due, the latest checks (who checked, how many alive, review state), and
 * the "Check this planting" action. Renders nothing until the survival
 * migration is live, so the panel looks exactly as before until then.
 */
export function SurvivalSection({ siteId }: { siteId: string }) {
  const { t, formatDate } = useI18n();
  const checks = useQuery(siteChecksQuery(siteId));
  const statuses = useQuery(siteSurvivalStatusQuery);

  if (checks.data === null || statuses.data === null) return null; // not live yet
  if (checks.isPending) return null;

  const due = statuses.data?.find((s) => s.site_id === siteId)?.due;
  const list = (checks.data ?? []).slice(0, 5);

  return (
    <section className="rounded-lg border border-border bg-card px-3 py-2.5" aria-labelledby="survival-title">
      <h3 id="survival-title" className="eyebrow flex items-center gap-1.5">
        <ClipboardCheck className="size-3.5" />
        {t("survival.panelTitle")}
      </h3>
      {due && (
        <p className={`mt-1 text-sm ${isDue(due) ? "font-medium text-fire" : "text-muted-foreground"}`}>
          {t(`survival.due.${due}`)}
        </p>
      )}
      {list.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">{t("survival.noChecks")}</p>
      ) : (
        <ol className="mt-2 space-y-2">
          {list.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{t(`survival.status.${c.status}`)}</span>
              {" · "}
              {t("survival.aliveOf", { alive: c.trees_alive, checked: c.trees_checked })}
              <span className="block text-xs text-muted-foreground">
                {formatDate(c.checked_date)} · {t(`survival.independence.${c.independence}`)} ·{" "}
                {t(`survival.grade.${c.grade}`)}
              </span>
            </li>
          ))}
        </ol>
      )}
      <Button asChild size="sm" variant="outline" className="mt-2.5 w-full">
        <Link to="/check" search={{ site: siteId }}>
          {t("survival.checkCta")}
        </Link>
      </Button>
    </section>
  );
}
