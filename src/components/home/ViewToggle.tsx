import { List, Map as MapIcon, Trophy } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/i18n";

export type HomeView = "map" | "list" | "board";

const OPTIONS: { value: HomeView; key: "map" | "list" | "board"; icon: typeof MapIcon }[] = [
  { value: "map", key: "map", icon: MapIcon },
  { value: "list", key: "list", icon: List },
  { value: "board", key: "board", icon: Trophy },
];

/** Map / List / Leaderboard switch — floats top-right over the home view. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: HomeView;
  onChange: (view: HomeView) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex rounded-full border border-border bg-card/90 p-0.5 text-xs font-medium backdrop-blur">
      {OPTIONS.map(({ value, key, icon: Icon }) => {
        const label = t(`home.views.${key}`);
        return (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onChange(value)}
                aria-pressed={view === value}
                aria-label={value === "board" ? t("home.aria.board") : t(`home.aria.${key}`)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
                  view === value ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            </TooltipTrigger>
            {value === "board" && <TooltipContent>{t("home.tooltip.board")}</TooltipContent>}
          </Tooltip>
        );
      })}
    </div>
  );
}
