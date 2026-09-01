# PROJECT_STRUCTURE.md

Last verified against the working tree on 2026-08-31. Stack as actually installed (see `package.json`): React 19 + TypeScript, TanStack Start v1 + TanStack Router + TanStack Query, Vite 8, Tailwind CSS v4 (config-less, via `src/styles.css`), shadcn/ui + Radix (vendored), lucide-react, MapLibre GL 6, Supabase JS 2, Zod 3, sonner, date-fns. No Framer Motion, no react-router â€” animations are CSS/SVG transitions.

## Root

| Path | Purpose |
|---|---|
| `package.json` | Metadata (`green-algeria`, AGPL-3.0-only) + scripts: `dev`, `build`, `build:dev`, `preview`, `test` (vitest), `lint` (eslint), `format` (prettier). |
| `vite.config.ts` | Vite + TanStack Start + React + Tailwind wiring (native `resolve.tsconfigPaths`; `optimizeDeps.exclude: ["maplibre-gl"]` â€” load-bearing, see `SYSTEM_INSTRUCTIONS.md`). |
| `vitest.config.ts` | Unit test runner config (`src/lib/__tests__/`). |
| `playwright.config.ts` | E2E runner: dev server on **:8081** (`bun run dev -- --port 8081`, `reuseExistingServer`), chromium only, workers 1. |
| `tsconfig.json` | TS config, `@/*` path alias to `src/*`. |
| `components.json` | shadcn/ui generator config. |
| `eslint.config.js`, `.prettierrc`, `.prettierignore` | Lint/format setup. |
| `bunfig.toml`, `bun.lock` | Bun package-manager config + lockfile. |
| `.env.example` | Every env variable with placeholder values; `.env` (gitignored) holds the real Supabase values. |
| `AGENTS.md` | Standing rules for AI agents / contributors working in this repo. |
| `CONTRIBUTING.md` | Setup, checks, branch/PR conventions, binding rules for contributors. |
| `CODE_OF_CONDUCT.md` | Contributor Covenant v2.1. |
| `SECURITY.md` | Vulnerability reporting (private GitHub advisories) + the project's security posture. |
| `.github/` | `workflows/ci.yml` (tsc + unit + build on PRs and main), `ISSUE_TEMPLATE/` (bug + feature forms), `PULL_REQUEST_TEMPLATE.md`. |
| `README.md` | Project intro, live app link, status, local setup. |
| `LICENSE` | AGPL-3.0 (owner decision 2026-08-18), copyright Sifeddine Mebarki. |
| `supabase/config.toml` | Platform-managed Supabase project config. Do not hand-edit. |
| `supabase/migrations/*.sql` + `README.md` | Chronological **change record** (9 files, 2026-08-12 â†’ 2026-08-18). NOT a bootstrap path â€” the canonical schema source is `docs/FULL_SCHEMA_EXPORT.sql`. |
| `public/` | `favicon.ico`, `logo.png` (128px brand mark used in the chrome), `og.png`, `robots.txt` (allows all), `manifest.webmanifest` + `icon-192/512.png` + `apple-touch-icon.png` (PWA), `sw.js` (tiny service worker: static-asset cache + pre-wired push handlers, no page caching). |
| `docs/` | `AUDIT.md`, `CHANGELOG.md`, `DATABASE.md`, `DESIGN.md` (active design system), `FEATURES.md`, `FULL_SCHEMA_EXPORT.sql`, `I18N_AR_MASTER.md`, `MOBILE.md`, `PROJECT_STRUCTURE.md`, `ROADMAP.md`, `SYSTEM_INSTRUCTIONS.md`, plus `archive/` (superseded planning docs). |
| `e2e/` | 4 Playwright specs, 16 tests total (see below). |
| `src/` | Application source (below). |

## `src/` top level

| Path | Purpose |
|---|---|
| `router.tsx` | Creates the TanStack Router instance with a QueryClient in router context. |
| `start.ts` | TanStack Start instance: request middleware (error capture) + client function middleware (attaches the Supabase bearer token to server-fn calls). |
| `server.ts` | Server entry / SSR handler. |
| `styles.css` | Tailwind v4 entry + the design system (see `docs/DESIGN.md`): light default (sage canvas, white cards, lime CTA-only accent), `.dark` repolarized, Inter body + Manrope 900 display (`display-hero`), semantic `--plant`/`--care`/`--fire` tokens, `--radius` 24px canonical, `.tap-target`/`.eyebrow` utilities. |
| `routeTree.gen.ts` | Generated route tree. Never edit by hand. |

## `src/routes/` (file-based routing, see `src/routes/README.md`)

| Route file | URL | Purpose |
|---|---|---|
| `__root.tsx` | â€” | HTML document shell, head defaults, QueryClientProvider, `<Toaster />`, 404 component, root error boundary, no-flash theme script. |
| `index.tsx` | `/` | Map-first home: `HeroMap` fills the viewport under the top bar, action card (hero copy, stats, layer chips, hide button â€” hidden by default on phones, pulsing reveal button), Map/List toggle, detail panel, realtime subscriptions. |
| `about.tsx` | `/about` | What the project is, how moderation works, the "not an emergency service" disclaimer. |
| `privacy.tsx` | `/privacy` | Plain-language data policy: public vs never-public, Law 18-07 rights, hosting. |
| `terms.tsx` | `/terms` | Plain-language terms: honest submissions, moderation, not an emergency service, no warranty. |
| `plant.tsx` | `/plant` | Planting submission form â†’ `submitPlanting` server fn. Result is `pending`. |
| `care.tsx` | `/care` | Care log form (site picker, action, date, optional photo/notes/name) â†’ `submitCare`. Publishes immediately. Accepts `?site=<uuid>`. |
| `fire.tsx` | `/fire` | Fire report form â†’ `submitFire`. Publishes immediately; Protection Civile disclaimer on form + success screen. |
| `my/$token.tsx` | `/my/<token>` | Public receipt page: kind, moderation status, date, wilaya for an anonymous submission. No PII. `noindex`. |
| `auth.tsx` | `/auth` | Email/password sign-in and sign-up. |
| `volunteer.tsx` | `/volunteer` | Big warm ask: `VolunteerForm` (name/email/phone/wilaya/intents/availability/message, honeypot) â†’ `submitVolunteer`; "not an emergency service; call Protection Civile 14/1021" stays visible. Admin-only: `VolunteerPanel` lists applications (status newâ†’contactedâ†’onboarded). |
| `_authenticated/route.tsx` | â€” | Auth gate (`ssr: false`), redirects signed-out users to `/auth`. |
| `_authenticated/moderate.tsx` | `/moderate` | Moderation dashboard: stats strip, segmented tab bar (`ModTabs`), pending queue, fire triage, alert contacts. Wilaya-scoped by RLS. `noindex`. |
| `_authenticated/admin.tsx` | `/admin` | Admin dashboard: four tabs — Overview (platform stats + wilaya oversight), Users & roles (user list, role actions, create account, assign-wilayas dialog), Volunteers, Feedback — each mounting only when selected. Admin-only guard. `noindex`. |
| `_authenticated/activity.tsx` | `/activity` | User dashboard: own plantings (with review status), care logs, fire reports; loading/empty/error states. `noindex`. |
| `api/public/photo/$.ts` | `/api/public/photo/*` | Server route streaming objects out of the private `photos` bucket with long cache headers. The only public read path for images. |
| `api/public/hotspots.ts` | `/api/public/hotspots` | NASA FIRMS satellite hotspots GeoJSON — server-side fetch (key stays secret), edge-cached 10 min, 502/no-store on failure. |
| `api/mobile/submissions.ts` | `/api/mobile/submissions` | POST â€” mobile submissions endpoint (issue #8): Bearer session verified, existing zod schemas, same abuse gate + impls as the web forms. |
| `README.md` | â€” | Notes on the file-based routing conventions. |

## `src/components/`

| Path | Purpose |
|---|---|
| `AppShell.tsx` | Global chrome, split by route: public pages get a top nav-bar (hamburger drawer, `inert` when closed); app pages (`/moderate`, `/admin`, `/activity`) get the sidebar shell. The mobile bottom action bar was removed 2026-08-21. Drawer contains the Volunteer row (HandHeart). |
| `volunteer/VolunteerForm.tsx` | The `/volunteer` form: name/email/phone-whatsapp/wilaya dropdown (58)/extra-wilayas/intent chips (preselected "Review plantings")/availability/message, honeypot, success state. |
| `admin/AdminUsersPanel.tsx` | Users, roles and wilayas panel: paginated list ("Show more"), role buttons, sign-out, "New account" — all one tab. |
| `admin/CreateAccountDialog.tsx` | Admin-created moderator accounts (email, password show/hide + generate, display name, wilayas) via `adminCreateUser`. |
| `admin/WilayaChecklist.tsx` | Shared wilaya checkbox list (historic parents + post-2019 children) for Assign/Create dialogs. |
| `admin/VolunteerPanel.tsx` | Admin-only list of volunteer applications: info + intent chips + status select (new/contacted/onboarded) + one-click "Approve & make moderator" (`adminOnboardVolunteer`). Paged. |
| `admin/FeedbackPanel.tsx` | Admin-only feedback inbox: kind badges (bug/idea/other), message, page, device UA, two-step delete. Paged. |
| `SectionTabs.tsx` | Shared segmented tab bar for staff pages (moderate, admin): icon + count always, labels from sm up — never overflows 390px. |
| `pwa-install.tsx` | One-time install banner: native prompt on Chromium, Share → Add to Home Screen instructions on iOS; dismissed state persisted. |
| `fire/FireAlertsCard.tsx` | Fire-alerts card on `/fire` (form + success screen): enable/disable Web Push, optional wilaya scope, denied/unsupported states. |
| `moderator/RejectedQueue.tsx` | Rejected plantings tab: rows with Re-approve (scoped service fn) + admin-only delete; broken thumbnails hide on 404. |
| `FeedbackDialog.tsx` | The site-wide feedback box (home "Feedback" pill): Bug / Feature idea / Other kind selector + message, honeypot, sends `navigator.userAgent` (capped) with bug reports → `submitFeedback`. |
| `admin/AssignWilayasDialog.tsx` | Wilaya assignment dialog for a moderator (uses the shared checklist). |
| `FormShell.tsx` | Card-wrapped form container (rounded-2xl family) + the `Honeypot` hidden-field component. |
| `PhotoInput.tsx` | Camera-capable file input; compresses on-device (max 1024px, WebP/JPEG) before base64 handoff. |
| `ReceiptLink.tsx` | Success-screen receipt link: copyable `/my/<token>` URL, the only status lookup for anonymous submitters. |
| `PrecisionPicker.tsx` | MapLibre GL + OpenFreeMap picker for exact pin drops inside forms. Draws an amber accuracy-radius circle from the GPS fix. |
| `LocationField.tsx` | Wilaya-first location: wilaya/commune selects first (works without GPS), then an optional "Exact location" card â€” GPS button with privacy line, MapLibre picker behind a toggle, Google Maps link input, remove-pin action. |
| `CommuneField.tsx` | Commune dropdown per wilaya (1,541 communes, AR labels, canonical Latin stored) with a free-text "Other" escape hatch. |
| `SpeciesSuggest.tsx` | "Identify from the photo" button + one-tap species chips on the plant form (PlantNet). |
| `EmergencyContacts.tsx` | SOS pill + popover in the top bar: Protection Civile 14/1021, Police 17, Gendarmerie Nationale 1055, SAMU 16, `tel:` links. |
| `home/HomeBits.tsx` | Home helpers: `Stat`, `Chip`, `HomeCtas`. |
| `home/ViewToggle.tsx` | Map / List / Board switch (floats top-right over the home view). |
| `home/Leaderboard.tsx` | Monthly wilaya race â€” approved plantings summed per wilaya, resets on the 1st, client-computed. |
| `home/ActivityTicker.tsx` | Anonymous live-activity pill on the map, auto-dismissed. |
| `home/useMapRealtime.ts` | The realtime subscription (query invalidation + ticker messages), extracted from the home route. |
| `map/HeroMap.tsx` | The hero map: MapLibre GL + OpenFreeMap, mount/theme/data/toggle effects. No clustering â€” every tree/care/fire is its own dot at every zoom. |
| `map/hotspots-layer.ts` | The satellite hotspot layer: amber hollow rings (no pulse â€” that stays the community-fire signature), radius by FRP, click â†’ hotspot detail. |
| `map/detail-bodies.tsx` | `HotspotBody` â€” the satellite hotspot detail sheet (confidence/FRP/pixel temp/acquisition/satellite, disclaimer, NASA attribution). |
| `map/map-failure.tsx` | The WebGL2 probe + map failure overlay (extracted from HeroMap 2026-08-31). |
| `home/LegendDots.tsx` | The floating 4-dot legend (trees/care/fires/satellite) with tooltips (extracted from the home route 2026-08-31). |
| `map/map-style.ts` | Map style constants, theme-aware colors, the RTL text plugin call (browser-guarded), and the RecenterControl. |
| `map/map-data.ts` | GeoJSON builders (feature collection, kind filters, feature lookup). |
| `map/map-layers.ts` | Source/layer setup (wilaya borders, per-kind points, fire pulse), layer visibility, the pulse rAF loop, click/hover interactions. |
| `map/DetailPanel.tsx` | Side panel (bottom sheet on mobile) showing feature details, the care timeline, and a Google Maps Directions link. Images capped; no horizontal overflow. |
| `map/SiteList.tsx` | List view behind the Map/List toggle: plantings + fire reports **grouped by wilaya** (section headers with per-wilaya totals, photo-thumb rows, needs-water and fire-status badges). Rebuilt 2026-08-21. |
| `moderator/ModTabs.tsx` | Segmented tab bar for the moderation sections, with live count badges. |
| `moderator/PendingQueue.tsx` | Pending plantings with approve/reject under `sites_moderator_update`; writes `reviewed_by`, `reviewed_at`, `moderator_notes`. Shows exact submitted-at time and the wilaya-level badge. |
| `moderator/FireTriage.tsx` | Fire report list with status badges and resolved / false-alarm / reopen actions (writes `status` + `resolved_at`). Exact reported/resolved times. |
| `moderator/ContactReveal.tsx` | On-demand contact reveal button â€” calls the moderator-only server functions, shows name/phone or "no contact info". |
| `moderation.functions.ts` | `getSiteContact` / `getFireContact` â€” service-role, live role check per call; the only read path for reporter/planter PII. |
| `moderator/StatusBadge.tsx` | Pill status badge (tone variants: plant/care/fire/muted). |
| `admin/AdminOverview.tsx` | Admin stats strip + per-wilaya moderation load. |
| `admin/AssignWilayasDialog.tsx` | Wilaya assignment dialog for a moderator (uses the shared checklist). |
| `ui/*` | Unmodified shadcn/ui primitives. Most are unused by this app; they ship with the template (vendored â€” see note below). |

## `src/lib/`

| Path | Purpose |
|---|---|
| `types.ts` | App-level `Site`, `CareLog`, `FireReport` types (client-safe shapes: no reporter PII) + `needsWater()` 14-day derived flag. |
| `data.ts` | TanStack Query `queryOptions` for sites/care logs/fire reports with explicit safe column lists (bounds 2000/3000/1000), and `photoUrl()` mapping a storage path to `/api/public/photo/...`. |
| `moderation.ts` | `useModerationStats()` â€” exact head-count queries (pending, approved today, active fires, total submissions). |
| `wilayas.ts` | The 58 wilayas (code, Latin + Arabic name) and the mapping to the 48 historic map polygons. |
| `geo.ts` | Mercator projection helpers, bounding-box math, `wilayaCodeForPoint` point-in-polygon derivation (historic wilayas only), `wilayaCenterLatLng` display centres, `parseRings`, `ALGERIA_CENTER`. |
| `wilaya-geo.ts` | Wilaya boundaries as GeoJSON (converted from the projected path data back to lat/lng) + `wilayaBounds` â€” the hero map's border layers and wilaya zoom. |
| `image.ts` | Client-side image compression (max 1024px longest edge, WebP/JPEG, target <400KB). |
| `offline.ts` | `submitResilient()` â€” retries a submission when the device regains connectivity. |
| `device.ts` | `getDeviceSecret()` â€” per-browser random secret in localStorage for the rotating device hash. |
| `maps-link.ts` | Google Maps link helpers: `parseGoogleMapsLink` (unit-tested), `isShortMapsLink`, `directionsUrl`. |
| `maps.functions.ts` | `resolveMapsLink` server fn: follows short goo.gl/maps.app.goo.gl redirects server-side and parses coordinates. |
| `submissions.functions.ts` | The three public server functions (`submitPlanting`, `submitCare`, `submitFire`) with Zod validators. Thin wrappers only. |
| `submissions-impl.server.ts` | Server-only implementations: gate â†’ optional user id â†’ photo upload â†’ service-role insert. `wilaya_code` derived server-side; client value ignored. |
| `submissions.server.ts` | Abuse gate: silent-drop honeypot, 1.2s submit-timing floor, hashed-IP + rotating device-hash hourly rate limits (planting 6 / care 20 / fire 8) via `submission_meta`, photo storage helper. |
| `receipts.server.ts` | Receipt links: `mintReceipt` (stores only the token hash) and `getReceiptStatus` (token â†’ public-safe status snapshot). |
| `admin.functions.ts` | **Barrel** (split 2026-08-31; import path unchanged): re-exports `admin-users.functions.ts` (accounts: `adminListUsers`, `adminCreateUser`, `adminSetRole` with self-guard + last-admin guard, `adminSetWilayas`, `adminSignOutUser`, `adminDeleteUser`), `admin-content.functions.ts` (`adminListFeedback`/`adminListVolunteers` paged, `adminSetVolunteerStatus`, `adminOnboardVolunteer`, `adminDelete*` content deletes), `admin-stats.functions.ts` (`adminStats`). Every call re-checks the caller's admin role live from the request token (`admin-shared.server.ts`). |
| `activity.functions.ts` | `myFireReports`: a signed-in user's own fire reports â€” `fire_reports.user_id` is not column-granted to clients, so the server filters by the caller's token. |
| `feedback.functions.ts` / `feedback.server.ts` | `feedbackSchema` + `submitFeedback` server fn and its impl — service-role insert into the zero-grant `feedback` table, throttled 10/hour via the shared hashed-IP gate. |
| `volunteers.functions.ts` / `volunteers.server.ts` | `volunteerSchema` + `submitVolunteer` server fn and its impl — service-role insert into the zero-grant `volunteers` table, links `user_id` when signed in, throttled 5/hour via the shared gate. |
| `privacy-mode.tsx` | Filming privacy mode: `PrivacyModeProvider`/`usePrivacyMode` + `maskEmail`/`maskPhone`/`maskName` — masked-by-default PII on staff pages, top-bar Show/Hide infos toggle (persisted `ga-privacy`). |
| `hotspots.server.ts` | NASA FIRMS server lib: area URL, CSV parser, confidence filter, 13 static flare zones, southern persistence mask, GeoJSON builder. Fail-loud `FIRMS_MAP_KEY`. |
| `pwa.ts` | Production-only service-worker registration. |
| `geo-hint.ts` | Coarse IP-geolocation hint (Vercel headers): `getGeoHint()` reads `window.__GA_GEO__` (client) / the request-global (server). Never stored. |
| `gps.ts` | `medianFix()` — robust final GPS fix: median of the last 3 ±100 m readings (rejects lucky outliers), single-best fallback. Unit-tested. |
| `weather.ts` | Shared pure weather helpers: `compass()` (8-wind, i18n'd) + the `FireWeather` type. Client-safe. |
| `weather.server.ts` | Open-Meteo fetch (no key): current conditions for a point, 8 s timeout, 0.1°/30 min in-memory cache, `mapCurrent` mapper. |
| `weather.functions.ts` | `getFireWeather` server fn (zod-bounded lat/lng) — returns null on failure, never breaks the panel. |
| `plantnet.server.ts` | PlantNet identify call (key from env, fail loud) + `mapPlantNet` (top 2, score ≥ 0.15, common-name label). |
| `plantnet.functions.ts` | `suggestSpecies` server fn (zod data-url + locale) — fails soft to null. |
| `push.server.ts` | Web Push server lib: VAPID setup (fail loud), subscribe/unsubscribe impls, `shouldNotify` scope match, `notifyFireSubscribers` fan-out (total, prunes stale endpoints). |
| `push.functions.ts` | `subscribePush` / `unsubscribePush` public server fns (zod). |
| `error-capture.ts`, `error-page.ts` | Platform error plumbing. |
| `utils.ts` | `cn()` class merge helper. |
| `__tests__/` | 16 files, **192 tests** (2026-09-01 run): pure-function units (abuse gate, Zod schemas, geometry, link parsing, `needsWater` + rain, image sniff, feedback/volunteer/push schemas, FIRMS filters, GPS median, weather/AQ mappers, PlantNet mapper, 69-wilaya geo) + **component behavior tests** (testing-library + happy-dom: CommuneField, SpeciesSuggest, FireAlertsCard). |

## `src/hooks/`, `src/data/`, `src/integrations/`

| Path | Purpose |
|---|---|
| `hooks/useAuth.tsx` | Supabase session state + `role`/`isModerator`/`isAdmin` read live from the caller's `user_roles` row. `loading` stays true until the role query settles. |
| `hooks/useTheme.tsx` | Shared light/dark theme store: one module-level value + listeners so every consumer (shell AND map) flips together. localStorage-persisted, `.dark` on `<html>`. |
| `hooks/use-mobile.tsx` | Viewport breakpoint hook (template). |
| `data/algeria-wilayas.ts` | Auto-generated from namrouche993/algeria-wilayas-geojson v69 (MIT): Mercator-projected SVG path data for all **69** wilaya polygons (Law 26-06, the 2025 division). Do not hand-edit. |
| `data/communes.ts` | Auto-generated from islam-re/Algeria-wilayas (MIT, Journal Officiel): `COMMUNES_BY_WILAYA` — 1,541 communes (ar + latin) across all 69 wilayas. Do not hand-edit. |
| `integrations/supabase/client.ts` | Browser client (publishable key). Auto-generated â€” never edit. |
| `integrations/supabase/client.server.ts` | Service-role admin client. Server-only. Auto-generated. |
| `integrations/supabase/auth-attacher.ts` | Client middleware attaching the bearer token to server-fn calls. Auto-generated. |
| `integrations/supabase/types.ts` | Generated database types. Regenerated on migration. |

## `e2e/` (16 tests, run with `bunx playwright test`)

| Spec | Tests | Covers |
|---|---|---|
| `flows.spec.ts` | 5 | Home map, plant round-trip, care round-trip, fire flow, moderator approve. |
| `admin.spec.ts` | 3 | Assign wilaya â†’ scoped queue + approve â†’ remove wilaya/role â†’ demoted lockout. |
| `receipts.spec.ts` | 4 | Receipt pendingâ†’approved round-trip, unknown-token, honeypot silent drop, wilaya-only submission. |
| `activity.spec.ts` | 4 | Signed-out redirect, own activity across sections, empty states, admin overview. |

Fixtures are SQL-seeded per the recipe in `docs/SYSTEM_INSTRUCTIONS.md` Â§E2E fixture recipe and cleaned up after every run.

## Known structural notes

- The 250-line rule currently has **three exceptions** (flagged 2026-08-31): `src/components/LocationField.tsx` (328 after the geo-hint wiring), `src/components/AppShell.tsx` (273), `src/routes/_authenticated/activity.tsx` (269). `admin.functions.ts` (was 484) was split the same day into a barrel + `admin-users`/`admin-content`/`admin-stats` + `admin-shared.server.ts`; `index.tsx` came back to 250 with the LegendDots extraction. Generated files (`src/routeTree.gen.ts`, `src/integrations/supabase/types.ts`) are exempt.
- `src/components/ui/` is template surface area, not project code; treat it as vendored. `chart.tsx` and `sidebar.tsx` currently have zero consumers (flagged in `docs/AUDIT.md` P2 #7).
- Test suite: 137 unit tests + 16 live E2E tests, plus a 40-check RLS role-matrix battery run from a session script kept out of the repo. See `docs/CHANGELOG.md` for the full verification round-up.

## `src/i18n/` (Arabic-first localization, 2026-08-28)

| Path | Purpose |
|---|---|
| `index.tsx` | `I18nProvider`/`useI18n` (locale, `t(path, params)`, `count`, `formatDate*`, `setLocale`, `isRtl`), `localizeError` (rewrites known server strings), `ssrT` for route `head()`, no-flash locale script. |
| `locale.ts` | Locale singleton (default `ar`), `ga-locale` persistence, `lang`/`dir` side effects. |
| `format.ts` | `count(n, kind)` with Arabic numeral agreement (1/2/3â€“10/11+), `ar-DZ` date formatting with Latin digits. |
| `dict/en/*` | English dictionary â€” the key source of truth. |
| `dict/ar/*` | Arabic dictionary, `typeof`-locked to the EN shape: a missing/mismatched key fails `tsc`. |