import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { adminListVolunteers, adminSetVolunteerStatus, type AdminVolunteer } from "@/lib/admin.functions";
import { wilayaName } from "@/lib/wilayas";

const STATUS_META = {
  new: { classes: "bg-plant/15 text-plant" },
  contacted: { classes: "bg-care/15 text-care" },
  onboarded: { classes: "bg-muted text-muted-foreground" },
} as const;

const PAGE = 25;

/** Volunteer applications (admin page): PII is service-role only, read here. */
export function VolunteerPanel() {
  const { t, formatDateShort } = useI18n();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminVolunteer[] | null>(null);
  const listVolunteers = useServerFn(adminListVolunteers);

  const volunteers = useQuery({
    queryKey: ["admin", "volunteers", offset],
    queryFn: async () => {
      const page = await listVolunteers({ data: { offset, limit: PAGE } });
      setRows((prev) => (offset === 0 ? page : [...(prev ?? []), ...page]));
      return page;
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "new" | "contacted" | "onboarded" }) =>
      adminSetVolunteerStatus({ data: { id, status } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin", "volunteers"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (volunteers.isLoading && offset === 0) {
    return <p className="mt-6 text-muted-foreground">{t("moderation.volp.loading")}</p>;
  }
  if (volunteers.isError && offset === 0) {
    return (
      <p className="mt-6 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        {t("moderation.volp.error")}
      </p>
    );
  }
  const list = rows ?? [];
  if (list.length === 0) {
    return <p className="mt-6 text-muted-foreground">{t("moderation.volp.empty")}</p>;
  }
  const hasMore = (volunteers.data?.length ?? 0) >= PAGE;

  return (
    <div className="mt-6 space-y-3">
      {list.map((v) => (
        <div key={v.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {v.name}
                <span className="font-normal text-muted-foreground">
                  {t("moderation.volp.wilayaSuffix", { wilaya: wilayaName(v.wilaya_code) })}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {v.email}
                {v.phone ? ` · ${v.phone}` : ""}
                {t("moderation.volp.applied", { date: formatDateShort(v.created_at) })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[v.status].classes}`}
              >
                {t(`moderation.volp.status.${v.status}`)}
              </span>
              <select
                value={v.status}
                onChange={(e) =>
                  setStatus.mutate({ id: v.id, status: e.target.value as "new" | "contacted" | "onboarded" })
                }
                disabled={setStatus.isPending}
                aria-label={t("moderation.volp.statusAria")}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              >
                <option value="new">{t("moderation.volp.status.new")}</option>
                <option value="contacted">{t("moderation.volp.status.contacted")}</option>
                <option value="onboarded">{t("moderation.volp.status.onboarded")}</option>
              </select>
            </div>
          </div>
          {v.extra_wilayas && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("moderation.volp.also", { extra: v.extra_wilayas })}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {v.intents.split(",").map((intent) => (
              <span
                key={intent}
                className="inline-flex rounded-full bg-plant/10 px-2.5 py-0.5 text-xs font-medium text-plant"
              >
                {t(`moderation.volp.intent.${intent}`)}
              </span>
            ))}
          </div>
          {(v.availability || v.message) && (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {v.availability && (
                <p>{t("moderation.volp.time", { availability: v.availability })}</p>
              )}
              {v.message && <p className="whitespace-pre-wrap">{v.message}</p>}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{t("moderation.volp.onboardHint")}</p>
        </div>
      ))}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setOffset((o) => o + PAGE)} disabled={volunteers.isFetching}>
            {t("moderation.adm.more")}
          </Button>
        </div>
      )}
    </div>
  );
}
