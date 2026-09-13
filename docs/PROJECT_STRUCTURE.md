# PROJECT_STRUCTURE

Verified against the working tree on 2026-09-12. Stack: React 19 +
TypeScript, TanStack Start v1 + Router + Query, Vite 8 + Nitro, Tailwind v4,
shadcn/ui + Radix (vendored), MapLibre GL 6, Supabase JS 2, Zod 3, sonner,
date-fns. Bun + Vitest + Playwright. Generated files
(`routeTree.gen.ts`, `integrations/supabase/*`, `src/data/*`) are exempt
from the 250-line rule.

## Root

| Path | Purpose |
|---|---|
| `package.json` | Scripts: dev, build, build:dev, preview, test (vitest), lint, format. |
| `vite.config.ts` | TanStack Start + React + Tailwind + Nitro (Vercel build; route rules: security headers + CSP — `optimizeDeps.exclude: ["maplibre-gl"]` is load-bearing, dev-only). |
| `playwright.config.ts` | Live E2E: dev server on :8081, chromium, workers 1, retries 1, 15-min global cap. |
| `vitest.config.ts` / `tsconfig.json` / `eslint.config.js` / `.prettierrc` | Test/type/lint/format setup. |
| `components.json` | shadcn/ui generator config. |
| `.env.example` / `.env` / `.env.vercel` | Env variables (Supabase URL/keys, service role — server-only, FIRMS key, VAPID pair, PlantNet key). |
| `bunfig.toml` / `bun.lock` | Bun config + lockfile. |
| `AGENTS.md` | How to work in this repo (owner rules, non-negotiables). |
| `README.md` | Public-facing intro + setup + doc links. |
| `LICENSE` (AGPL-3.0), `CODE_OF_CONDUCT.md`, `SECURITY.md` (reporting), `CONTRIBUTING.md` | Repo policies. |
| `.github/` | `workflows/ci.yml` (tsc + unit + build on PRs/main), issue + PR templates. |
| `public/` | favicon, logo, og, robots, manifest + icons + `sw.js` (PWA). |
| `supabase/` | `migrations/00000000000000_master_schema.sql` (THE schema; see its README) + platform-managed `config.toml`. |
| `e2e/` | 4 Playwright specs, 16 tests, live-DB with SQL fixtures (recipe in SYSTEM_INSTRUCTIONS). |
| `.output/` / `dist/` / `test-results/` / `.tanstack/` / `.vercel/` | Build + tooling artifacts (gitignored where applicable). |

## src/ top level

| Path | Purpose |
|---|---|
| `router.tsx` | Router instance + QueryClient context. |
| `start.ts` | Start instance: error middleware, CSRF, Supabase bearer attacher. |
| `server.ts` | SSR entry: locale + geo globals per request, h3-swallowed-500 normalization. |
| `styles.css` | Canopy tokens (light default, night-soil dark), fonts, radius/motion scales, utilities, `ga-*` keyframes. |
| `routeTree.gen.ts` | Generated route tree — never edit. |

## `src/routes/`

`__root.tsx` (html shell + providers + boundaries) · `index.tsx` (map home)
· `plant.tsx` / `care.tsx` / `fire.tsx` (submission flows) ·
`my/$token.tsx` (receipt) · `auth.tsx` · `volunteer.tsx` ·
`about/privacy/terms.tsx` · `_authenticated/` (gate + `moderate.tsx`,
`admin.tsx`, `activity.tsx`) · `api/public/photo/$.ts` (bucket proxy) ·
`api/public/hotspots.ts` (FIRMS proxy) · `api/mobile/submissions.ts`
(mobile submissions).

## `src/components/`

| Group | Contents |
|---|---|
| `AppShell.tsx` | Chrome split: public = top bar + drawer; staff pages = Canopy sidebar (top bar drops from lg up). |
| `AppDrawer.tsx` | Grouped nav drawer, staggered RTL-safe reveal, footer actions. |
| `LocaleDropdown.tsx` / `EmergencyContacts.tsx` / `FeedbackDialog.tsx` | Top-bar tools (Canopy chip shapes). |
| `AnnouncementBanner.tsx`, `ConsentBanner.tsx`, `pwa-install.tsx`, `Reveal.tsx`, `PhotoThumb.tsx`, `FormShell.tsx`, `SectionTabs.tsx` | Shared chrome and primitives. |
| `shell/` | `StaffSidebar.tsx` (280px → 78px rail, sliding indicator, footer), `nav.ts` (shared NAV_ITEMS + groups). |
| `map/` | `HeroMap`, `useHeroMapMount`, `map-layers`, `map-interactions`, `map-style`, `map-data`, `hotspots-layer`, `risk-layer`, `DetailPanel`, `detail-bodies` (Hotspot/Risk/Fire bodies), `FireConfirmations`, `SiteList`, `map-failure`. |
| `home/` | `ActionCard` (stat strip, CTAs, icon layer toggles), `ViewToggle`, `ActivityTicker`, `Leaderboard`, `useMapRealtime`. |
| `moderator/` | `PendingQueue` (keyboard-first review + age chips), `FireTriage`, `RejectedQueue`, `ContactReveal`, `ModTabs`, `StatusBadge`. |
| `admin/` | `AdminOverview`, `AdminUsersPanel`, `CreateAccountDialog`, `AssignWilayasDialog`, `WilayaChecklist`, `VolunteerPanel`, `FeedbackPanel`, `AdminAnnouncementsPanel` + `announce-form-bits`. |
| `activity/` | `ActivitySections` (three dashboards, presentation only). |
| `fire/`, `volunteer/` | `FireAlertsCard`, `VolunteerForm`. |
| forms | `LocationField` (+`location-gps`, `location-maps-link`), `PrecisionPicker`, `CommuneField`, `PhotoInput`, `SpeciesSuggest`, `PlantingGuide`, `ReceiptLink`, `SpeciesSuggest`. |
| `ui/` | Vendored shadcn primitives; most unused (chart/sidebar have zero consumers). |

## `src/lib/`

Query options + server functions + pure helpers. Key files:
`data.ts` (queries + safe column lists), `types.ts` (client-safe shapes +
`needsWater`), `submissions.{functions,server}-impl.server.ts` (gate +
inserts + receipts + location resolution), `moderation.functions.ts`
(scope-checked staff actions), `admin-*.functions.ts` +
`admin-shared.server.ts`, `confirmations.*` (pending migration),
`receipts.server.ts`, `push.{server,functions}.ts`, `hotspots.server.ts`,
`weather.*`, `plantnet.*`, `maps.*`, `push.*`, `geo.ts` / `wilaya-geo.ts` /
`wilayas.ts` / `gps.ts`, `image.ts`, `offline.ts`, `device.ts`,
`privacy-mode.tsx`, `ai-consent.ts`, `pwa.ts`, `geo-hint.ts`,
`error-capture.ts` / `error-page.ts`, `utils.ts`.
`__tests__/` — 22 files, 219 tests (pure functions + component tests).

## `src/data/`, `src/i18n/`, `src/hooks/`, `src/integrations/`

- `data/` (generated — do not hand-edit): `algeria-wilayas.ts` (69 polygons),
  `communes.ts` (1,541), `wilaya-species.ts` (GBIF), `flare-zones.ts` (EOG),
  `risk-grid.ts` (Kabylie model). Hand-curated: `species-guide.ts`.
- `i18n/`: provider + locale singleton + format helpers; `dict/en/*` is the
  typed source of truth, AR/FR locked by tsc.
- `hooks/`: `useAuth` (live role read), `useTheme`, `use-mobile`.
- `integrations/supabase/` (generated): browser client, server-only
  service-role client, `auth-attacher` middleware, generated types.

## Line-rule status (250 cap)

Zero hand-written violations as of 2026-09-12 (DetailPanel 189,
map-layers 191, AppShell 206 after the Canopy splits). Vendored `ui/*` and
generated files exempt; `styles.css` is the token stylesheet.
