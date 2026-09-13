# Architecture

How the platform works technically. Product context is in `PLATFORM.md`;
schema truth in `DATABASE.md`; file map in `PROJECT_STRUCTURE.md`.

## Stack (as actually installed, see `package.json`)

React 19 + TypeScript, TanStack Start v1 (SSR + `createServerFn` RPCs) with
TanStack Router (file-based) + TanStack Query, Vite 8 + Nitro (Vercel server
build, route rules with CSP/security headers, SWR on static pages), Tailwind
CSS v4 (tokens in `src/styles.css`), shadcn/ui + Radix (vendored), MapLibre GL
6 (WebGL2) + OpenFreeMap vector tiles, Supabase JS 2 (Postgres + PostGIS,
Auth, private Storage, Realtime, RLS), Zod 3. Bun runs everything; Vitest +
happy-dom for unit/component tests; Playwright for the live E2E suite;
GitHub Actions CI (tsc + tests + build). Deploy: Vercel.

## The core pattern: reads via RLS, writes via server functions

- **Reads:** the browser Supabase client (publishable key) queries tables
  directly. RLS and column-level grants do the authorization: the public
  sees approved sites, care logs of approved sites, and all fires minus PII
  columns. Staff reads are scoped by `private.can_moderate()`
  SECURITY DEFINER functions over `user_roles` + `moderator_wilayas`.
- **Writes:** there are NO INSERT/DELETE RLS policies on any table. All
  writes go through `createServerFn` RPCs (`*.functions.ts` thin zod
  wrapper → `*-impl.server.ts` implementation, dynamically imported inside
  the handler) using the service-role client. Public writes pass the abuse
  gate in `submissions.server.ts`.
- **Privilege checks are live, not cached:** every staff server call re-reads
  the caller's role from the request bearer token (`requireAdmin` /
  `requireStaff`). A demoted moderator loses access on the next request.
- **PII is column-grant protected:** `fire_reports.reporter_name/phone`,
  `sites.contact_phone`, `fire_reports.user_id` are not granted to clients
  (`select *` fails on purpose). The only read path is the scope-checked
  `getSiteContact` / `getFireContact` server functions. `myFireReports`
  serves a signed-in user's own fires (user_id is not client-granted).
- **Photos:** private `photos` bucket, zero storage policies. Uploads via
  service role (900KB cap, jpeg/png/webp, magic-byte sniff, validated
  BEFORE upload so a rejected submission leaves no orphan); public reads
  only through `/api/public/photo/*` with 1-year cache headers. Rejecting a
  planting deletes its photo object.

## Request lifecycle

1. Request → Nitro → `src/server.ts` (SSR entry): sets the per-request
   locale global (`__GA_LOCALE_SSR__` from the `ga-locale` cookie) and the
   Vercel IP-geo hint (`__GA_GEO_SSR__`), normalizes h3-swallowed 500s into
   a rendered error page.
2. `src/start.ts`: TanStack Start instance with error-capture middleware,
   CSRF middleware (server functions reject cross-site posts), and the
   Supabase bearer-token attacher (client middleware that attaches the
   session token to every server-fn call).
3. `src/routes/__root.tsx`: HTML shell, no-flash theme/locale scripts,
   QueryClientProvider, I18n + privacy + tooltip providers, toaster,
   announcement strip, PWA banner, Vercel analytics, 404/error boundaries
   (they use the module-level `ssrT` because they render outside providers).
4. Routes are file-based (`src/routes/`, generated tree never edited).
   `_authenticated/` is a client-side gate (`ssr: false`, `beforeLoad`
   checks the session).

## The home map

`HeroMap` mounts MapLibre once (`useHeroMapMount`): WebGL2 probe, 15s style
budget, context-loss guards, StrictMode-safe cancellation. Layers come from
`map-layers.ts` (data + wilaya borders + pulse loop), `hotspots-layer.ts`
(server-proxied NASA FIRMS), `risk-layer.ts` (bundled Kabylie model grid).
The mount effect reads row arrays through REFS, never frozen props (BUG-01
lesson: dots added after mount must be clickable). Realtime
(`useMapRealtime`): one channel, filtered (approved sites, all fires, care
INSERTs), 2s-debounced query invalidation + the activity ticker.

## Submission pipeline (all three flows)

`verifyGate` → `optionalUserId` (bearer token, optional) → `resolveLocation`
(server derives the wilaya from the pin; wilaya-only submissions store the
display centre with `location_approximate = true`) → `storePhoto` (data URL
→ private bucket) → service-role insert (photo rolled back on failure) →
`mintReceipt` (salted token hash) → fires additionally fan out Web Push
(wilaya-scoped, stale endpoints pruned). Offline retry via
`submitResilient`. The mobile app (`dz-green-mobile`, Expo) submits through
`POST /api/mobile/submissions` — same schemas, same gate, same impls.

## External services

| Service | Used for | Key handling |
|---|---|---|
| OpenFreeMap | basemap tiles | none (free, keyless) |
| NASA FIRMS | satellite hotspot layer | server-held, fail-loud (`/api/public/hotspots`, edge-cached 10 min) |
| Open-Meteo | fire weather, air quality, rain fallback | keyless, fail-soft |
| PlantNet | species suggestion from photos | server-held, fail-soft |
| Web Push (VAPID) | fire alerts | public key in bundle, private server-only |
| mapbox-gl-rtl-text CDN | Arabic map labels | loaded client-side |

## Conventions an agent must follow

- `*.functions.ts` = zod + `createServerFn` wrapper only; `*.server.ts` =
  implementation, dynamic-imported inside handlers (keeps the service role
  out of the client bundle).
- Client queries ALWAYS list columns explicitly (`src/lib/data.ts` column
  constants) — never `select *`.
- Design tokens only: `--plant` / `--care` / `--fire` semantics + Canopy
  tokens; no hardcoded colors. RTL-first: logical properties, `dir="rtl"`
  variants.
- Max 250 lines per hand-written file; i18n for every user-facing string
  (EN dict is the typed source of truth; AR/FR locked by tsc).
- History lives only in `CHANGELOG.md`; current state only everywhere else.
