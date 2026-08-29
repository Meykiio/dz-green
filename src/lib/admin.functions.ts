import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Admin-only server functions. Every call re-checks the caller's role in
 * `user_roles` from the request token — the check is live, so a demoted
 * admin loses access on the next request (no JWT staleness window).
 */

async function currentAdminId(): Promise<string | null> {
  const auth = getRequest().headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  if (!data.user) return null;
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  return roles?.some((r) => r.role === "admin") ? data.user.id : null;
}

async function requireAdmin(): Promise<string> {
  const id = await currentAdminId();
  if (!id) throw new Error("You need administrator access to do that.");
  return id;
}

export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "admin" | "moderator" | null;
  wilayas: string[];
  created_at: string;
}

const listUsersShape = z.object({ offset: z.number().int().min(0).default(0), limit: z.number().int().min(1).max(100).default(50) });

export const adminListUsers = createServerFn({ method: "GET" })
  .validator((data: unknown) => listUsersShape.parse(data))
  .handler(async ({ data }): Promise<AdminUser[]> => {
    await requireAdmin();
    const [{ data: profiles }, { data: users }, { data: roles }, { data: assignments }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, display_name, created_at")
          .order("created_at", { ascending: false })
          .range(data.offset, data.offset + data.limit - 1),
        supabaseAdmin.auth.admin.listUsers({ perPage: 200 }),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("moderator_wilayas").select("user_id, wilaya_code"),
      ]);

    const emailById = new Map((users?.users ?? []).map((u) => [u.id, u.email]));
    const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    const wilayasByUser = new Map<string, string[]>();
    for (const a of assignments ?? []) {
      const list = wilayasByUser.get(a.user_id) ?? [];
      list.push(a.wilaya_code);
      wilayasByUser.set(a.user_id, list);
    }

    return (profiles ?? [])
      .map((p) => ({
        id: p.id,
        email: emailById.get(p.id) ?? null,
        display_name: p.display_name,
        role: (roleByUser.get(p.id) as AdminUser["role"]) ?? null,
        wilayas: (wilayasByUser.get(p.id) ?? []).sort(),
        created_at: p.created_at,
      }))
      .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
  });

const createUserShape = z.object({
  email: z.string().trim().email().max(200).toLowerCase(),
  password: z.string().min(8).max(72),
  display_name: z.string().trim().max(80).optional(),
  role: z.enum(["moderator", "admin"]).default("moderator"),
  wilayas: z.array(z.string().regex(/^\d{2}$/)).max(58).default([]),
});

/**
 * Create an auth account as an admin (2026-08-28): the account is usable
 * immediately (email_confirm: true is a service-role capability, independent
 * of the Pro-plan email settings), the profile gets the display name, and a
 * moderator role + wilayas are assigned in the same step.
 */
export const adminCreateUser = createServerFn({ method: "POST" })
  .validator((data: unknown) => createUserShape.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      ...(data.display_name ? { user_metadata: { display_name: data.display_name } } : {}),
    });
    if (error) {
      if (error.status === 422) throw new Error("An account with this email already exists.");
      throw error;
    }
    const userId = created.user.id;
    if (data.display_name) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ display_name: data.display_name })
        .eq("id", userId);
      if (profileError) throw profileError;
    }
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleError) throw roleError;
    if (data.role === "moderator" && data.wilayas.length > 0) {
      const { error: wErr } = await supabaseAdmin
        .from("moderator_wilayas")
        .insert([...new Set(data.wilayas)].map((w) => ({ user_id: userId, wilaya_code: w })));
      if (wErr) throw wErr;
    }
    return { ok: true };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "moderator", "none"]),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    if (data.role === "none") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId);
      if (error) throw error;
    } else {
      // Exactly one role per user: replace, never stack (a stacked
      // moderator+admin pair breaks any first-row role read).
      const { error: del } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId);
      if (del) throw del;
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminSetWilayas = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().uuid(),
      wilayas: z.array(z.string().regex(/^\d{2}$/)).max(48),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .eq("role", "moderator");
    if (!roles?.length) throw new Error("That user is not a moderator.");

    const { error: del } = await supabaseAdmin
      .from("moderator_wilayas")
      .delete()
      .eq("user_id", data.userId);
    if (del) throw del;
    if (data.wilayas.length > 0) {
      const { error: ins } = await supabaseAdmin.from("moderator_wilayas").insert(
        [...new Set(data.wilayas)].map((w) => ({ user_id: data.userId, wilaya_code: w })),
      );
      if (ins) throw ins;
    }
    return { ok: true };
  });

export const adminSignOutUser = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await supabaseAdmin.auth.admin.signOut(data.userId);
    return { ok: true };
  });

/**
 * Delete an auth account (2026-08-28, spam/abuse): the public schema keeps no
 * FKs, so children are removed in order, then the auth user. Historical
 * submissions keep their dangling `user_id`/`reviewed_by` (audit trail).
 */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const adminId = await requireAdmin();
    if (data.userId === adminId) throw new Error("You can't delete your own account here.");
    const { error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (rolesErr) throw rolesErr;
    const { error: wilErr } = await supabaseAdmin
      .from("moderator_wilayas")
      .delete()
      .eq("user_id", data.userId);
    if (wilErr) throw wilErr;
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", data.userId);
    if (profileErr) throw profileErr;
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

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

const listFeedbackShape = z.object({ offset: z.number().int().min(0).default(0), limit: z.number().int().min(1).max(100).default(25) });

export const adminListFeedback = createServerFn({ method: "GET" })
  .validator((data: unknown) => listFeedbackShape.parse(data))
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
  created_at: string;
}

export const adminListVolunteers = createServerFn({ method: "GET" })
  .validator((data: unknown) => listFeedbackShape.parse(data))
  .handler(async ({ data }): Promise<AdminVolunteer[]> => {
    await requireAdmin();
    const { data: rows, error } = await supabaseAdmin
      .from("volunteers")
      .select("id, name, email, phone, wilaya_code, extra_wilayas, intents, availability, message, status, created_at")
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