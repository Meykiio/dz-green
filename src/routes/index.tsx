import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ActionCard } from "@/components/home/ActionCard";
import { ActivityTicker } from "@/components/home/ActivityTicker";
import { Leaderboard } from "@/components/home/Leaderboard";
import { LegendDots } from "@/components/home/LegendDots";
import { useMapRealtime } from "@/components/home/useMapRealtime";
import { ViewToggle, type HomeView } from "@/components/home/ViewToggle";
import { DetailPanel } from "@/components/map/DetailPanel";
import { HeroMap, type Layer } from "@/components/map/HeroMap";
import { SiteList } from "@/components/map/SiteList";
import { ssrT, useI18n } from "@/i18n";
import { announcementQuery, careLogsQuery, fireReportsQuery, hotspotsQuery, rainFallbackQuery, sitesQuery } from "@/lib/data";
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
  const { t } = useI18n();
  const sites = useQuery(sitesQuery);
  const careLogs = useQuery(careLogsQuery);
  const fires = useQuery(fireReportsQuery);
  const hotspots = useQuery(hotspotsQuery);
  const hasAnnouncement = (useQuery(announcementQuery).data ?? []).length > 0;

  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    trees: true,
    care: true,
    fires: true,
    hotspots: true,
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
  // Public views show ACTIVE fires only (owner 2026-09-01): resolved and
  // false-alarm reports are hidden from the map and list; reopening one in
  // triage makes it active again, so it reappears. Triage keeps its own view.
  const fireList = (fires.data ?? []).filter((f) => f.status === "active");

  // Rain-aware watering: one batched 14-day-rainfall lookup for the sites
  // that are thirsty by the time-only rule; enough rain clears the flag.
  const rainCandidates = useMemo(
    () =>
      siteList
        .filter((s) => needsWater(s, logList))
        .slice(0, 100)
        .map((s) => ({ id: s.id, lat: s.lat, lng: s.lng })),
    [siteList, logList],
  );
  const rain = useQuery(rainFallbackQuery(rainCandidates));
  const rainById = rain.data ?? {};

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
      thirsty: siteList.filter((s) => needsWater(s, logList, rainById[s.id])).length,
      fires: fireList.filter((f) => f.status === "active").length,
    }),
    [siteList, logList, fireList, rainById],
  );

  return (
    <AppShell>
      <div
        className={`relative overflow-hidden ${hasAnnouncement ? "h-[calc(100dvh-5.75rem)]" : "h-[calc(100dvh-3.5rem)]"}`}
      >
        {view === "list" ? (
          <div className="h-full overflow-y-auto bg-background px-3 pb-3 pt-14 md:p-6">
            <div className="mx-auto max-w-2xl">
              <SiteList
                sites={siteList}
                careLogs={logList}
                fires={fireList}
                layers={layers}
                rainBySiteId={rainById}
                onSelectFeature={setFeature}
              />
            </div>
          </div>
        ) : view === "board" ? (
          <div className="h-full overflow-y-auto bg-background px-3 pb-3 pt-14 md:p-6">
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
            hotspots={hotspots.data ?? { type: "FeatureCollection", features: [] }}
            layers={layers}
            onSelectFeature={setFeature}
          />
        )}

        {/* Legend + view toggle, floating top-right */}
        <div className="absolute end-3 top-3 flex items-center gap-2">
          <LegendDots />
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === "map" && <ActivityTicker message={ticker} />}

        {/* The action card — compact, hideable for a clean map view. */}
        <ActionCard
          hidden={cardHidden}
          onToggle={setCardHidden}
          stats={stats}
          layers={layers}
          onToggleLayer={(layer) => setLayers((l) => ({ ...l, [layer]: !l[layer] }))}
        />
      </div>

      {feature && (
        <DetailPanel
          feature={feature}
          careLogs={logList}
          rainBySiteId={rainById}
          onClose={() => setFeature(null)}
        />
      )}
    </AppShell>
  );
}
