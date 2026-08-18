import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * "My activity" server functions. fire_reports.user_id is deliberately not
 * column-granted to clients (PII protection), so a signed-in user's own fire
 * reports are fetched here: the caller is identified from their token, the
 * service role reads, and only the public-safe columns leave the server.
 */

async function currentUserId(): Promise<string | null> {
  const auth = getRequest().headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

const SAFE_FIRE_COLUMNS =
  "id, lat, lng, wilaya_code, location_approximate, commune, severity, description, photo_url, status, created_at, resolved_at";

export const myFireReports = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await currentUserId();
  if (!userId) throw new Error("Sign in to see your activity.");
  const { data, error } = await supabaseAdmin
    .from("fire_reports")
    .select(SAFE_FIRE_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
});
