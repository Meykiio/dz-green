import { Check, Globe } from "lucide-react";
import { useState } from "react";

import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Language switcher — a compact globe button that expands in place, matching
 * the top bar's other controls (EmergencyContacts). Changing the language is
 * instant: no page reload. The choice is persisted in a cookie by setLocale,
 * so the server renders the right language and direction on the next visit.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.lang.label}
        className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
      >
        <Globe className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute end-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-card p-1.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]"
          >
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={code === locale}
                onClick={() => choose(code)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                  code === locale
                    ? "bg-accent font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span>{LOCALE_LABELS[code]}</span>
                {code === locale && <Check className="size-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
