import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type MutableRefObject } from "react";

import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import type { Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

/**
 * Live map subscription: filtered channels (approved plantings, all fire
 * reports, care inserts) invalidate the queries, and each INSERT surfaces an
 * anonymous activity line for the ticker ("3 trees just planted in Oran").
 *
 * The channel only exists while `enabled` (tab visible, not in data-light
 * mode). Every open tab holds one of the plan's Realtime connections (200
 * on Free, 500 on Pro), so hidden tabs let theirs go; when the tab comes
 * back the map refetches once to catch up on anything it missed.
 */
export function useMapRealtime(
  sitesRef: MutableRefObject<Site[]>,
  onActivity: (text: string) => void,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const activityRef = useRef(onActivity);
  activityRef.current = onActivity;
  const tRef = useRef(t);
  tRef.current = t;

  // Set once the channel has been paused, so the catch-up refetch only runs
  // when a hidden tab comes back, never on the first load.
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      pausedRef.current = true;
      return;
    }
    if (pausedRef.current) {
      pausedRef.current = false;
      for (const key of ["sites", "fire_reports", "care_logs"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    }
    // Audit 2026-08-28: a burst of inserts (e.g. a day of fire reports)
    // would invalidate queries dozens of times per second. Debounce each
    // invalidate so the client re-fetches at most every 2s, per table.
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const schedule = (key: string) => {
      const existing = timers.get(key);
      if (existing) clearTimeout(existing);
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          void queryClient.invalidateQueries({ queryKey: [key] });
        }, 2000),
      );
    };

    const channel = supabase
      .channel("green-algeria-map")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sites", filter: "status=eq.approved" },
        (payload) => {
          schedule("sites");
          // Plantings are inserted as pending and reach the map through an
          // approval UPDATE, so INSERT alone never fired (the ticker never
          // announced a tree). Announce any approved site the map has not
          // shown yet; edits to sites already on the map stay silent.
          const row = payload.new as { id?: string; wilaya_code?: string; tree_count?: number };
          const isNew = !!row.id && !sitesRef.current.some((s) => s.id === row.id);
          if (payload.eventType !== "DELETE" && isNew) {
            if (row.wilaya_code) {
              const count = row.tree_count ?? 1;
              activityRef.current(
                tRef.current("home.ticker.planted", {
                  count,
                  wilaya: wilayaName(row.wilaya_code),
                }),
              );
            }
          }
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "fire_reports" }, (payload) => {
        schedule("fire_reports");
        if (payload.eventType === "INSERT") {
          const row = payload.new as { wilaya_code?: string };
          if (row.wilaya_code) {
            activityRef.current(
              tRef.current("home.ticker.fire", { wilaya: wilayaName(row.wilaya_code) }),
            );
          }
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "care_logs" },
        (payload) => {
          schedule("care_logs");
          const row = payload.new as { site_id?: string };
          const site = sitesRef.current.find((s) => s.id === row.site_id);
          if (site) {
            activityRef.current(
              tRef.current("home.ticker.care", { wilaya: wilayaName(site.wilaya_code) }),
            );
          }
        },
      )
      .subscribe();
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, sitesRef, enabled]);
}
