import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { supabase } from "@/integrations/supabase/client";
import { fireReportsQuery, photoUrl } from "@/lib/data";
import type { FireStatus } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";
import { StatusBadge } from "./StatusBadge";

const STATUS_TONE: Record<FireStatus, "fire" | "plant" | "muted"> = {
  active: "fire",
  resolved: "plant",
  false_alarm: "muted",
};

/** Fire report triage — mark active reports resolved or false alarms. */
export function FireTriage() {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();

  const fires = useQuery(fireReportsQuery);

  const statusLabel: Record<FireStatus, string> = {
    active: t.staff.fires.statusActive,
    resolved: t.staff.fires.statusResolved,
    false_alarm: t.staff.fires.statusFalseAlarm,
  };

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FireStatus }) => {
      const resolved_at = status === "active" ? null : new Date().toISOString();
      const { error } = await supabase
        .from("fire_reports")
        .update({ status, resolved_at })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fire_reports"] });
      void queryClient.invalidateQueries({ queryKey: ["moderation", "stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (fires.isLoading) {
    return <p className="text-muted-foreground">{t.staff.fires.loading}</p>;
  }
  if (fires.isError) {
    return (
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        {t.staff.fires.error}
      </p>
    );
  }
  const list = fires.data ?? [];
  if (list.length === 0) {
    return <p className="text-muted-foreground">{t.staff.fires.empty}</p>;
  }

  return (
    <ul className="space-y-4">
      {list.map((fire) => (
        <li key={fire.id} className="overflow-hidden rounded-lg border border-border bg-card">
          {photoUrl(fire.photo_url) && (
            <img
              src={photoUrl(fire.photo_url)!}
              alt={format(t.staff.fires.photoAlt, { wilaya: wilayaName(fire.wilaya_code) })}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="space-y-1 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_TONE[fire.status]}>{statusLabel[fire.status]}</StatusBadge>
              {fire.severity === "large" ? (
                <StatusBadge tone="fire">{t.staff.fires.large}</StatusBadge>
              ) : fire.severity === "small" ? (
                <StatusBadge>{t.staff.fires.small}</StatusBadge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {format(t.staff.fires.reported, { date: formatDate(fire.created_at) })}
              </span>
            </div>
            <p className="font-medium">
              {wilayaName(fire.wilaya_code)}
              {fire.commune ? ` · ${fire.commune}` : ""} · {fire.lat.toFixed(4)},{" "}
              {fire.lng.toFixed(4)}
            </p>
            {fire.description && <p className="text-sm">{fire.description}</p>}
            {fire.resolved_at && (
              <p className="text-xs text-muted-foreground">
                {format(
                  fire.status === "false_alarm"
                    ? t.staff.fires.falseAlarmOn
                    : t.staff.fires.resolvedOn,
                  { date: formatDate(fire.resolved_at) },
                )}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-3">
              {fire.status === "active" ? (
                <>
                  <Button
                    onClick={() => setStatus.mutate({ id: fire.id, status: "resolved" })}
                    disabled={setStatus.isPending}
                  >
                    {t.staff.fires.markResolved}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setStatus.mutate({ id: fire.id, status: "false_alarm" })}
                    disabled={setStatus.isPending}
                  >
                    {t.staff.fires.markFalseAlarm}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStatus.mutate({ id: fire.id, status: "active" })}
                  disabled={setStatus.isPending}
                >
                  {t.staff.fires.reopen}
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
