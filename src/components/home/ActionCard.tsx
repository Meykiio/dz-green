import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Droplets, Flame, Satellite, Sprout, TrendingUp, X } from "lucide-react";

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
 * The home action card, redesigned to Canopy (2026-09-12): one primary CTA
 * (Von Restorff — the only emphasized element), a four-number stat strip
 * (Stripe discipline: number + tiny label, nothing competing), and the five
 * layer toggles in one scrollable row with "How it works" at the serial-end.
 * Hidden by default on phones — the pulsing reveal button brings it back.
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
  const { t, isRtl } = useI18n();

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

        <h1 className={`display-hero pe-6 text-xl md:text-2xl ${isRtl ? "max-w-none" : "max-w-[18ch]"}`}>
          {t("home.hero.title")}
        </h1>

        {/* Stat strip: number + tiny label, four across. */}
        <dl className="mt-3 grid grid-cols-4 gap-2 border-y border-border py-2.5">
          <MiniStat value={stats.trees} label={t("home.stats.trees")} />
          <MiniStat value={stats.wilayas} label={t("home.stats.wilayas")} />
          <MiniStat value={stats.thirsty} label={t("home.stats.needWater")} tone="text-care" />
          <MiniStat value={stats.fires} label={t("home.stats.activeFires")} tone="text-fire" />
        </dl>

        <div className="mt-3 flex flex-col gap-2">
          <Link
            to="/plant"
            className="tap-target flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground transition-[transform,box-shadow,background-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:scale-[0.96]"
          >
            <Sprout className="size-5" /> {t("home.cta.plant")}
          </Link>
          <div className="flex gap-2">
            <Link
              to="/care"
              className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-4 py-2.5 text-sm font-semibold text-care transition-transform active:scale-[0.98]"
            >
              <Droplets className="size-4" /> {t("home.cta.care")}
            </Link>
            <Link
              to="/fire"
              className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-4 py-2.5 text-sm font-semibold text-fire transition-transform active:scale-[0.98]"
            >
              <Flame className="size-4" /> {t("home.cta.fire")}
            </Link>
          </div>
        </div>

        {/* Layer toggles + how-it-works: one scrollable row, no ragged wrap. */}
        <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto">
          <Chip active={layers.trees} tone="plant" icon={<Sprout className="size-4" />} label={t("home.layers.trees")} onClick={() => onToggleLayer("trees")} />
          <Chip active={layers.care} tone="care" icon={<Droplets className="size-4" />} label={t("home.layers.care")} onClick={() => onToggleLayer("care")} />
          <Chip active={layers.fires} tone="fire" icon={<Flame className="size-4" />} label={t("home.layers.fires")} onClick={() => onToggleLayer("fires")} />
          <Chip active={layers.hotspots} tone="hotspot" icon={<Satellite className="size-4" />} label={t("home.layers.hotspots")} onClick={() => onToggleLayer("hotspots")} />
          <Chip active={layers.risk} tone="risk" icon={<TrendingUp className="size-4" />} label={t("home.layers.risk")} onClick={() => onToggleLayer("risk")} />
          <Link
            to="/about"
            className="tap-target ms-1 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("home.hero.howItWorks")}
            {isRtl ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label, tone }: { value: number; label: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <dd className={`text-lg font-bold tabular-nums leading-6 ${tone ?? ""}`}>{value}</dd>
      <dt className="truncate text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
    </div>
  );
}
