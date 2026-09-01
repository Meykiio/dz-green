import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { fetchDailyRainMm, fetchFireWeather } from "@/lib/weather.server";

/** On-demand fire weather for a detail panel (fire report or hotspot). */
export const getFireWeather = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        lat: z.number().min(18).max(39),
        lng: z.number().min(-10).max(13),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      return await fetchFireWeather(data.lat, data.lng);
    } catch (error) {
      console.error("[weather] fetch failed:", error);
      return null; // the panel just hides the block — never breaks the page
    }
  });

/**
 * 14-day rainfall totals for thirsty-candidate sites (rain-aware watering).
 * One batched request; on failure returns null — the badge falls back to the
 * time-only rule rather than lying.
 */
export const getRainFallback = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z
      .object({
        sites: z
          .array(
            z.object({
              id: z.string().uuid(),
              lat: z.number().min(18).max(39),
              lng: z.number().min(-10).max(13),
            }),
          )
          .max(100),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<Record<string, number> | null> => {
    try {
      const totals = await fetchDailyRainMm(data.sites);
      const out: Record<string, number> = {};
      data.sites.forEach((s, i) => {
        out[s.id] = totals[i] ?? 0;
      });
      return out;
    } catch (error) {
      console.error("[weather] rain fallback failed:", error);
      return null;
    }
  });
