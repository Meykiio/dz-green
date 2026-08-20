import { Flame, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export type Section = "queue" | "fires";

const SECTIONS: { id: Section; label: string; icon: typeof Sprout }[] = [
  { id: "queue", label: "Pending plantings", icon: Sprout },
  { id: "fires", label: "Fire reports", icon: Flame },
];

interface Props {
  section: Section;
  onSelect: (s: Section) => void;
  counts: Record<Section, number>;
}

/** Section switcher for the moderation dashboard — segmented tabs, no second sidebar. */
export function ModTabs({ section, onSelect, counts }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Moderation sections"
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const active = section === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(id)}
            className={cn(
              "tap-target inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
            <span
              className={cn(
                "min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums",
                active ? "bg-black/15 text-inherit" : "bg-secondary text-muted-foreground",
              )}
            >
              {counts[id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
