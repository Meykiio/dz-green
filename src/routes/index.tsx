import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Droplets,
  Flame,
  List,
  Map as MapIcon,
  Sprout,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Chip } from "@/components/home/HomeBits";
import { DetailPanel } from "@/components/map/DetailPanel";
import { HeroMap, type Layer } from "@/components/map/HeroMap";
import { SiteList } from "@/components/map/SiteList";
import { careLogsQuery, fireReportsQuery, sitesQuery } from "@/lib/data";
import { needsWater, type MapFeature } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const TITLE = "Green Algeria — the live map of Algeria's tree planting";
const DESCRIPTION =
  "See every tree planted across Algeria's 58 wilayas, log care for sites near you, and report wildfires on one community-run map.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
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
  const queryClient = useQueryClient();
  const sites = useQuery(sitesQuery);
  const careLogs = useQuery(careLogsQuery);
  const fires = useQuery(fireReportsQuery);

  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    trees: true,
    care: true,
    fires: true,
  });
  const [view, setView] = useState<"map" | "list">("map");
  const [feature, setFeature] = useState<MapFeature | null>(null);
  const [cardHidden, setCardHidden] = useState(false);

  // Live map: filtered channels only (approved plantings, all fire reports).
  useEffect(() => {
    const channel = supabase
      .channel("green-algeria-map")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sites", filter: "status=eq.approved" },
        () => void queryClient.invalidateQueries({ queryKey: ["sites"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "fire_reports" }, () =>
        queryClient.invalidateQueries({ queryKey: ["fire_reports"] }),
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "care_logs" }, () =>
        queryClient.invalidateQueries({ queryKey: ["care_logs"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const siteList = sites.data ?? [];
  const logList = careLogs.data ?? [];
  const fireList = fires.data ?? [];

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
        ) : sites.isLoading ? (
          <div className="h-full w-full animate-pulse bg-card" aria-label="Loading the map" />
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
              <span className="size-2 rounded-full bg-plant" /> Trees
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-care" /> Care
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-fire" /> Fires
            </span>
          </div>
          <div className="flex rounded-full border border-border bg-card/90 p-0.5 text-xs font-medium backdrop-blur">
            <button
              type="button"
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${view === "map" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            >
              <MapIcon className="size-3.5" /> Map
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${view === "list" ? "bg-accent text-foreground" : "text-muted-foreground"}`}
            >
              <List className="size-3.5" /> List
            </button>
          </div>
        </div>

        {/* The action card — compact, hideable for a clean map view. */}
        {cardHidden ? (
          <button
            type="button"
            onClick={() => setCardHidden(false)}
            aria-label="Show the action card"
            className="tap-target absolute bottom-3 start-3 grid size-12 place-items-center rounded-full border border-border bg-card/95 text-plant shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur transition-transform active:scale-[0.96] md:bottom-6 md:start-6"
          >
            <Sprout className="size-5" />
          </button>
        ) : (
          <div className="absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-6 md:start-6 md:w-88">
            <div className="relative rounded-2xl border border-border bg-card/95 p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur md:p-5">
              <button
                type="button"
                onClick={() => setCardHidden(true)}
                aria-label="Hide the action card"
                className="tap-target absolute end-3 top-3 grid place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
              <h1 className="display-hero max-w-[16ch] text-xl md:text-2xl">
                Every tree Algeria plants, on one living map.
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{stats.trees.toLocaleString()}</span> trees
                · <span className="font-semibold tabular-nums text-foreground">{stats.wilayas}</span> wilayas
                · <span className="font-semibold tabular-nums text-care">{stats.thirsty}</span> need water
                · <span className="font-semibold tabular-nums text-fire">{stats.fires}</span> active fires
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  to="/plant"
                  className="tap-target flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
                >
                  <Sprout className="size-5" /> I planted a tree
                </Link>
                <div className="flex gap-2">
                  <Link
                    to="/care"
                    className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold text-care transition-transform active:scale-[0.98]"
                  >
                    <Droplets className="size-4" /> Log care
                  </Link>
                  <Link
                    to="/fire"
                    className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-semibold text-fire transition-transform active:scale-[0.98]"
                  >
                    <Flame className="size-4" /> Report a fire
                  </Link>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                <div className="flex gap-1.5">
                  <Chip
                    active={layers.trees}
                    tone="plant"
                    icon={<Sprout className="size-4" />}
                    label="Trees"
                    onClick={() => setLayers((l) => ({ ...l, trees: !l.trees }))}
                  />
                  <Chip
                    active={layers.care}
                    tone="care"
                    icon={<Droplets className="size-4" />}
                    label="Care"
                    onClick={() => setLayers((l) => ({ ...l, care: !l.care }))}
                  />
                  <Chip
                    active={layers.fires}
                    tone="fire"
                    icon={<Flame className="size-4" />}
                    label="Fires"
                    onClick={() => setLayers((l) => ({ ...l, fires: !l.fires }))}
                  />
                </div>
                <Link
                  to="/about"
                  className="tap-target inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  How it works <ArrowRight className="size-3.5" />
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
