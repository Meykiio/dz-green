import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // SSR locale (2026-08-30): expose the visitor's saved locale to the
      // render pipeline so SSR text matches the client (React #418 fix).
      // Set per request, immediately before rendering.
      const cookie = request.headers.get("cookie");
      const match = cookie?.match(/(?:^|;\s*)ga-locale=(en|ar|fr)(?:;|$)/);
      (globalThis as { __GA_LOCALE_SSR__?: string }).__GA_LOCALE_SSR__ = match?.[1] ?? "ar";

      // Coarse geo hint (2026-09-01): Vercel's free IP-geolocation headers,
      // per request, never stored. SSR injects them as window.__GA_GEO__ so
      // forms can pre-select the wilaya / center the picker. Absent locally.
      const hintLat = request.headers.get("x-vercel-ip-latitude");
      const hintLng = request.headers.get("x-vercel-ip-longitude");
      const lat = hintLat == null ? NaN : Number(hintLat);
      const lng = hintLng == null ? NaN : Number(hintLng);
      (globalThis as { __GA_GEO_SSR__?: { lat: number; lng: number } | null }).__GA_GEO_SSR__ =
        Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
