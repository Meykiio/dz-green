import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SectionTab<K extends string> {
  id: K;
  label: string;
  icon: LucideIcon;
  count?: number;
}

/**
 * Shared segmented tab bar for staff pages (moderate, admin): icons + counts
 * always visible, labels from sm up. Never overflows a 390px viewport —
 * no arrows, no scroll traps.
 */
export function SectionTabs<K extends string>({
  tabs,
  active,
  onSelect,
  ariaLabel,
}: {
  tabs: SectionTab<K>[];
  active: K;
  onSelect: (id: K) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex max-w-full gap-1 rounded-full border border-border bg-card p-1"
    >
      {tabs.map(({ id, label, icon: Icon, count }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            onClick={() => onSelect(id)}
            className={cn(
              "tap-target inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] sm:px-4",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums",
                  isActive ? "bg-black/15 text-inherit" : "bg-secondary text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
