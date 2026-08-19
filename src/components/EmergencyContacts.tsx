import { Phone, X } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/i18n";

const EMERGENCY = [
  { label: "Protection Civile", number: "14" },
  { label: "Protection Civile", number: "1021" },
  { label: "Police", number: "17" },
  { label: "Gendarmerie Nationale", number: "1055" },
  { label: "SAMU", number: "16" },
];

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
        aria-label={t.emergency.open}
        className="tap-target inline-flex items-center gap-1.5 rounded-full border border-fire/40 bg-card px-3 py-1.5 text-sm font-semibold text-fire transition-transform active:scale-[0.97]"
      >
        <Phone className="size-3.5" />
        <span className="hidden sm:inline">SOS · 14</span>
        <span className="sm:hidden">SOS</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute end-0 top-full z-50 mt-2 w-64 rounded-xl border border-fire/30 bg-card p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-fire">{t.emergency.heading}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.emergency.close}
                className="tap-target grid place-items-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {EMERGENCY.map((c) => (
                <a
                  key={c.number}
                  href={`tel:${c.number}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-fire transition-colors hover:bg-fire/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-3.5" /> {c.label}
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
