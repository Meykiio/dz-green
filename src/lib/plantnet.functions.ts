import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { identifyPlant } from "@/lib/plantnet.server";
import { throttle } from "@/lib/submissions.server";

/**
 * Species suggestion from a planting photo (PlantNet). Throttled per IP
 * (20/hour): the free tier is 500 identifications/day for the whole site,
 * so one client must not be able to burn it. Over the limit fails soft to
 * null, same as a PlantNet error.
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
      await throttle("identify", 20);
      return await identifyPlant(data.image, data.locale);
    } catch (error) {
      console.error("[plantnet] identify failed:", error);
      return null;
    }
  });
