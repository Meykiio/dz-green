import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/locale";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "ar", label: "عربي" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

/**
 * The locale dropdown (2026-09-01, replaces the cycle button): all three
 * languages one tap away, check on the current one. Closes on outside click
 * and Escape. `dropUp` opens the menu upward (sidebar footer, bottom edge).
 */
export function LocaleDropdown({
  dropUp = false,
  menuClassName,
}: {
  dropUp?: boolean;
  /** Extra classes for the menu panel (e.g. the collapsed-rail reposition). */
  menuClassName?: string;
}) {
  const { t, locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("chrome.aria.switchLocale")}
        className="tap-target inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Languages className="size-4" />
        <span className="staff-rail-hide hidden sm:inline">
          {LOCALES.find((l) => l.code === locale)?.label}
        </span>
        <ChevronDown className="staff-rail-hide size-3.5" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 w-36 rounded-xl border border-border bg-card p-1 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]",
            dropUp ? "bottom-full mb-2 end-0" : "end-0 top-full mt-2",
            menuClassName,
          )}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={locale === l.code}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                locale === l.code
                  ? "bg-accent font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {l.label}
              {locale === l.code && <Check className="size-4 text-plant" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
