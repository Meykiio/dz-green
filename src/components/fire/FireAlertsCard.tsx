import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { useI18n } from "@/i18n";
import { subscribePush, unsubscribePush } from "@/lib/push.functions";
import { WILAYAS } from "@/lib/wilayas";

type State = "loading" | "unsupported" | "denied" | "idle" | "busy" | "subscribed";

/** VAPID public key (url-safe base64) → the Uint8Array subscribe() wants. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Fire-alerts subscription card: enable/disable Web Push for fire reports,
 * optionally scoped to one wilaya (default: all of Algeria). Shown on /fire
 * under the form and on the success screen.
 */
export function FireAlertsCard() {
  const { t } = useI18n();
  const [state, setState] = useState<State>("loading");
  const [wilaya, setWilaya] = useState("");
  const [endpoint, setEndpoint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) {
          if (sub) {
            setEndpoint(sub.endpoint);
            setState("subscribed");
          } else {
            setState("idle");
          }
        }
      } catch {
        if (!cancelled) setState("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return;
      }
      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string,
        ),
      });
      const json = sub.toJSON();
      await subscribePush({
        data: {
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys!["p256dh"], auth: json.keys!["auth"] },
          wilaya_code: wilaya || null,
        },
      });
      setEndpoint(sub.endpoint);
      setState("subscribed");
    } catch (error) {
      console.error("[push] subscribe failed:", error);
      setState("idle");
    }
  };

  const disable = async () => {
    if (!endpoint) return;
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      await sub?.unsubscribe();
      await unsubscribePush({ data: { endpoint } });
    } catch (error) {
      console.error("[push] unsubscribe failed:", error);
    }
    setEndpoint(null);
    setState("idle");
  };

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="rounded-xl border border-fire/30 bg-fire/5 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fire/10 text-fire">
          <Bell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("forms.fireAlerts.title")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {state === "denied" ? t("forms.fireAlerts.denied") : t("forms.fireAlerts.body")}
          </p>
          {state !== "denied" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {state !== "subscribed" && (
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  aria-label={t("forms.fireAlerts.wilayaLabel")}
                  className="tap-target rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm"
                >
                  <option value="">{t("forms.fireAlerts.allWilayas")}</option>
                  {WILAYAS.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.nameAr}
                    </option>
                  ))}
                </select>
              )}
              {state === "subscribed" ? (
                <button
                  type="button"
                  onClick={disable}
                  className="tap-target inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-transform active:scale-[0.97]"
                >
                  <BellOff className="size-3.5" />
                  {t("forms.fireAlerts.disable")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enable}
                  disabled={state === "busy"}
                  className="tap-target inline-flex items-center gap-1.5 rounded-full bg-fire px-4 py-1.5 text-xs font-semibold text-white transition-transform active:scale-[0.97] disabled:opacity-60"
                >
                  <Bell className="size-3.5" />
                  {state === "busy" ? t("forms.fireAlerts.enabling") : t("forms.fireAlerts.enable")}
                </button>
              )}
            </div>
          )}
          {state === "subscribed" && (
            <p className="mt-2 text-xs font-medium text-fire">{t("forms.fireAlerts.on")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
