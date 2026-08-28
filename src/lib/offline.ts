import { toast } from "sonner";

import { getLocale } from "@/i18n/locale";
import { ar, en } from "@/i18n/dict";

/**
 * Submits with offline tolerance: if the device is offline (or the request
 * fails on a dropped connection) the payload is queued and retried when the
 * browser reports it is back online, instead of failing silently.
 */
export async function submitResilient<T>(run: () => Promise<T>): Promise<T | "queued"> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    queue(run);
    return "queued";
  }
  try {
    return await run();
  } catch (error) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      queue(run);
      return "queued";
    }
    throw error;
  }
}

function toastText(path: "offlineQueued" | "offlineSent" | "offlineFailed"): string {
  const dict = getLocale() === "ar" ? ar : en;
  const bucket = dict.errors.toasts as Record<string, string>;
  return bucket[path] ?? path;
}

function queue(run: () => Promise<unknown>) {
  toast.info(toastText("offlineQueued"));
  const handler = () => {
    window.removeEventListener("online", handler);
    void run()
      .then(() => toast.success(toastText("offlineSent")))
      .catch(() => toast.error(toastText("offlineFailed")));
  };
  window.addEventListener("online", handler);
}
