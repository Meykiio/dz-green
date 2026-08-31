import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-shared.server";

/** Admin server functions for content: feedback, volunteers, and hard-deletes. */

export const adminDeleteVolunteer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("volunteers").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteFeedback = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin.from("feedback").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/**
 * Hard-delete a fire report (2026-08-28): fires publish instantly, so a
 * malicious one stays public until removed — false-alarm only mutes it on
 * the map. Admin-only; deletes the photo object too.
 */
export const adminDeleteFire = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: row } = await supabaseAdmin
      .from("fire_reports")
      .select("photo_url")
      .eq("id", data.id)
      .single();
    const { error } = await supabaseAdmin.from("fire_reports").delete().eq("id", data.id);
    if (error) throw error;
    if (row?.photo_url) await supabaseAdmin.storage.from("photos").remove([row.photo_url]);
    return { ok: true };
  });

/** Hard-delete a planting (spam that slipped through approval). Photo too. */
export const adminDeleteSite = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: row } = await supabaseAdmin
      .from("sites")
      .select("photo_url")
      .eq("id", data.id)
      .single();
    const { error: careErr } = await supabaseAdmin
      .from("care_logs")
      .delete()
      .eq("site_id", data.id);
    if (careErr) throw careErr;
    const { error } = await supabaseAdmin.from("sites").delete().eq("id", data.id);
    if (error) throw error;
    if (row?.photo_url) await supabaseAdmin.storage.from("photos").remove([row.photo_url]);
    return { ok: true };
  });

export interface AdminFeedback {
  id: string;
  kind: "bug" | "idea" | "other";
  message: string;
  page: string | null;
  device: string | null;
  created_at: string;
}

const listPageShape = z.object({ offset: z.number().int().min(0).default(0), limit: z.number().int().min(1).max(100).default(25) });

export const adminListFeedback = createServerFn({ method: "GET" })
  .validator((data: unknown) => listPageShape.parse(data))
  .handler(async ({ data }): Promise<AdminFeedback[]> => {
    await requireAdmin();
    const { data: rows, error } = await supabaseAdmin
      .from("feedback")
      .select("id, kind, message, page, device, created_at")
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw error;
    // kind is a check-constrained column; the generated types only know string.
    return (rows ?? []) as AdminFeedback[];
  });

export interface AdminVolunteer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  wilaya_code: string;
  extra_wilayas: string | null;
  intents: string;
  availability: string | null;
  message: string | null;
  status: "new" | "contacted" | "onboarded";
  user_id: string | null;
  created_at: string;
}

export const adminListVolunteers = createServerFn({ method: "GET" })
  .validator((data: unknown) => listPageShape.parse(data))
  .handler(async ({ data }): Promise<AdminVolunteer[]> => {
    await requireAdmin();
    const { data: rows, error } = await supabaseAdmin
      .from("volunteers")
      .select("id, name, email, phone, wilaya_code, extra_wilayas, intents, availability, message, status, user_id, created_at")
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw error;
    // status is check-constrained; the generated types only know string.
    return (rows ?? []) as AdminVolunteer[];
  });

export const adminSetVolunteerStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "onboarded"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { error } = await supabaseAdmin
      .from("volunteers")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
  });

/**
 * One-click onboarding (2026-08-29): the applicant's linked account becomes a
 * moderator with the application's wilaya. Requires a linked account — older
 * applications without one must be handled by "New account" instead.
 */
export const adminOnboardVolunteer = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: v } = await supabaseAdmin
      .from("volunteers")
      .select("user_id, wilaya_code, status")
      .eq("id", data.id)
      .single();
    if (!v) throw new Error("Application not found.");
    if (!v.user_id) {
      throw new Error("No account linked — ask them to create one first (or use New account).");
    }
    // Replace any existing role (single-role invariant), then assign.
    const { error: delErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", v.user_id);
    if (delErr) throw delErr;
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: v.user_id, role: "moderator" });
    if (roleErr) throw roleErr;
    const { error: wErr } = await supabaseAdmin
      .from("moderator_wilayas")
      .delete()
      .eq("user_id", v.user_id);
    if (wErr) throw wErr;
    const { error: insErr } = await supabaseAdmin
      .from("moderator_wilayas")
      .insert({ user_id: v.user_id, wilaya_code: v.wilaya_code });
    if (insErr) throw insErr;
    const { error: stErr } = await supabaseAdmin
      .from("volunteers")
      .update({ status: "onboarded" })
      .eq("id", data.id);
    if (stErr) throw stErr;
    return { ok: true };
  });
