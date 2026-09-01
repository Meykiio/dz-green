import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, Megaphone, PartyPopper, TriangleAlert, X } from "lucide-react";

import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "ga-announce-dismissed";

interface Announcement {
  id: string;
  title: string;
  body: string;
  kind: "info" | "success" | "warning";
}

const TONE = {
  info: { icon: Info, cls: "border-care/40 bg-care/10 text-care" },
  success: { icon: PartyPopper, cls: "border-plant/40 bg-plant/10 text-plant" },
  warning: { icon: TriangleAlert, cls: "border-fire/40 bg-fire/10 text-fire" },
} as const;

/**
 * Site-wide announcement banner (admin-controlled). RLS limits anon reads to
 * the active row. Dismissed per announcement id — a new announcement shows
 * again even if an older one was dismissed.
 */
export function AnnouncementBanner() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const announcement = useQuery({
    queryKey: ["announcement", "active"],
    queryFn: async (): Promise<Announcement | null> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, body, kind")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Announcement | null;
    },
    staleTime: 300_000,
  });

  const a = announcement.data;
  if (!a || dismissed === a.id) return null;
  const tone = TONE[a.kind] ?? TONE.info;
  const Icon = a.kind === "success" ? PartyPopper : a.kind === "warning" ? TriangleAlert : Megaphone;

  return (
    <div
      role="status"
      className={`fixed inset-x-3 top-16 z-40 mx-auto max-w-md rounded-2xl border bg-card/95 p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur ${tone.cls}`}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card/60">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{a.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(DISMISS_KEY, a.id);
            } catch {
              /* private mode */
            }
            setDismissed(a.id);
          }}
          aria-label={t("chrome.install.dismiss")}
          className="tap-target -me-1 -mt-1 grid shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
