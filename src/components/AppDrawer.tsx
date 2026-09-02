import { X } from "lucide-react";
import type { ReactNode } from "react";

import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * The navigation drawer (extracted from AppShell, 2026-09-01): brand header,
 * nav rows, theme + auth actions. Starts below the announcement strip when
 * one is live, so the brand is never covered.
 */
export function AppDrawer({
  open,
  onClose,
  hasAnnouncement,
  brandName,
  rows,
  themeButton,
  authAction,
}: {
  open: boolean;
  onClose: () => void;
  hasAnnouncement: boolean;
  brandName: string;
  rows: ReactNode[];
  themeButton: ReactNode;
  authAction: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed start-0 z-50 flex w-72 flex-col border-e border-border bg-card transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          hasAnnouncement ? "top-9 bottom-0" : "inset-y-0",
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        )}
        aria-label={t("chrome.aria.menu")}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="size-5" />
            <span className="text-base font-semibold tracking-tight">{brandName}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("chrome.aria.closeMenu")}
            className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label={t("chrome.aria.main")} className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {rows}
        </nav>
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          {themeButton}
          {authAction}
        </div>
      </aside>
    </>
  );
}
