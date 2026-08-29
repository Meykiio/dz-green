import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sniffImageMime } from "@/lib/image";

/**
 * Abuse gate for anonymous public writes.
 *
 * Layers, in order: honeypot field (silent drop) -> submit-timing check ->
 * per-source rate limits backed by `submission_meta`: hashed IP plus a
 * rotating device hash (HMAC over SHA-256(client secret + kind + UTC date)
 * with a server-held key). The device hash is same-day linkable by design and
 * cross-day unlinkable; raw IPs and raw secrets are never stored.
 * A CAPTCHA layer (Cloudflare Turnstile) was considered and deliberately
 * dropped on 2026-08-16 — no third-party dependency.
 */

const HOURLY_LIMITS: Record<Kind, number> = {
  planting: 6,
  care: 20,
  fire: 8,
};

export type Kind = "planting" | "care" | "fire";

export interface GateInput {
  /** Hidden honeypot field. Bots fill it, humans never see it. */
  hp?: string | null | undefined;
  /** ms the form stayed open before submit. */
  elapsedMs?: number | null | undefined;
  /** Random per-browser secret from localStorage. Never stored raw. */
  deviceSecret?: string | null | undefined;
}

function clientIp(): string {
  const request = getRequest();
  const headers = request.headers;
  // Vercel's edge sanitizes `x-forwarded-for` (first entry = the client).
  // `x-real-ip` is the last-resort headered value; trusting
  // `cf-connecting-ip` was removed (audit 2026-08-28): it is only
  // authoritative behind Cloudflare, and a direct caller can spoof it.
  const forwarded = headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashIp(ip: string): Promise<string> {
  const salt = process.env["SUPABASE_PROJECT_ID"];
  if (!salt) throw new Error("SUPABASE_PROJECT_ID is required server-side.");
  return sha256Hex(`${salt}:${ip}`);
}

/**
 * Daily-rotating device hash: HMAC-SHA256(server key, SHA-256(secret:kind:date)).
 * The date in the preimage makes today's hash unlinkable to yesterday's.
 */
async function hashDevice(secret: string, kind: Kind): Promise<string> {
  const key = process.env["DEVICE_HASH_KEY"] ?? process.env["SUPABASE_PROJECT_ID"];
  if (!key) throw new Error("DEVICE_HASH_KEY (or SUPABASE_PROJECT_ID) is required server-side.");
  const day = new Date().toISOString().slice(0, 10); // UTC date — daily rotation
  const preimage = await sha256Hex(`${secret}:${kind}:${day}`);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(preimage));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class GateError extends Error {}

/** Runs every abuse check and records the attempt. Throws GateError on reject. */
export async function verifyGate(kind: Kind, input: GateInput): Promise<"ok" | "dropped"> {
  if (input.hp && input.hp.trim().length > 0) {
    // Silent drop: pretend success, persist nothing, record nothing.
    return "dropped";
  }
  if (typeof input.elapsedMs === "number" && input.elapsedMs >= 0 && input.elapsedMs < 1200) {
    throw new GateError("That was too fast — please try again.");
  }

  const ipHash = await hashIp(clientIp());
  const deviceHash = input.deviceSecret ? await hashDevice(input.deviceSecret, kind) : null;
  const since = new Date(Date.now() - 3600_000).toISOString();

  const { count, error } = await supabaseAdmin
    .from("submission_meta")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("kind", kind)
    .gte("created_at", since);

  if (!error && (count ?? 0) >= HOURLY_LIMITS[kind]) {
    throw new GateError("You've sent a lot of reports in the last hour. Please try again later.");
  }

  if (deviceHash) {
    const { count: deviceCount, error: deviceError } = await supabaseAdmin
      .from("submission_meta")
      .select("id", { count: "exact", head: true })
      .eq("device_fingerprint", deviceHash)
      .eq("kind", kind)
      .gte("created_at", since);
    if (!deviceError && (deviceCount ?? 0) >= HOURLY_LIMITS[kind]) {
      throw new GateError("Too many submissions from this device. Please try again later.");
    }
  }

  await supabaseAdmin.from("submission_meta").insert({
    kind,
    ip_hash: ipHash,
    device_fingerprint: deviceHash,
  });
  return "ok";
}

/** Resolves the signed-in user id from the request bearer token, if any. */
export async function optionalUserId(): Promise<string | null> {
  const auth = getRequest().headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

const MAX_PHOTO_BYTES = 900_000;

/** Stores a base64 data URL in the private photos bucket, returns its path. */
export async function storePhoto(dataUrl: string, folder: string): Promise<string> {
  const match = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) throw new GateError("Unsupported image format.");
  const contentType = match[1]!;
  // Reject before decoding: base64 length maps to byte length at ~3/4, so an
  // oversized payload is refused without ever allocating the decoded buffer
  // (issue #13 — the gate was the first place a large direct API call landed).
  const b64 = match[3]!;
  if (Math.floor(b64.length * 0.75) > MAX_PHOTO_BYTES) {
    throw new GateError("Photo is too large.");
  }
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (binary.byteLength > MAX_PHOTO_BYTES) throw new GateError("Photo is too large.");
  // Audit 2026-08-28: magic-byte check — the regex above alone lets text through
  // masquerading as an image (storage pollution; the proxy pins content-type so
  // no XSS, but the bytes should match the declared type).
  if (sniffImageMime(dataUrl) !== contentType) throw new GateError("Unsupported image format.");

  const ext = contentType.split("/")[1]!.replace("jpeg", "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from("photos")
    .upload(path, binary, { contentType, cacheControl: "31536000" });
  if (error) throw new GateError("Could not save the photo. Please try again.");
  return path;
}