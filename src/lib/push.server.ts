import webpush from "web-push";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { WILAYAS, mapCodeFor } from "@/lib/wilayas";

/**
 * Web Push fire alerts — server-only. Subscriptions live in
 * `public.push_subscriptions` (RLS on, zero client grants); sends go through
 * the web-push library with the VAPID pair from env. A push failure must
 * never break a fire submission — every public function here is total.
 */

let vapidReady = false;

function ensureVapid(): void {
  if (vapidReady) return;
  const publicKey = process.env["VITE_VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"];
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID env is incomplete (see .env.example).");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  wilaya_code?: string | null | undefined;
}

/**
 * Real browser push services only. Before this check any URL was accepted,
 * so a caller could register thousands of arbitrary hosts and make every
 * fire report POST to them (blind SSRF, and slow hosts stalled the fire
 * submission). Chrome/Edge-Chromium/Opera/Samsung use FCM, Firefox uses
 * Mozilla autopush, Safari uses Apple, legacy Edge uses WNS.
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/, /^[a-z0-9-]+\.push\.apple\.com$/, /^[a-z0-9-]+\.notify\.windows\.com$/];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && url.port === "" && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

/** Per-send timeout: a slow push service must not hold up a fire report. */
const SEND_TIMEOUT_MS = 5000;
/** Subscribers fetched and sent per batch (PostgREST caps unpaged selects). */
const BATCH = 500;

export async function subscribePushImpl(data: PushSubscriptionInput) {
  if (!isAllowedPushEndpoint(data.endpoint)) {
    throw new Error("Unsupported push service.");
  }
  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      endpoint: data.endpoint,
      keys: data.keys,
      wilaya_code: data.wilaya_code ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
  return { ok: true };
}

export async function unsubscribePushImpl(data: { endpoint: string }) {
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", data.endpoint);
  if (error) throw error;
  return { ok: true };
}

/**
 * Subscriber ↔ fire matching. Fires store the historic parent wilaya code;
 * a subscriber who picked a post-2019 wilaya resolves to the same parent
 * (mapCodeFor). null subscriber wilaya = all of Algeria.
 */
export function shouldNotify(subscriberWilaya: string | null, fireWilaya: string): boolean {
  if (!subscriberWilaya) return true;
  return mapCodeFor(subscriberWilaya) === fireWilaya;
}

function wilayaNameAr(code: string): string {
  return WILAYAS.find((w) => w.code === code)?.nameAr ?? code;
}

/** Fan-out after a fire insert. Total by design: catches everything, logs. */
export async function notifyFireSubscribers(fire: { id: string; wilaya_code: string }): Promise<void> {
  try {
    ensureVapid();
    const subs: { endpoint: string; keys: unknown; wilaya_code: string | null }[] = [];
    for (let from = 0; ; from += BATCH) {
      const { data, error } = await supabaseAdmin
        .from("push_subscriptions")
        .select("endpoint, keys, wilaya_code")
        .order("endpoint")
        .range(from, from + BATCH - 1);
      if (error) throw error;
      subs.push(...(data ?? []));
      if (!data || data.length < BATCH) break;
    }
    const targets = subs.filter(
      (s) => shouldNotify(s.wilaya_code, fire.wilaya_code) && isAllowedPushEndpoint(s.endpoint),
    );
    if (targets.length === 0) return;

    const payload = JSON.stringify({
      title: `🔥 حريق جديد في ${wilayaNameAr(fire.wilaya_code)}`,
      body: "بلاغ جديد على خريطة الجزائر الخضراء — اضغط للعرض",
      data: { url: "/" },
    });

    const results = await Promise.allSettled(
      targets.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys as { p256dh: string; auth: string } },
          payload,
          { TTL: 86400, urgency: "high", topic: `fire-${fire.wilaya_code}`, timeout: SEND_TIMEOUT_MS },
        ),
      ),
    );

    const stale: string[] = [];
    let sent = 0;
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        sent += 1;
        return;
      }
      const statusCode = (r.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) stale.push(targets[i]!.endpoint);
      else console.error("[push] send failed:", r.reason);
    });
    if (stale.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", stale);
    }
    console.log(`[push] fire ${fire.id}: ${sent}/${targets.length} sent, ${stale.length} pruned`);
  } catch (error) {
    console.error("[push] notifyFireSubscribers failed (submission unaffected):", error);
  }
}
