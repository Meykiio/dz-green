import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { PhotoThumb } from "@/components/PhotoThumb";
import { Button } from "@/components/ui/button";
import { localizeError, useI18n } from "@/i18n";
import { photoUrl } from "@/lib/data";
import { survivalReviewQuery } from "@/lib/survival-data";
import { reviewSurvivalCheck } from "@/lib/survival.functions";

/**
 * Survival checks waiting for review in the moderator's wilayas (RLS scopes
 * the rows; the server function re-checks the scope on every action).
 * Verify when the photo plausibly shows the planting; reject reused or
 * unrelated photos (rejecting deletes the photo object).
 */
export function SurvivalReview() {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const checks = useQuery(survivalReviewQuery);
  const review = useServerFn(reviewSurvivalCheck);
  const mutation = useMutation({
    mutationFn: (input: { id: string; grade: "verified" | "rejected" }) => review({ data: input }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["survival_checks"] }),
    onError: (e: Error) => toast.error(localizeError(e.message ?? "")),
  });

  if (checks.isPending) return <p className="text-muted-foreground">…</p>;
  if (checks.isError) return <p className="text-destructive">{t("moderation.triage.error")}</p>;
  if (checks.data === null) return <p className="text-muted-foreground">{t("survival.reviewNotLive")}</p>;
  if (checks.data.length === 0) return <p className="text-muted-foreground">{t("survival.reviewEmpty")}</p>;

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {checks.data.map((c) => (
        <li key={c.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
          <PhotoThumb
            src={photoUrl(c.photo_url)}
            alt={t(`survival.status.${c.status}`)}
            tone="plant"
            className="size-24 shrink-0 rounded-lg"
            iconClassName="size-6"
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">
              {t(`survival.status.${c.status}`)} ·{" "}
              {t("survival.aliveOf", { alive: c.trees_alive, checked: c.trees_checked })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(c.checked_date)} · {t(`survival.independence.${c.independence}`)}
              {c.submitter_name ? ` · ${c.submitter_name}` : ""}
            </p>
            {c.notes && <p className="mt-1 line-clamp-3 text-xs">{c.notes}</p>}
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ id: c.id, grade: "verified" })}
              >
                {t("survival.verify")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ id: c.id, grade: "rejected" })}
              >
                {t("survival.reject")}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
