import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Shared guard for the admin-only server functions. Every call re-checks the
 * caller's role in `user_roles` from the request token — the check is live,
 * so a demoted admin loses access on the next request (no JWT staleness
 * window).
 */
export async function currentAdminId(): Promise<string | null> {
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

export async function requireAdmin(): Promise<string> {
  const id = await currentAdminId();
  if (!id) throw new Error("You need administrator access to do that.");
  return id;
}
