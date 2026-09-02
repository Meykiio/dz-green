import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Droplets, Flame, Satellite, Sprout, X } from "lucide-react";

import { Chip } from "@/components/home/HomeBits";
import { useI18n } from "@/i18n";
import type { Layer } from "@/components/map/HeroMap";

export interface HomeStats {
  trees: number;
  wilayas: number;
  thirsty: number;
  fires: number;
}

/**
 * The home action card (extracted from the home route, 2026-09-01): hero
 * copy, live stats, the three CTAs, and the layer chips. Hidden by default
 * on phones — the pulsing reveal button brings it back.
 */
export function ActionCard({
  hidden,
  onToggle,
  stats,
  layers,
  onToggleLayer,
}: {
  hidden: boolean;
  onToggle: (hidden: boolean) => void;
  stats: HomeStats;
  layers: Record<Layer, boolean>;
  onToggleLayer: (layer: Layer) => void;
}) {
  const { t, count, isRtl } = useI18n();

  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => onToggle(false)}
        aria-label={t("home.aria.showCard")}
        className="tap-target absolute bottom-3 start-3 grid size-12 place-items-center rounded-full border border-border bg-card/95 text-plant shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur transition-transform active:scale-[0.96] md:bottom-6 md:start-6"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-ping rounded-full border-2 border-plant/60 [animation-duration:2s] motion-reduce:animate-none"
        />
        <Sprout className="size-5" />
      </button>
    );
  }

  return (
    <div className="absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-6 md:start-6 md:w-88">
      <div className="relative rounded-2xl border border-border bg-card/95 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur md:p-5">
        <button
          type="button"
          onClick={() => onToggle(true)}
          aria-label={t("home.aria.hideCard")}
          className="tap-target absolute end-3 top-3 grid place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <h1 className={`display-hero text-xl md:text-2xl ${isRtl ? "max-w-none" : "max-w-[16ch]"}`}>
          {t("home.hero.title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{count(stats.trees, "tree")}</span>
          {" · "}
          <span className="font-semibold tabular-nums text-foreground">{count(stats.wilayas, "wilaya")}</span>
          {" · "}
          <span className="font-semibold tabular-nums text-care">{count(stats.thirsty, "treeNeed")}</span>
          {" · "}
          <span className="font-semibold tabular-nums text-fire">{count(stats.fires, "activeFire")}</span>
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            to="/plant"
            className="tap-target flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Sprout className="size-5" /> {t("home.cta.plant")}
          </Link>
          <div className="flex gap-2">
            <Link
              to="/care"
              className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold text-care transition-transform active:scale-[0.98]"
            >
              <Droplets className="size-4" /> {t("home.cta.care")}
            </Link>
            <Link
              to="/fire"
              className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold text-fire transition-transform active:scale-[0.98]"
            >
              <Flame className="size-4" /> {t("home.cta.fire")}
            </Link>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip active={layers.trees} tone="plant" icon={<Sprout className="size-4" />} label={t("home.layers.trees")} onClick={() => onToggleLayer("trees")} />
            <Chip active={layers.care} tone="care" icon={<Droplets className="size-4" />} label={t("home.layers.care")} onClick={() => onToggleLayer("care")} />
            <Chip active={layers.fires} tone="fire" icon={<Flame className="size-4" />} label={t("home.layers.fires")} onClick={() => onToggleLayer("fires")} />
            <Chip active={layers.hotspots} tone="hotspot" icon={<Satellite className="size-4" />} label={t("home.layers.hotspots")} onClick={() => onToggleLayer("hotspots")} />
          </div>
          <Link
            to="/about"
            className="tap-target inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("home.hero.howItWorks")}{" "}
            {isRtl ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
          </Link>
        </div>
      </div>
    </div>
  );
}
