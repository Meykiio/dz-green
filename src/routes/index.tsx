import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Droplets, Flame, Sprout, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ActivityTicker } from "@/components/home/ActivityTicker";
import { Chip } from "@/components/home/HomeBits";
import { Leaderboard } from "@/components/home/Leaderboard";
import { useMapRealtime } from "@/components/home/useMapRealtime";
import { ViewToggle, type HomeView } from "@/components/home/ViewToggle";
import { DetailPanel } from "@/components/map/DetailPanel";
import { HeroMap, type Layer } from "@/components/map/HeroMap";
import { SiteList } from "@/components/map/SiteList";
import { ssrT, useI18n } from "@/i18n";
import { careLogsQuery, fireReportsQuery, sitesQuery } from "@/lib/data";
import { needsWater, type MapFeature, type Site } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: ssrT("meta.homeTitle") },
      { name: "description", content: ssrT("meta.homeDesc") },
      { property: "og:title", content: ssrT("meta.homeTitle") },
      { property: "og:description", content: ssrT("meta.homeDesc") },
      { property: "og:image", content: "/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og.png" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, count, isRtl } = useI18n();
  const sites = useQuery(sitesQuery);
  const careLogs = useQuery(careLogsQuery);
  const fires = useQuery(fireReportsQuery);

  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    trees: true,
    care: true,
    fires: true,
  });
  const [view, setView] = useState<HomeView>("map");
  const [feature, setFeature] = useState<MapFeature | null>(null);
  const [cardHidden, setCardHidden] = useState(false);
  const [ticker, setTicker] = useState<{ id: number; text: string } | null>(null);

  // Phones get the map first: the action card starts hidden under md and the
  // reveal button pulses until it's used. Runs pre-paint, so no flash.
  useLayoutEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setCardHidden(true);
  }, []);

  const siteList = sites.data ?? [];
  const logList = careLogs.data ?? [];
  const fireList = fires.data ?? [];

  // Live map subscription + anonymous activity ticker ("2 trees just planted
  // in Oran") fed by the same realtime events.
  const sitesRef = useRef<Site[]>([]);
  sitesRef.current = siteList;
  useMapRealtime(sitesRef, (text) => setTicker({ id: Date.now(), text }));

  useEffect(() => {
    if (!ticker) return;
    const timeout = setTimeout(() => setTicker(null), 6000);
    return () => clearTimeout(timeout);
  }, [ticker]);

  const stats = useMemo(
    () => ({
      trees: siteList.reduce((sum, s) => sum + s.tree_count, 0),
      wilayas: new Set(siteList.map((s) => s.wilaya_code)).size,
      thirsty: siteList.filter((s) => needsWater(s, logList)).length,
      fires: fireList.filter((f) => f.status === "active").length,
    }),
    [siteList, logList, fireList],
  );

  return (
    <AppShell>
      <div className="relative h-[calc(100dvh-3.5rem)] overflow-hidden">
        {view === "list" ? (
          <div className="h-full overflow-y-auto bg-background p-3 md:p-6">
            <div className="mx-auto max-w-2xl">
              <SiteList
                sites={siteList}
                careLogs={logList}
                fires={fireList}
                layers={layers}
                onSelectFeature={setFeature}
              />
            </div>
          </div>
        ) : view === "board" ? (
          <div className="h-full overflow-y-auto bg-background p-3 md:p-6">
            <div className="mx-auto max-w-2xl">
              <Leaderboard sites={siteList} />
            </div>
          </div>
        ) : sites.isLoading ? (
          <div className="h-full w-full animate-pulse bg-card" aria-label={t("chrome.browser.loadingMap")} />
        ) : (
          <HeroMap
            sites={siteList}
            careLogs={logList}
            fires={fireList}
            layers={layers}
            onSelectFeature={setFeature}
          />
        )}

        {/* Legend + view toggle, floating top-right */}
        <div className="absolute end-3 top-3 flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-plant" />{" "}
              <span className="hidden sm:inline">{t("home.layers.trees")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-care" />{" "}
              <span className="hidden sm:inline">{t("home.layers.care")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-fire" />{" "}
              <span className="hidden sm:inline">{t("home.layers.fires")}</span>
            </span>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === "map" && <ActivityTicker message={ticker} />}

        {/* The action card — compact, hideable for a clean map view. */}
        {cardHidden ? (
          <button
            type="button"
            onClick={() => setCardHidden(false)}
            aria-label={t("home.aria.showCard")}
            className="tap-target absolute bottom-3 start-3 grid size-12 place-items-center rounded-full border border-border bg-card/95 text-plant shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur transition-transform active:scale-[0.96] md:bottom-6 md:start-6"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 animate-ping rounded-full border-2 border-plant/60 [animation-duration:2s] motion-reduce:animate-none"
            />
            <Sprout className="size-5" />
          </button>
        ) : (
          <div className="absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-6 md:start-6 md:w-88">
            <div className="relative rounded-2xl border border-border bg-card/95 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur md:p-5">
              <button
                type="button"
                onClick={() => setCardHidden(true)}
                aria-label={t("home.aria.hideCard")}
                className="tap-target absolute end-3 top-3 grid place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
              <h1 className={`display-hero text-xl md:text-2xl ${isRtl ? "max-w-none" : "max-w-[16ch]"}`}>
                {t("home.hero.title")}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">
                  {count(stats.trees, "tree")}
                </span>
                {" · "}
                <span className="font-semibold tabular-nums text-foreground">
                  {count(stats.wilayas, "wilaya")}
                </span>
                {" · "}
                <span className="font-semibold tabular-nums text-care">
                  {count(stats.thirsty, "treeNeed")}
                </span>
                {" · "}
                <span className="font-semibold tabular-nums text-fire">
                  {count(stats.fires, "activeFire")}
                </span>
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
                <div className="flex gap-1.5">
                  <Chip
                    active={layers.trees}
                    tone="plant"
                    icon={<Sprout className="size-4" />}
                    label={t("home.layers.trees")}
                    onClick={() => setLayers((l) => ({ ...l, trees: !l.trees }))}
                  />
                  <Chip
                    active={layers.care}
                    tone="care"
                    icon={<Droplets className="size-4" />}
                    label={t("home.layers.care")}
                    onClick={() => setLayers((l) => ({ ...l, care: !l.care }))}
                  />
                  <Chip
                    active={layers.fires}
                    tone="fire"
                    icon={<Flame className="size-4" />}
                    label={t("home.layers.fires")}
                    onClick={() => setLayers((l) => ({ ...l, fires: !l.fires }))}
                  />
                </div>
                <Link
                  to="/about"
                  className="tap-target inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("home.hero.howItWorks")}{" "}
                  {isRtl ? (
                    <ArrowLeft className="size-3.5" />
                  ) : (
                    <ArrowRight className="size-3.5" />
                  )}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {feature && (
        <DetailPanel feature={feature} careLogs={logList} onClose={() => setFeature(null)} />
      )}
    </AppShell>
  );
}
