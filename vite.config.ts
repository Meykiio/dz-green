import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  // TanStack Router plugin must come BEFORE JSX transformation plugins.
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    // Emits a Vercel-compatible server build (SSR + server functions). Without
    // it Vercel serves only static files and every route 404s.
    nitro({
      routeRules: {
        // Security headers everywhere (security pass 2026-08-30): clickjacking
        // protection, nosniff, referrer + permissions policy, and a pragmatic
        // CSP (inline scripts/styles required by the no-flash boot scripts
        // and Tailwind; connections limited to self + Supabase + tiles +
        // Vercel analytics).
        "/**": {
          headers: {
            "x-frame-options": "SAMEORIGIN",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "camera=(), microphone=(), geolocation=(self)",
            "content-security-policy":
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' https://*.supabase.co https://*.openfreemap.org https://vitals.vercel-insights.com; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
          },
        },
        // Static informational pages: SSR once, cache at the edge (audit 2026-08-28).
        // /volunteer is deliberately NOT cached — it is auth-dependent (2026-08-30).
        "/about": { swr: 3600 },
        "/privacy": { swr: 3600 },
        "/terms": { swr: 3600 },
        "/logo.png": { headers: { "cache-control": "public, max-age=86400, immutable" } },
        "/og.png": { headers: { "cache-control": "public, max-age=86400" } },
      },
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // maplibre-gl's web worker breaks under dep pre-bundling in dev
    // (maplibre-gl-worker.mjs 404s and every GeoJSON source silently never
    // renders). Excluding it keeps the worker URL intact in dev.
    exclude: ["maplibre-gl"],
  },
});
