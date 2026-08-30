import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sprout } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { localizeError, useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { photoUrl, SITE_COLUMNS } from "@/lib/data";
import { moderateSite } from "@/lib/moderation.functions";
import type { Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";
import { ContactReveal } from "./ContactReveal";

export function PendingQueue() {
  const { t, count, formatDate, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const moderate = useServerFn(moderateSite);

  const pending = useQuery({
    queryKey: ["sites", "pending"],
    queryFn: async (): Promise<Site[]> => {
      const { data, error } = await supabase
        .from("sites")
        // Explicit list: contact_phone is column-grant protected â€” select("*")
        // fails on purpose, same posture as fire reporter PII.
        .select(SITE_COLUMNS)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Site[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      await moderate({ data: { id, status, note: notes[id] } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sites"] });
      void queryClient.invalidateQueries({ queryKey: ["moderation", "stats"] });
    },
    onError: (error: Error) => toast.error(localizeError(error.message ?? "")),
  });

  if (pending.isLoading) {
    return <p className="text-muted-foreground">{t("moderation.queue.loading")}</p>;
  }
  if (pending.isError) {
    return (
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        {t("moderation.queue.error")}
      </p>
    );
  }
  const list = pending.data ?? [];
  if (list.length === 0) {
    return <p className="text-muted-foreground">{t("moderation.queue.empty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {list.map((site) => (
        <li key={site.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
          {photoUrl(site.photo_url) ? (
            <img
              src={photoUrl(site.photo_url)!}
              alt={t("moderation.queue.alt", { wilaya: wilayaName(site.wilaya_code) })}
              className="size-24 shrink-0 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid size-24 shrink-0 place-items-center rounded-lg bg-plant/15 text-plant">
              <Sprout className="size-6" />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium">
              {count(site.tree_count, "tree")}
              {site.species ? ` Â· ${site.species}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {wilayaName(site.wilaya_code)}
              {site.commune ? ` Â· ${site.commune}` : ""} Â·{" "}
              {t("home.list.planted", { date: formatDate(site.planted_date, { day: "numeric", month: "short", year: "numeric" }) })}
              {site.location_approximate ? ` Â· ${t("home.list.wilayaLevel")}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {site.lat.toFixed(5)}, {site.lng.toFixed(5)} Â·{" "}
              {t("moderation.queue.submitted", { datetime: formatDateTime(site.created_at) })}
            </p>
            {site.notes && <p className="line-clamp-2 text-sm">{site.notes}</p>}
            <div className="pt-1">
              <ContactReveal kind="site" id={site.id} />
            </div>
            <div className="pt-2">
              <label
                htmlFor={`note-${site.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {t("moderation.queue.noteLabel")}
              </label>
              <Textarea
                id={`note-${site.id}`}
                rows={2}
                value={notes[site.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [site.id]: e.target.value }))}
                placeholder={t("moderation.queue.notePlaceholder")}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => decide.mutate({ id: site.id, status: "approved" })}
                disabled={decide.isPending}
              >
                {t("moderation.queue.approve")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => decide.mutate({ id: site.id, status: "rejected" })}
                disabled={decide.isPending}
              >
                {t("moderation.queue.reject")}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
