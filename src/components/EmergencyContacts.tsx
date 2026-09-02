import { Phone, X } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/i18n";

const EMERGENCY = [
  { key: "protection", number: "14" },
  { key: "protection", number: "1021" },
  { key: "police", number: "17" },
  { key: "gendarmerie", number: "1055" },
  { key: "samu", number: "16" },
] as const;

/**
 * Emergency contacts for Algeria — a compact SOS pill that expands in place.
 * Lives in the top bar so it never covers the map, on any viewport.
 */
export function EmergencyContacts() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("chrome.emergency.label")}
        className="tap-target inline-flex items-center gap-1.5 rounded-full border border-fire/40 bg-card px-3 py-1.5 text-sm font-semibold text-fire transition-transform active:scale-[0.97]"
      >
        <Phone className="size-3.5" />
        <span className="hidden sm:inline">{t("chrome.emergency.sosFull")}</span>
        <span className="sm:hidden">{t("chrome.emergency.sosShort")}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          {/* Mobile: fixed card inset from both screen edges (can't overflow).
              sm+: anchored popover under the trigger. */}
          <div className="fixed inset-x-3 top-16 z-50 rounded-xl border border-fire/30 bg-card p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-64">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-fire">{t("chrome.emergency.heading")}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("chrome.emergency.close")}
                className="tap-target grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {EMERGENCY.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.number}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-fire transition-colors hover:bg-fire/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-3.5" /> {t(`chrome.emergency.${c.key}`)}
                  </span>
                  <span className="font-semibold tabular-nums">{c.number}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

