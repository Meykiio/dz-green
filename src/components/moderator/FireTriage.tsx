import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fireReportsQuery, formatDateTime, photoUrl } from "@/lib/data";
import type { FireReport, FireStatus } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";
import { ContactReveal } from "./ContactReveal";
import { StatusBadge } from "./StatusBadge";

const STATUS_META: Record<FireStatus, { label: string; tone: "fire" | "plant" | "muted" }> = {
  active: { label: "Active", tone: "fire" },
  resolved: { label: "Resolved", tone: "plant" },
  false_alarm: { label: "False alarm", tone: "muted" },
};

/** Fire report triage — mark active reports resolved or false alarms. */
export function FireTriage() {
  const queryClient = useQueryClient();

  const fires = useQuery(fireReportsQuery);

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
    return <p className="text-muted-foreground">Loading fire reports…</p>;
  }
  if (fires.isError) {
    return (
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        Couldn't load fire reports — check your connection and refresh.
      </p>
    );
  }
  const list = fires.data ?? [];
  if (list.length === 0) {
    return <p className="text-muted-foreground">No fire reports yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {list.map((fire) => (
        <li key={fire.id} className="overflow-hidden rounded-lg border border-border bg-card">
          {photoUrl(fire.photo_url) && (
            <img
              src={photoUrl(fire.photo_url)!}
              alt={`Fire report in ${wilayaName(fire.wilaya_code)}`}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="space-y-1 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={STATUS_META[fire.status].tone}>
                {STATUS_META[fire.status].label}
              </StatusBadge>
              {fire.severity === "large" ? (
                <StatusBadge tone="fire">Large</StatusBadge>
              ) : fire.severity === "small" ? (
                <StatusBadge>Small</StatusBadge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                Reported {formatDateTime(fire.created_at)}
              </span>
            </div>
            <p className="font-medium">
              {wilayaName(fire.wilaya_code)}
              {fire.commune ? ` · ${fire.commune}` : ""} · {fire.lat.toFixed(4)},{" "}
              {fire.lng.toFixed(4)}
              {fire.location_approximate ? " · wilaya-level" : ""}
            </p>
            {fire.description && <p className="text-sm">{fire.description}</p>}
            {fire.resolved_at && (
              <p className="text-xs text-muted-foreground">
                {fire.status === "false_alarm" ? "Marked false alarm" : "Resolved"} on{" "}
                {formatDateTime(fire.resolved_at)}
              </p>
            )}
            <div className="pt-1">
              <ContactReveal kind="fire" id={fire.id} />
            </div>
            <div className="flex flex-wrap gap-2 pt-3">
              {fire.status === "active" ? (
                <>
                  <Button
                    onClick={() => setStatus.mutate({ id: fire.id, status: "resolved" })}
                    disabled={setStatus.isPending}
                  >
                    Mark resolved
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setStatus.mutate({ id: fire.id, status: "false_alarm" })}
                    disabled={setStatus.isPending}
                  >
                    False alarm
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setStatus.mutate({ id: fire.id, status: "active" })}
                  disabled={setStatus.isPending}
                >
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
