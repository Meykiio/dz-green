import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin-shared.server";

/** Admin server functions for accounts: list, create, role, wilayas, sign-out, delete. */

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
    const adminId = await requireAdmin();
    // Self-lockout guard (security report 2026-08-30): an admin must not
    // demote or remove their own role — the UI hides the button, but the
    // RPC is open. Being the LAST admin makes it a hard block either way.
    if (data.userId === adminId) {
      throw new Error("You can't change your own role — ask another admin.");
    }
    if (data.role !== "admin") {
      const { data: admins } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const others = (admins ?? []).filter((a) => a.user_id !== data.userId);
      if (others.length === 0) {
        throw new Error("This is the last admin — assign another admin first.");
      }
    }
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
    // Issue #37: leaving 'moderator' must clear the wilaya assignments,
    // otherwise a later re-promotion silently restores the old scope.
    if (data.role !== "moderator") {
      const { error: wErr } = await supabaseAdmin
        .from("moderator_wilayas")
        .delete()
        .eq("user_id", data.userId);
      if (wErr) throw wErr;
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
