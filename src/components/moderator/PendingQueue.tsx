import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { photoUrl } from "@/lib/data";
import type { Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

export function PendingQueue() {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pending = useQuery({
    queryKey: ["sites", "pending"],
    queryFn: async (): Promise<Site[]> => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Site[];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const note = notes[id]?.trim();
      const { error } = await supabase
        .from("sites")
        .update({
          status,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          moderator_notes: note ? note : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sites"] });
      void queryClient.invalidateQueries({ queryKey: ["moderation", "stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (pending.isLoading) {
    return <p className="text-muted-foreground">{t.staff.queue.loading}</p>;
  }
  if (pending.isError) {
    return (
      <p className="rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
        {t.staff.queue.error}
      </p>
    );
  }
  const list = pending.data ?? [];
  if (list.length === 0) {
    return <p className="text-muted-foreground">{t.staff.queue.empty}</p>;
  }

  return (
    <ul className="space-y-4">
      {list.map((site) => (
        <li key={site.id} className="overflow-hidden rounded-lg border border-border bg-card">
          {photoUrl(site.photo_url) && (
            <img
              src={photoUrl(site.photo_url)!}
              alt={format(t.detail.photoAltPlanting, { wilaya: wilayaName(site.wilaya_code) })}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
          )}
          <div className="space-y-1 p-4">
            <p className="font-medium">
              {site.tree_count} {t.staff.queue.trees}
              {site.species ? ` · ${site.species}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {wilayaName(site.wilaya_code)}
              {site.commune ? ` · ${site.commune}` : ""} · {formatDate(site.planted_date)}
            </p>
            <p className="text-sm text-muted-foreground">
              {site.lat.toFixed(5)}, {site.lng.toFixed(5)}
            </p>
            {site.notes && <p className="text-sm">{site.notes}</p>}
            <div className="pt-3">
              <label
                htmlFor={`note-${site.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {t.staff.queue.notePrompt}
              </label>
              <Textarea
                id={`note-${site.id}`}
                rows={2}
                value={notes[site.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [site.id]: e.target.value }))}
                placeholder={t.staff.queue.notePlaceholder}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-3">
              <Button
                onClick={() => decide.mutate({ id: site.id, status: "approved" })}
                disabled={decide.isPending}
              >
                {t.staff.queue.approve}
              </Button>
              <Button
                variant="secondary"
                onClick={() => decide.mutate({ id: site.id, status: "rejected" })}
                disabled={decide.isPending}
              >
                {t.staff.queue.reject}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
