import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { adminDeleteFeedback, adminListFeedback, type AdminFeedback } from "@/lib/admin.functions";

const KIND_META = {
  bug: { classes: "bg-fire/15 text-fire" },
  idea: { classes: "bg-care/15 text-care" },
  other: { classes: "bg-muted text-muted-foreground" },
} as const;

const PAGE = 25;

/** Read-only visitor feedback list, paged (show more). */
export function FeedbackPanel() {
  const { t, formatDateShort } = useI18n();
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminFeedback[] | null>(null);
  const listFeedback = useServerFn(adminListFeedback);
  const queryClient = useQueryClient();

  const del = useMutation({
    mutationFn: adminDeleteFeedback,
    onSuccess: () => {
      toast.success(t("moderation.adm.deleteToast"));
      setConfirming(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const [confirming, setConfirming] = useState<string | null>(null);

  const feedback = useQuery({
    queryKey: ["admin", "feedback", offset],
    queryFn: async () => {
      const page = await listFeedback({ data: { offset, limit: PAGE } });
      setRows((prev) => (offset === 0 ? page : [...(prev ?? []), ...page]));
      return page;
    },
  });

  if (feedback.isLoading && offset === 0) {
    return <p className="mt-6 text-muted-foreground">{t("moderation.fb.loading")}</p>;
  }
  if (feedback.isError && offset === 0) {
    return (
      <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        {t("moderation.fb.error")}
      </p>
    );
  }
  const list = rows ?? [];
  if (list.length === 0) {
    return <p className="mt-6 text-muted-foreground">{t("moderation.fb.empty")}</p>;
  }
  const hasMore = (feedback.data?.length ?? 0) >= PAGE;

  return (
    <div className="mt-6 space-y-3">
      {list.map((f) => (
        <div key={f.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-wrap text-sm">{f.message}</p>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${KIND_META[f.kind].classes}`}
              >
                {t(`moderation.fb.kind.${f.kind}`)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className={confirming === f.id ? "text-fire" : ""}
                onClick={() => {
                  if (confirming === f.id) {
                    del.mutate({ data: { id: f.id } });
                  } else {
                    setConfirming(f.id);
                    setTimeout(() => setConfirming((c) => (c === f.id ? null : c)), 4000);
                  }
                }}
                disabled={del.isPending}
                aria-label={t("moderation.adm.deleteUser")}
              >
                <Trash2 className="size-4" />
                {confirming === f.id ? t("moderation.adm.confirmDelete") : ""}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDateShort(f.created_at)}
            {f.page ? t("moderation.fb.from", { page: f.page }) : ""}
          </p>
          {f.device ? (
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground/70" title={f.device}>
              {f.device}
            </p>
          ) : null}
        </div>
      ))}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setOffset((o) => o + PAGE)} disabled={feedback.isFetching}>
            {t("moderation.adm.more")}
          </Button>
        </div>
      )}
    </div>
  );
}
