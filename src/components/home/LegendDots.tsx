import { useI18n } from "@/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** The floating legend (top-right): one dot per layer kind, labels from sm up. */
export function LegendDots() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
      {(["trees", "care", "fires", "hotspots"] as const).map((key) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center gap-1.5">
              <span
                className={`size-2 rounded-full ${
                  key === "trees"
                    ? "bg-plant"
                    : key === "care"
                      ? "bg-care"
                      : key === "fires"
                        ? "bg-fire"
                        : "bg-amber-500"
                }`}
              />
              <span className="hidden sm:inline">{t(`home.layers.${key}`)}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t(`home.tooltip.layers.${key}`)}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
