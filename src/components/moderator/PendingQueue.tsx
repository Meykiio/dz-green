import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PhotoThumb } from "@/components/PhotoThumb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { localizeError, useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { photoUrl, SITE_COLUMNS } from "@/lib/data";
import { moderateSite } from "@/lib/moderation.functions";
import type { Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";
import { ContactReveal } from "./ContactReveal";

/** Submission age: compact h/d label, amber past 24h, wildfire past 72h. */
function ageOf(iso: string): { label: string; tone: string } {
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3600_000);
  const days = Math.floor(hours / 24);
  if (hours < 24) {
    return { label: `${Math.max(1, Math.floor(hours))}h`, tone: "border-border bg-card text-muted-foreground" };
  }
  if (hours < 72) return { label: `${days}d`, tone: "border-sand/50 bg-sand/10 text-sand" };
  return { label: `${days}d`, tone: "border-fire/50 bg-fire/10 text-fire" };
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="ms-1 rounded border border-black/20 bg-black/10 px-1 text-[10px] font-semibold leading-4">
      {children}
    </kbd>
  );
}

/**
 * Pending plantings (review-queue UX, 2026-09-12): keyboard-first decisions
 * (arrows pick, A approves, R rejects — mouse-only review cuts throughput
 * 30-40%), submission age visible as urgency, and no queue-depth banner —
 * the research is unambiguous that showing reviewers the backlog size
 * degrades decisions. Queue length stays in the tab badge only.
 */
export function PendingQueue() {
  const { t, count, formatDate, formatDateTime } = useI18n();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const moderate = useServerFn(moderateSite);

  const pending = useQuery({
    queryKey: ["sites", "pending"],
    queryFn: async (): Promise<Site[]> => {
      const { data, error } = await supabase
        .from("sites")
        // Explicit list: contact_phone is column-grant protected — select("*")
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

  const list = pending.data ?? [];
  const current = Math.min(activeIndex, list.length - 1);

  // Keyboard review: arrows move, A/R decide on the current card. Skipped
  // entirely while the moderator types (note fields, selects) or holds a
  // modifier — shortcuts must never fight the form.
  useEffect(() => {
    if (list.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(list.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        const site = list[Math.min(activeIndex, list.length - 1)];
        if (site) decide.mutate({ id: site.id, status: "approved" });
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const site = list[Math.min(activeIndex, list.length - 1)];
        if (site) decide.mutate({ id: site.id, status: "rejected" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list, activeIndex, decide]);

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
  if (list.length === 0) {
    return <p className="text-muted-foreground">{t("moderation.queue.empty")}</p>;
  }

  return (
    <ul className="space-y-3">
      {list.map((site, index) => {
        const isActive = index === current;
        const age = ageOf(site.created_at);
        return (
          <li
            key={site.id}
            className={`flex gap-3 rounded-lg border bg-card p-3 transition-[border-color,box-shadow] ${
              isActive ? "border-primary/50 ring-1 ring-primary/30" : "border-border"
            }`}
          >
            <PhotoThumb
              src={photoUrl(site.photo_url)}
              alt={t("moderation.queue.alt", { wilaya: wilayaName(site.wilaya_code) })}
              tone="plant"
              className="size-24 shrink-0 rounded-lg"
              iconClassName="size-6"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">
                {count(site.tree_count, "tree")}
                {site.species ? ` · ${site.species}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {wilayaName(site.wilaya_code)}
                {site.commune ? ` · ${site.commune}` : ""} ·{" "}
                {t("home.list.planted", {
                  date: formatDate(site.planted_date, { day: "numeric", month: "short", year: "numeric" }),
                })}
                {site.location_approximate ? ` · ${t("home.list.wilayaLevel")}` : ""}
              </p>
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {site.lat.toFixed(5)}, {site.lng.toFixed(5)} ·{" "}
                {t("moderation.queue.submitted", { datetime: formatDateTime(site.created_at) })}
                <span
                  title={t("moderation.queue.submitted", { datetime: formatDateTime(site.created_at) })}
                  className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${age.tone}`}
                >
                  {age.label}
                </span>
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
                <Button onClick={() => decide.mutate({ id: site.id, status: "approved" })} disabled={decide.isPending}>
                  {t("moderation.queue.approve")}
                  <Kbd>A</Kbd>
                </Button>
                <Button
                  variant="outline"
                  className="text-fire hover:bg-fire/10"
                  onClick={() => decide.mutate({ id: site.id, status: "rejected" })}
                  disabled={decide.isPending}
                >
                  {t("moderation.queue.reject")}
                  <Kbd>R</Kbd>
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
