import { createFileRoute } from "@tanstack/react-router";

/**
 * Public read-only satellite hotspot feed (NASA FIRMS, server-side fetch so
 * the map key stays secret). Edge-cached 10 min — FIRMS NRT updates a few
 * times a day over Algeria, and the key quota is per-10-min anyway.
 * Failure returns 502 with no-store: clients keep their last good data.
 */
export const Route = createFileRoute("/api/public/hotspots")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { fetchHotspots } = await import("@/lib/hotspots.server");
          const data = await fetchHotspots();
          return new Response(JSON.stringify(data), {
            headers: {
              "content-type": "application/geo+json; charset=utf-8",
              "cache-control": "public, s-maxage=600, stale-while-revalidate=1800",
            },
          });
        } catch (error) {
          console.error("[hotspots] fetch failed:", error);
          return new Response(
            JSON.stringify({ type: "FeatureCollection", features: [] }),
            {
              status: 502,
              headers: {
                "content-type": "application/geo+json; charset=utf-8",
                "cache-control": "no-store",
              },
            },
          );
        }
      },
    },
  },
});
