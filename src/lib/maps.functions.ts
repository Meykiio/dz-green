import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { parseGoogleMapsLink, type ParsedPoint } from "./maps-link";

/**
 * Resolves short Google Maps links (goo.gl / maps.app.goo.gl) by following
 * the redirect server-side and parsing coordinates out of the final URL (or
 * failing that, the returned HTML). Long links never reach this — the client
 * parses those itself.
 */
export const resolveMapsLink = createServerFn({ method: "POST" })
  .validator(z.object({ url: z.string().url().max(500) }))
  .handler(async ({ data }): Promise<ParsedPoint | null> => {
    const res = await fetch(data.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "GreenAlgeria/1.0 (+https://github.com/notsifeddine/dz-green)" },
    });
    const fromUrl = parseGoogleMapsLink(res.url);
    if (fromUrl) return fromUrl;
    const html = await res.text();
    return parseGoogleMapsLink(html);
  });
