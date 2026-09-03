import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { identifyPlant } from "@/lib/plantnet.server";

/**
 * Species suggestion from a planting photo (PlantNet). Unthrottled in v1 by
 * design: worst case is quota burn (500/day free tier) which fails soft to
 * null — no data, no cost. Revisit with a throttle if it ever gets abused.
 */
export const suggestSpecies = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        image: z.string().startsWith("data:image/").max(1_400_000),
        // Three locales today (2026-09-02): "fr" was added by the French
        // pass but never here — every French identify fell through the gap
        // into the "couldn't identify" UI. PlantNet accepts all three
        // (live-verified: lang=fr returns the same results as en).
        locale: z.enum(["en", "ar", "fr"]).default("en"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      return await identifyPlant(data.image, data.locale);
    } catch (error) {
      console.error("[plantnet] identify failed:", error);
      return null;
    }
  });
