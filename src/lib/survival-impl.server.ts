import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertScope, requireStaff } from "@/lib/staff.server";
import { GateError, optionalUserId, storePhoto, verifyGate, type GateInput } from "@/lib/submissions.server";
import { independenceFor, isMissingRelation, type SurvivalStatus } from "@/lib/survival";

/**
 * Survival checks (Phase 2a). Writes only through these server functions,
 * service role, behind the same abuse gate as every public write.
 * The generated Supabase types predate the table, hence the untyped client;
 * regenerate types after the migration and drop the cast.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as unknown as SupabaseClient<any>;

const NOT_LIVE = "Survival checks are not live yet. Please try again soon.";

export interface SurvivalInput extends GateInput {
  site_id: string;
  status: SurvivalStatus;
  trees_checked: number;
  trees_alive: number;
  photo: string;
  checked_date: string;
  notes?: string | null | undefined;
  submitter_name?: string | null | undefined;
  client_request_id?: string | null | undefined;
}

function fail(error: unknown): never {
  if (error instanceof GateError) throw new Error(error.message);
  if (isMissingRelation(error)) throw new Error(NOT_LIVE);
  console.error("[survival]", error);
  throw new Error("Something went wrong. Please try again.");
}

async function sha256OfDataUrl(dataUrl: string): Promise<string> {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function isStaff(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).length > 0;
}

async function existingByRequest(clientRequestId: string | null | undefined) {
  if (!clientRequestId) return null;
  const { data, error } = await db
    .from("survival_checks")
    .select("id")
    .eq("client_request_id", clientRequestId)
    .maybeSingle();
  if (error) throw error;
  return (data as { id: string } | null) ?? null;
}

export async function submitSurvivalCheckImpl(data: SurvivalInput) {
  try {
    if (data.trees_alive > data.trees_checked) {
      throw new GateError("Trees alive can't be more than trees checked.");
    }
    // A retried request (dropped connection, offline outbox) returns the
    // first result instead of creating a duplicate.
    const replay = await existingByRequest(data.client_request_id);
    if (replay) return { id: replay.id, status: "published" as const };

    if ((await verifyGate("survival", data)) === "dropped") {
      return { id: crypto.randomUUID(), status: "published" as const };
    }
    const userId = await optionalUserId();

    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("id,status,user_id,tree_count")
      .eq("id", data.site_id)
      .maybeSingle();
    if (!site || site.status !== "approved") {
      throw new GateError("That planting is not available for checks.");
    }

    const photoHash = await sha256OfDataUrl(data.photo);
    const { data: dup, error: dupError } = await db
      .from("survival_checks")
      .select("id")
      .eq("photo_sha256", photoHash)
      .limit(1);
    if (dupError) throw dupError;
    if ((dup ?? []).length > 0) {
      throw new GateError("This photo was already used for a check. Please take a new one on site.");
    }

    const independence = independenceFor({
      checkerId: userId,
      planterId: (site.user_id as string | null) ?? null,
      checkerIsStaff: await isStaff(userId),
    });

    const photoPath = await storePhoto(data.photo, "survival");
    const { data: row, error } = await db
      .from("survival_checks")
      .insert({
        site_id: data.site_id,
        status: data.status,
        trees_checked: data.trees_checked,
        trees_alive: data.trees_alive,
        photo_url: photoPath,
        photo_sha256: photoHash,
        checked_date: data.checked_date,
        notes: data.notes ?? null,
        submitter_name: data.submitter_name ?? null,
        user_id: userId,
        independence,
        client_request_id: data.client_request_id ?? null,
      })
      .select("id")
      .single();
    if (error) {
      await supabaseAdmin.storage.from("photos").remove([photoPath]);
      // Lost a race with an identical retry: hand back the winner.
      if ((error as { code?: string }).code === "23505") {
        const winner = await existingByRequest(data.client_request_id);
        if (winner) return { id: winner.id, status: "published" as const };
      }
      throw error;
    }
    return { id: (row as { id: string }).id, status: "published" as const };
  } catch (error) {
    fail(error);
  }
}

export async function reviewSurvivalCheckImpl(input: { id: string; grade: "verified" | "rejected" }) {
  try {
    const staff = await requireStaff();
    const { data: check, error } = await db
      .from("survival_checks")
      .select("id,photo_url,site_id")
      .eq("id", input.id)
      .maybeSingle();
    if (error) throw error;
    if (!check) throw new GateError("Check not found.");
    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("wilaya_code")
      .eq("id", (check as { site_id: string }).site_id)
      .maybeSingle();
    if (!site) throw new GateError("Check not found.");
    assertScope(staff, site.wilaya_code);

    const { error: updateError } = await db
      .from("survival_checks")
      .update({ grade: input.grade, reviewed_by: staff.userId, reviewed_at: new Date().toISOString() })
      .eq("id", input.id);
    if (updateError) throw updateError;
    // Rejected evidence is never served again (same rule as rejected plantings).
    if (input.grade === "rejected") {
      await supabaseAdmin.storage.from("photos").remove([(check as { photo_url: string }).photo_url]);
    }
    return { ok: true as const };
  } catch (error) {
    if (error instanceof Error && /moderator access|outside your assigned/.test(error.message)) throw error;
    fail(error);
  }
}
