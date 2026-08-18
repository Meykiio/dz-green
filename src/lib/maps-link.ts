/**
 * Google Maps link helpers.
 *
 * Outbound: `directionsUrl` builds the official cross-platform directions URL
 * (developers.google.com/maps/documentation/urls).
 *
 * Inbound: `parseGoogleMapsLink` extracts coordinates from the link formats
 * people actually paste from the app: `@lat,lng` centers, `!3d…!4d…` place
 * data segments, and `q|query|ll|center|destination|origin=lat,lng` params.
 * Short links (goo.gl / maps.app.goo.gl) carry no coordinates — those go
 * through the `resolveMapsLink` server function, which follows the redirect.
 */

export interface ParsedPoint {
  lat: number;
  lng: number;
}

const LAT = "(-?\\d{1,2}(?:\\.\\d+)?)";
const LNG = "(-?\\d{1,3}(?:\\.\\d+)?)";

function toPoint(m: RegExpMatchArray): ParsedPoint | null {
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function parseGoogleMapsLink(input: string): ParsedPoint | null {
  const s = input.trim();
  if (!s) return null;

  // Place data segment first: !3d!4d is the actual place, while @ is only
  // the viewport center.
  let m = s.match(new RegExp(`!3d${LAT}!4d${LNG}`));
  if (m) return toPoint(m);

  m = s.match(new RegExp(`@${LAT},${LNG}`));
  if (m) return toPoint(m);

  m = s.match(
    new RegExp(`[?&](?:q|query|ll|center|destination|origin)=${LAT}[,%2C]+${LNG}`, "i"),
  );
  if (m) return toPoint(m);

  return null;
}

/** True when the link is a short URL that needs server-side redirect resolution. */
export function isShortMapsLink(input: string): boolean {
  return /(goo\.gl\/maps|maps\.app\.goo\.gl)\//i.test(input.trim());
}

/** Official cross-platform directions URL (no API key needed). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
