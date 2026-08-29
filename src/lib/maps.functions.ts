import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isAllowedMapsHost, isIpLiteralHost, parseGoogleMapsLink, type ParsedPoint } from "./maps-link";

/**
 * Resolves short Google Maps links (goo.gl / maps.app.goo.gl) by following
 * the redirect server-side and parsing coordinates out of the final URL (or
 * failing that, the returned HTML). Long links never reach this — the client
 * parses those itself.
 *
 * SSRF hardening (audit 2026-08-28): the join URL and every redirect hop MUST
 * stay on the allowlisted Google hosts; IP-literal and private targets are
 * rejected before any fetch, and redirects are followed manually with hops
 * re-validated.
 */
export const resolveMapsLink = createServerFn({ method: "POST" })
  .validator(z.object({ url: z.string().url().max(500) }))
  .handler(async ({ data }): Promise<ParsedPoint | null> => {
    if (!isAllowedMapsHost(data.url) || isIpLiteralHost(data.url)) {
      throw new Error("That link isn't a Google Maps link we can resolve.");
    }

    let current = data.url;
    for (let hop = 0; hop < 5; hop++) {
      const res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "user-agent": "GreenAlgeria/1.0 (+https://github.com/notsifeddine/dz-green)" },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) throw new Error("Short link redirected and stopped.");
        const next = new URL(location, current).href;
        if (!isAllowedMapsHost(next) || isIpLiteralHost(next)) {
          throw new Error("Short link tried to leave Google Maps.");
        }
        current = next;
        continue;
      }

      const fromUrl = parseGoogleMapsLink(current);
      if (fromUrl) return fromUrl;
      const html = await res.text();
      return parseGoogleMapsLink(html);
    }
    throw new Error("Too many redirects.");
  });
