import { CalendarCheck, CalendarClock, Sun } from "lucide-react";

import { useHydrated } from "@/hooks/useHydrated";
import { useI18n } from "@/i18n";
import { plantingSeason } from "@/lib/planting-season";

const ICON = { now: CalendarCheck, soon: CalendarClock, off: Sun };
const TONE = {
  now: "border-plant/40 bg-plant/10",
  soon: "border-border bg-card",
  off: "border-fire/30 bg-fire/5",
};

/**
 * Where we are in the planting calendar, shown on Where to plant and on the
 * planting form. Rendered after hydration only: the month comes from the
 * visitor's clock, which the server cannot know.
 */
export function PlantingSeasonNote({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const season = plantingSeason();
  const Icon = ICON[season];
  return (
    <p className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${TONE[season]} ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{t(`forms.season.${season}`)}</span>
    </p>
  );
}
