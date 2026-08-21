import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Moderator-only contact reveal. Reporter/planter PII is column-grant
 * protected, so no client query can read it — these service-role functions
 * are the only read path, and every call re-checks the caller's role live
 * (a demoted moderator loses access on the next request).
 */

async function requireStaff(): Promise<string> {
  const auth = getRequest().headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("You need moderator access to do that.");
  const { data } = await supabaseAdmin.auth.getUser(token);
  if (!data.user) throw new Error("You need moderator access to do that.");
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  if (!roles?.some((r) => r.role === "admin" || r.role === "moderator")) {
    throw new Error("You need moderator access to do that.");
  }
  return data.user.id;
}

export interface ContactInfo {
  name: string | null;
  phone: string | null;
}

const idShape = z.object({ id: z.string().uuid() });

export const getSiteContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => idShape.parse(data))
  .handler(async ({ data }): Promise<ContactInfo> => {
    await requireStaff();
    const { data: row, error } = await supabaseAdmin
      .from("sites")
      .select("planter_display_name, contact_phone")
      .eq("id", data.id)
      .single();
    if (error) throw error;
    return { name: row.planter_display_name, phone: row.contact_phone };
  });

export const getFireContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => idShape.parse(data))
  .handler(async ({ data }): Promise<ContactInfo> => {
    await requireStaff();
    const { data: row, error } = await supabaseAdmin
      .from("fire_reports")
      .select("reporter_name, reporter_phone")
      .eq("id", data.id)
      .single();
    if (error) throw error;
    return { name: row.reporter_name, phone: row.reporter_phone };
  });
