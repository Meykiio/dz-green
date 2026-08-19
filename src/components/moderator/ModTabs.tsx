import { Bell, Flame, Sprout } from "lucide-react";

import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export type Section = "queue" | "fires" | "contacts";

const SECTIONS: {
  id: Section;
  labelKey: "sectionQueue" | "sectionFires" | "sectionContacts";
  icon: typeof Sprout;
}[] = [
  { id: "queue", labelKey: "sectionQueue", icon: Sprout },
  { id: "fires", labelKey: "sectionFires", icon: Flame },
  { id: "contacts", labelKey: "sectionContacts", icon: Bell },
];

interface Props {
  section: Section;
  onSelect: (s: Section) => void;
  counts: Record<Section, number>;
}

/** Section switcher for the moderation dashboard — segmented tabs, no second sidebar. */
export function ModTabs({ section, onSelect, counts }: Props) {
  const { t } = useI18n();
  return (
    <div
      role="tablist"
      aria-label={t.staff.moderate.sectionsAria}
      className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1"
    >
      {SECTIONS.map(({ id, labelKey, icon: Icon }) => {
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
            <span className="hidden sm:inline">{t.staff.moderate[labelKey]}</span>
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
