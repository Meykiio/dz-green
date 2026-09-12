import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * The Canopy staff sidebar (plan D5): 280px expanding / 78px icon rail
 * (persisted), a sliding 3px active indicator on the inline-start edge
 * (ease-spring), labeled nav groups, theme + privacy + auth in the footer.
 * Off-canvas navigation below lg is the existing top-bar drawer. Fully
 * RTL-mirrored: logical properties only, hover nudge flips with dir.
 */
export function StaffSidebar({
  groups,
  hasAnnouncement,
  brandName,
  themeButton,
  privacyButton,
  authAction,
}: {
  groups: { key: string; label: string; rows: ReactNode[] }[];
  hasAnnouncement: boolean;
  brandName: string;
  themeButton: ReactNode;
  privacyButton: ReactNode;
  authAction: ReactNode;
}) {
  const { t, isRtl } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem("ga-staff-nav") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("staff-nav-collapsed", collapsed);
    return () => document.documentElement.classList.remove("staff-nav-collapsed");
  }, [collapsed]);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem("ga-staff-nav", next ? "1" : "0");
      } catch {
        /* storage blocked */
      }
      return next;
    });

  // Sliding active indicator: measured from the [data-active] row.
  const navRef = useRef<HTMLElement>(null);
  const [ind, setInd] = useState<{ top: number; height: number; on: boolean }>({
    top: 0,
    height: 0,
    on: false,
  });
  const measure = useCallback(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (!el) {
      setInd((i) => (i.on ? { ...i, on: false } : i));
      return;
    }
    setInd({ top: el.offsetTop, height: el.offsetHeight, on: true });
  }, []);
  useLayoutEffect(measure, [measure, pathname, isRtl, collapsed, groups]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const visible = groups.filter((g) => g.rows.length > 0);

  return (
    <aside
      data-collapsed={collapsed}
      style={{ width: "var(--staff-w)" }}
      className="fixed inset-y-0 start-0 z-30 hidden w-[var(--staff-w)] flex-col border-e border-sidebar-border bg-sidebar transition-[width] duration-[450ms] ease-[var(--ease-out)] lg:flex"
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 pb-2",
          hasAnnouncement ? "pt-[5.75rem]" : "pt-14",
        )}
      >
        <img src="/logo.png" alt="" className="size-5 shrink-0" />
        <span className="staff-row-label text-sm font-semibold tracking-tight">{brandName}</span>
      </div>

      <nav
        ref={navRef}
        aria-label={t("chrome.aria.sections")}
        className="relative flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]"
      >
        <div
          aria-hidden
          style={{ top: ind.top, height: ind.height, opacity: ind.on ? 1 : 0 }}
          className="absolute start-0 z-10 w-[3px] rounded-e-full bg-primary transition-[top,height,opacity] duration-500 ease-[var(--ease-spring)]"
        />
        {visible.map((g) => (
          <div key={g.key} className="pt-4 first:pt-1">
            <p className="staff-group-label px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {g.label}
            </p>
            <div className="space-y-0.5">{g.rows}</div>
          </div>
        ))}
      </nav>

      <div className={cn("flex items-center gap-1 border-t border-sidebar-border px-3 py-3", collapsed && "flex-col")}>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? t("chrome.aria.expandNav") : t("chrome.aria.collapseNav")}
          aria-expanded={!collapsed}
          className="tap-target grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
        {themeButton}
        {privacyButton}
      </div>
      <div className={cn("border-t border-sidebar-border px-3 py-3", collapsed && "flex justify-center")}>
        {authAction}
      </div>
    </aside>
  );
}
