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

export async function subscribePushImpl(data: PushSubscriptionInput) {
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
    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, keys, wilaya_code");
    if (error) throw error;
    const targets = (subs ?? []).filter((s) => shouldNotify(s.wilaya_code, fire.wilaya_code));
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
          { TTL: 86400, urgency: "high", topic: `fire-${fire.wilaya_code}` },
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
