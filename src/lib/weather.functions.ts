import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { fetchFireWeather } from "@/lib/weather.server";

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
