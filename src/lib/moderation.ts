import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface ModerationStats {
  pending: number;
  approvedToday: number;
  activeFires: number;
  totalSubmissions: number;
  rejected: number;
}

const STATS_KEY = ["moderation", "stats"] as const;

/** Head-count queries — exact counts without fetching rows. */
export function useModerationStats(enabled: boolean) {
  return useQuery({
    queryKey: [...STATS_KEY],
    queryFn: async (): Promise<ModerationStats> => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const [pending, today, total, activeFires, rejected] = await Promise.all([
        supabase.from("sites").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase
          .from("sites")
          .select("id", { count: "exact", head: true })
          .eq("status", "approved")
          .gte("created_at", start.toISOString()),
        supabase.from("sites").select("id", { count: "exact", head: true }),
        supabase.from("fire_reports").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("sites").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      for (const r of [pending, today, total, activeFires, rejected]) {
        if (r.error) throw r.error;
      }
      return {
        pending: pending.count ?? 0,
        approvedToday: today.count ?? 0,
        activeFires: activeFires.count ?? 0,
        totalSubmissions: total.count ?? 0,
        rejected: rejected.count ?? 0,
      };
    },
    enabled,
  });
}
