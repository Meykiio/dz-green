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
 */
export function useMapRealtime(
  sitesRef: MutableRefObject<Site[]>,
  onActivity: (text: string) => void,
) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const activityRef = useRef(onActivity);
  activityRef.current = onActivity;
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const channel = supabase
      .channel("green-algeria-map")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sites", filter: "status=eq.approved" },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: ["sites"] });
          if (payload.eventType === "INSERT") {
            const row = payload.new as { wilaya_code?: string; tree_count?: number };
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
        void queryClient.invalidateQueries({ queryKey: ["fire_reports"] });
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
          void queryClient.invalidateQueries({ queryKey: ["care_logs"] });
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
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, sitesRef]);
}
