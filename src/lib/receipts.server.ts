import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Receipt links for anonymous submissions (Sprint 4).
 *
 * The raw token is a 128-bit UUID shown once in the success-screen URL. Only
 * its salted SHA-256 hash is stored, so a database read never reveals a
 * working link. Lookups return moderation status only — never PII.
 */

export type ReceiptKind = "planting" | "care" | "fire";

export interface ReceiptStatus {
  kind: ReceiptKind;
  /** "published" for care logs, which have no moderation state. */
  status: string;
  createdAt: string;
  wilayaCode: string | null;
}

async function hashToken(token: string): Promise<string> {
  // Fail loud (security report 2026-08-30): a missing salt must not fall back
  // to a predictable constant — token hashes would become computable.
  const salt = process.env["SUPABASE_PROJECT_ID"];
  if (!salt) throw new Error("SUPABASE_PROJECT_ID is required server-side.");
  const bytes = new TextEncoder().encode(`${salt}:${token}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Mints an unguessable receipt token for a stored submission. */
export async function mintReceipt(kind: ReceiptKind, submissionId: string): Promise<string> {
  const token = crypto.randomUUID();
  const { error } = await supabaseAdmin.from("receipts").insert({
    token_hash: await hashToken(token),
    kind,
    submission_id: submissionId,
  });
  if (error) throw error;
  return token;
}

/** Resolves a receipt token to a public-safe status snapshot, or null. */
export async function getReceiptStatus(token: string): Promise<ReceiptStatus | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { data: receipt } = await supabaseAdmin
    .from("receipts")
    .select("kind, submission_id, created_at")
    .eq("token_hash", await hashToken(token))
    .maybeSingle();
  if (!receipt) return null;

  const base = {
    kind: receipt.kind as ReceiptKind,
    createdAt: receipt.created_at as string,
  };

  if (receipt.kind === "planting") {
    const { data } = await supabaseAdmin
      .from("sites")
      .select("status, wilaya_code")
      .eq("id", receipt.submission_id)
      .maybeSingle();
    if (!data) return null;
    return { ...base, status: data.status as string, wilayaCode: data.wilaya_code as string };
  }
  if (receipt.kind === "fire") {
    const { data } = await supabaseAdmin
      .from("fire_reports")
      .select("status, wilaya_code")
      .eq("id", receipt.submission_id)
      .maybeSingle();
    if (!data) return null;
    return { ...base, status: data.status as string, wilayaCode: data.wilaya_code as string };
  }
  const { data } = await supabaseAdmin
    .from("care_logs")
    .select("id")
    .eq("id", receipt.submission_id)
    .maybeSingle();
  if (!data) return null;
  return { ...base, status: "published", wilayaCode: null };
}
