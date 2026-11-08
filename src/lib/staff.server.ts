import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { mapCodeFor } from "@/lib/wilayas";

/**
 * Staff checks shared by every moderator/admin server function: the role is
 * re-read live from user_roles on each call (no JWT staleness window), and
 * moderators are limited to their assigned wilayas (admins are not).
 * Moved out of moderation.functions.ts so other features reuse one copy.
 */

export interface Staff {
  userId: string;
  isAdmin: boolean;
  wilayas: string[];
}

export async function requireStaff(): Promise<Staff> {
  const auth = getRequest().headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("You need moderator access to do that.");
  const { data } = await supabaseAdmin.auth.getUser(token);
  if (!data.user) throw new Error("You need moderator access to do that.");
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  const isAdmin = !!roles?.some((r) => r.role === "admin");
  if (!isAdmin && !roles?.some((r) => r.role === "moderator")) {
    throw new Error("You need moderator access to do that.");
  }
  const wilayas = isAdmin
    ? []
    : ((await supabaseAdmin
        .from("moderator_wilayas")
        .select("wilaya_code")
        .eq("user_id", data.user.id))?.data ?? []).map((w) => w.wilaya_code);
  return { userId: data.user.id, isAdmin, wilayas };
}

export function assertScope(staff: Staff, wilayaCode: string): void {
  if (staff.isAdmin) return;
  const scope = staff.wilayas.includes(wilayaCode) || staff.wilayas.includes(mapCodeFor(wilayaCode)!);
  if (!scope) throw new Error("This submission is outside your assigned wilayas.");
}
