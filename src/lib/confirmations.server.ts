import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { GateError } from "@/lib/submissions.server";

export type Verdict = "yes" | "no" | "unsure";

/** Community-verified threshold: 3+ yes votes and >70% yes/(yes+no). Mirrors the SQL view. */
export function isCommunityVerified(yes: number, no: number): boolean {
  const total = yes + no;
  return yes >= 3 && total > 0 && yes / total > 0.7;
}

export interface FireCounts {
  conf_yes: number;
  conf_no: number;
  conf_unsure: number;
  community_verified: boolean;
}

const DAILY_VOTE_LIMIT = 20;

/**
 * Cast or replace a vote on a fire report. voter_key is the client device
 * secret, hashed server-side into the daily-rotating device hash (same
 * privacy pattern as the submission gate — never a raw secret, never an IP).
 * Rate limit: 20 votes per voter per day, enforced by counting today's rows.
 */
export async function submitFireVoteImpl(input: {
  fireReportId: string;
  verdict: Verdict;
  deviceSecret: string;
}): Promise<{ ok: true }> {
  const voterKey = await hashVoter(input.deviceSecret);

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  // Table is new (migration 20260905120000_fire_confirmations.sql, pending
  // apply) — the generated Supabase types regenerate after it lands.
  const { count, error: countError } = await (supabaseAdmin as any)
    .from("fire_confirmations")
    .select("id", { count: "exact", head: true })
    .eq("voter_key", voterKey)
    .gte("created_at", since);
  if (!countError && (count ?? 0) >= DAILY_VOTE_LIMIT) {
    throw new GateError("You've voted a lot today. Please try again tomorrow.");
  }

  const { error } = await (supabaseAdmin as any)
    .from("fire_confirmations")
    .upsert(
      {
        fire_report_id: input.fireReportId,
        voter_key: voterKey,
        verdict: input.verdict,
      },
      { onConflict: "fire_report_id,voter_key" },
    );

  if (error) {
    console.error("[confirmations] vote failed:", error.message);
    throw new GateError("Could not save your vote. Try again.");
  }
  return { ok: true };
}

/** The device secret hashed server-side (HMAC, daily-rotating) — the voter_key. */
async function hashVoter(secret: string): Promise<string> {
  const key = process.env["DEVICE_HASH_KEY"] ?? process.env["SUPABASE_PROJECT_ID"];
  if (!key) throw new Error("DEVICE_HASH_KEY (or SUPABASE_PROJECT_ID) is required server-side.");
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${secret}:fire-confirm:${day}`),
  );
  const preimage = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(preimage));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Public per-fire counts from the view (no per-voter data). */
export async function getFireCountsImpl(fireReportId: string): Promise<FireCounts> {
  const { data, error } = await (supabaseAdmin as any)
    .from("fire_confirmation_counts")
    .select("conf_yes, conf_no, conf_unsure, community_verified")
    .eq("fire_report_id", fireReportId)
    .maybeSingle();
  if (error) {
    console.error("[confirmations] counts failed:", error.message);
    return { conf_yes: 0, conf_no: 0, conf_unsure: 0, community_verified: false };
  }
  return {
    conf_yes: data?.conf_yes ?? 0,
    conf_no: data?.conf_no ?? 0,
    conf_unsure: data?.conf_unsure ?? 0,
    community_verified: data?.community_verified ?? false,
  };
}

/** The current voter's existing verdict on a fire (for button state). */
export async function getMyVoteImpl(fireReportId: string, deviceSecret: string): Promise<Verdict | null> {
  const voterKey = await hashVoter(deviceSecret);
  const { data, error } = await (supabaseAdmin as any)
    .from("fire_confirmations")
    .select("verdict")
    .eq("fire_report_id", fireReportId)
    .eq("voter_key", voterKey)
    .maybeSingle();
  if (error) return null;
  return (data?.verdict as Verdict | undefined) ?? null;
}
