import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { adminDeleteSite } from "@/lib/admin.functions";
import { photoUrl, SITE_COLUMNS } from "@/lib/data";
import { moderateSite } from "@/lib/moderation.functions";
import type { Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

/**
 * Rejected plantings (2026-08-28): visible so a moderator can re-approve
 * later. Photos are deleted on reject (immutable-cache rule), so most rows
 * have no photo — the record itself is the reviewable unit.
 */
export function RejectedQueue() {
  const { t, count, formatDate, formatDateTime } = useI18n();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const moderate = useServerFn(moderateSite);
  const [confirming, setConfirming] = useState<string | null>(null);

  const rejected = useQuery({
    queryKey: ["sites", "rejected"],
    queryFn: async (): Promise<Site[]> => {
      const { data, error } = await supabase
        .from("sites")
        .select(SITE_COLUMNS)
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Site[];
    },
  });

  const reapprove = useMutation({
    mutationFn: async (id: string) => moderate({ data: { id, status: "approved" } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sites"] });
      void queryClient.invalidateQueries({ queryKey: ["moderation", "stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const del = useMutation({
    mutationFn: adminDeleteSite,
    onSuccess: () => {
      toast.success(t("moderation.adm.deleteToast"));
      setConfirming(null);
      void queryClient.invalidateQueries({ queryKey: ["sites"] });
      void queryClient.invalidateQueries({ queryKey: ["moderation", "stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rejected.isLoading) {
    return <p className="text-muted-foreground">{t("moderation.queue.loading")}</p>;
  }
  if (rejected.isError) {
    return (
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        {t("moderation.queue.error")}
      </p>
    );
  }
  const list = rejected.data ?? [];
  if (list.length === 0) {
    return <p className="text-muted-foreground">{t("moderation.mod.rejectedEmpty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {list.map((site) => (
        <li key={site.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
          {photoUrl(site.photo_url) && (
            <img
              src={photoUrl(site.photo_url)!}
              alt={t("moderation.queue.alt", { wilaya: wilayaName(site.wilaya_code) })}
              className="size-24 shrink-0 rounded-lg object-cover"
              loading="lazy"
              // Reject deletes the photo object (immutable-cache rule), so the
              // proxy 404s for older rejected rows — hide the broken thumbnail
              // instead of showing a black box.
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium">
              {count(site.tree_count, "tree")}
              {site.species ? ` · ${site.species}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {wilayaName(site.wilaya_code)}
              {site.commune ? ` · ${site.commune}` : ""} ·{" "}
              {t("home.list.planted", { date: formatDate(site.planted_date, { day: "numeric", month: "short", year: "numeric" }) })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("moderation.queue.submitted", { datetime: formatDateTime(site.created_at) })}
            </p>
            {site.moderator_notes && (
              <p className="text-xs text-muted-foreground">
                {t("moderation.act.note", { note: site.moderator_notes })}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => reapprove.mutate(site.id)}
                disabled={reapprove.isPending}
              >
                {t("moderation.mod.reApprove")}
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  className={confirming === site.id ? "text-fire" : ""}
                  onClick={() => {
                    if (confirming === site.id) {
                      del.mutate({ data: { id: site.id } });
                    } else {
                      setConfirming(site.id);
                      setTimeout(() => setConfirming((c) => (c === site.id ? null : c)), 4000);
                    }
                  }}
                  disabled={del.isPending}
                  aria-label={t("moderation.adm.deleteUser")}
                >
                  <Trash2 className="size-4" />
                  {confirming === site.id ? t("moderation.adm.confirmDelete") : ""}
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
