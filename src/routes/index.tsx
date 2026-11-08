import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ActionCard } from "@/components/home/ActionCard";
import { ActivityTicker } from "@/components/home/ActivityTicker";
import { Leaderboard } from "@/components/home/Leaderboard";
import { useMapRealtime } from "@/components/home/useMapRealtime";
import { ViewToggle, type HomeView } from "@/components/home/ViewToggle";
import { DetailPanel } from "@/components/map/DetailPanel";
import { HeroMap, type Layer } from "@/components/map/HeroMap";
import { SiteList } from "@/components/map/SiteList";
import { ssrT, useI18n } from "@/i18n";
import { announcementQuery, careLogsQuery, fireReportsQuery, hotspotsQuery, rainFallbackQuery, riskMapQuery, sitesQuery } from "@/lib/data";
import { EMPTY_RISK } from "@/lib/risk";
import { RiskLegend } from "@/components/home/RiskLegend";
import { needsWater, type MapFeature, type Site } from "@/lib/types";
import { useHydrated } from "@/hooks/useHydrated";
import { isDataLight, useDataLight, usePageVisible } from "@/hooks/useConnection";

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
  // Data-light visitors get hotspots once per visit, not every 10 minutes.
  const hotspots = useQuery({ ...hotspotsQuery, refetchInterval: () => (isDataLight() ? false : 600_000) });
  const announcements = useQuery(announcementQuery).data ?? [];
  const hasAnnouncement = useHydrated() && announcements.length > 0;

  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    trees: true,
    care: true,
    fires: true,
    hotspots: true,
    risk: false,
  });
  // Loaded once, on demand: most visitors never turn the risk layer on.
  const riskMap = useQuery({ ...riskMapQuery, enabled: layers.risk });
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
  // Memoized: a fresh array every render rebuilt both map sources each time.
  const fireList = useMemo(() => (fires.data ?? []).filter((f) => f.status === "active"), [fires.data]);

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
  const dataLight = useDataLight();
  const pageVisible = usePageVisible();
  useMapRealtime(sitesRef, (text) => setTicker({ id: Date.now(), text }), pageVisible && !dataLight);

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
          <div className="h-full overflow-y-auto bg-background px-3 pb-3 pt-20 md:px-6 md:pb-6 md:pt-20">
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
          <div className="h-full overflow-y-auto bg-background px-3 pb-3 pt-20 md:px-6 md:pb-6 md:pt-20">
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
            risk={riskMap.data ?? EMPTY_RISK}
            layers={layers}
            onSelectFeature={setFeature}
          />
        )}

        {/* View toggle, centered — top corners stay free for the map. */}
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === "map" && <ActivityTicker message={ticker} />}
        {dataLight && (
          <p className="absolute inset-x-0 top-16 z-10 mx-auto w-fit max-w-[90vw] rounded-full border border-border bg-card/95 px-3 py-1.5 text-center text-xs text-muted-foreground">
            {t("home.dataLight")}
          </p>
        )}
        {view === "map" && layers.risk && <RiskLegend status={riskMap.status} />}

        {/* The action card — map view only: in list/board it would float
            over the scrolled content at narrow desktop widths. */}
        {view === "map" && (
          <ActionCard
            hidden={cardHidden}
            onToggle={setCardHidden}
            stats={stats}
            layers={layers}
            onToggleLayer={(layer) => setLayers((l) => ({ ...l, [layer]: !l[layer] }))}
          />
        )}
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
