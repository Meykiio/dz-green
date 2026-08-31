import { createServerFn } from "@tanstack/react-start";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-shared.server";

/** Admin server function for the Overview tab: platform stats + wilaya load. */

export interface AdminStats {
  users: number;
  sites: { pending: number; approved: number; rejected: number };
  fires: { active: number; resolved: number; false_alarm: number };
  careLogs: number;
  submissionsToday: number;
  /** Per-wilaya moderation load, only wilayas with something going on. */
  wilayas: { code: string; pending: number; activeFires: number }[];
}

export const adminStats = createServerFn({ method: "GET" }).handler(async (): Promise<AdminStats> => {
  await requireAdmin();
  const [profiles, pending, approved, rejected, active, resolved, falseAlarm, care, today, sitesByWilaya, firesByWilaya] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("sites").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("sites").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabaseAdmin.from("sites").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      supabaseAdmin.from("fire_reports").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("fire_reports").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      supabaseAdmin.from("fire_reports").select("id", { count: "exact", head: true }).eq("status", "false_alarm"),
      supabaseAdmin.from("care_logs").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("submission_meta")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      supabaseAdmin.from("sites").select("wilaya_code").eq("status", "pending"),
      supabaseAdmin.from("fire_reports").select("wilaya_code").eq("status", "active"),
    ]);

  const byWilaya = new Map<string, { pending: number; activeFires: number }>();
  for (const row of sitesByWilaya.data ?? []) {
    const entry = byWilaya.get(row.wilaya_code) ?? { pending: 0, activeFires: 0 };
    entry.pending += 1;
    byWilaya.set(row.wilaya_code, entry);
  }
  for (const row of firesByWilaya.data ?? []) {
    const entry = byWilaya.get(row.wilaya_code) ?? { pending: 0, activeFires: 0 };
    entry.activeFires += 1;
    byWilaya.set(row.wilaya_code, entry);
  }

  return {
    users: profiles.count ?? 0,
    sites: {
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
    },
    fires: {
      active: active.count ?? 0,
      resolved: resolved.count ?? 0,
      false_alarm: falseAlarm.count ?? 0,
    },
    careLogs: care.count ?? 0,
    submissionsToday: today.count ?? 0,
    wilayas: [...byWilaya.entries()]
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.pending + b.activeFires - (a.pending + a.activeFires)),
  };
});
