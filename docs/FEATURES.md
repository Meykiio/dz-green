# FEATURES.md

Status of every user-facing flow. "Verified" means I traced the code path end to end and, where noted, exercised it against the running app on 2026-08-13, with a full re-verification pass on 2026-08-18 (E2E suite 16/16, unit 91/91, build clean). "Not verified" means the code exists and reads correct but I did not execute it.

Smoke check performed: `GET /`, `/about`, `/plant`, `/care`, `/fire`, `/auth`, `/moderate` all return HTTP 200 from the dev server, and `/api/public/photo/sites/<real-object>` returns 200 with a real stored image.

## 1. Home map (`/`) — works, verified live in both themes

- **The map IS the home (2026-08-18, owner-directed rebuild):** MapLibre GL + OpenFreeMap vector tiles (open-source, no API key) fill the viewport under a slim top bar. WebGL-smooth pan/zoom, real geography with Arabic labels rendered correctly (the RTL text plugin is mandatory — without it Arabic renders reversed and detached). Algeria stays framed via `maxBounds`; a recenter control returns to it. **No clustering anywhere** — every tree, care log and fire shows as its own dot at every zoom (the product's purpose is a map that turns green; fires are always individual and pulsing). Care dots are offset slightly so they peek out from under a site's tree dot.
- **Wilaya boundaries** in green (theme-aware colors — brighter on dark) from the converted polygon data (`src/lib/wilaya-geo.ts`); click a wilaya to zoom into it.
- **Chrome:** slim top bar (hamburger drawer with the full nav, brand, SOS, theme toggle, auth, GitHub repo link). The brand (logo + wordmark) is hidden on phones — the hamburger already carries Home. The **SOS pill lives in the top bar** and expands above everything — emergency numbers: Protection Civile 14 and 1021, Police 17, Gendarmerie Nationale 1055, SAMU 16 (owner-corrected). Legend + Map/List toggle float top-right. The **action card** (hero copy, stats line, CTAs, layer chips) has a smaller 2-line title and a hide button; on phones it starts hidden so the map gets the space, and the reveal button at bottom-left pulses until used (reduced-motion respected). The old mobile bottom action bar is gone (2026-08-21) — it duplicated the card CTAs and covered the reveal button. On the map, everything outside Algeria is dimmed by a mask layer and every basemap text label (cities, villages, POIs, roads, water) is filtered to Algeria only — the country reads first, and no foreign place names render.
- **Legal pages (2026-08-21):** `/privacy` (what's collected, why, what's public vs never, Law 18-07 rights, hosting) and `/terms` (honest submissions, volunteer moderation, the not-an-emergency-service rule, no warranty), both plain-language, linked from the drawer and from the phone fields on the plant/fire forms.
- **Leaderboard view + activity ticker (2026-08-21):** the home toggle is now Map / List / **Board** — a monthly wilaya race (approved plantings only, summed per wilaya, resets on the 1st, leading-wilaya highlight + ranked list, empty state with a plant CTA), computed client-side from the already-loaded sites (no schema, no new query). On the map, an anonymous live-activity pill ("2 trees just planted in Oran") appears on realtime inserts and dismisses itself after 6s — fed by the same subscription that already refreshed the map.
- **Detail panel** (site/care/fire details + Directions link) hardened: images capped (`max-h-44/52`), no horizontal overflow.
- **Feedback dialog (2026-08-18, extended 2026-08-21):** a green "Feedback" pill sits in the top bar next to the SOS pill on every viewport (sign-in moved into the drawer/static sidebars to make room). The dialog takes a kind (Bug / Feature idea / Other, 2026-08-21) and a message (1–2000 chars, honeypot, page path) and lands it in `public.feedback` via the `submitFeedback` server function. Service-role only; no client access. Since 2026-08-20 it also captures a user-agent snapshot so bug reports are diagnosable. The admin panel badges each message by kind.
- Loads approved sites, care logs and fire reports through TanStack Query with explicit safe column lists (`src/lib/data.ts`). Realtime: one channel, filtered (`sites` approved, all `fire_reports`, `care_logs` INSERT) — **verified live:** a care log inserted via SQL appeared as a new blue dot with pulse, no reload.
- "Needs water" badge is a client-side derived flag: no care log within 14 days (`needsWater()` in `src/lib/types.ts`). **Verified by reading the implementation.**
- **Load-bearing dev note:** `optimizeDeps.exclude: ["maplibre-gl"]` in `vite.config.ts` — without it the maplibre worker 404s in dev and every GeoJSON source silently never renders (the day-long "no dots/borders" saga's root cause, with a StrictMode double-mount race as the second).

## 2. Report a planting (`/plant`) — works, verified live

- Photo required, camera-capable, compressed on-device to max 1024px / WebP-JPEG before upload.
- **Wilaya-first location (2026-08-17):** the wilaya dropdown is the primary control and works without GPS. An exact pin is optional precision on top — GPS button (gesture-gated, with a "used once, never stored, never tracked" privacy line), the MapLibre picker behind "Adjust on map" (hidden by default), **or pasting a Google Maps link** (2026-08-18): the input parses `@lat,lng`, `!3d!4d` place segments and `q|query|ll|center|destination=` params client-side (unit-tested), and short `goo.gl`/`maps.app.goo.gl` links resolve via the `resolveMapsLink` server function. With no pin, the server stores the wilaya's display centre and marks the row `location_approximate = true`; the detail panel and list view show an honest "wilaya-level" badge instead of fake precision. With a pin, the server still derives the wilaya from the coordinates (client value ignored).
- GPS accuracy is shown as a colour-coded badge (±m, excellent/good/rough/poor) and as an amber accuracy-radius circle on the picker map. **Best-fix watch (2026-08-22):** instead of grabbing the first (usually coarse network) fix, the GPS button now watches for up to 12 s, shows the best accuracy improving live ("Best fix so far: ±X m"), stops early at ±15 m, and offers "Use this now" to accept the current best — typically ±5–20 m instead of ±50–100 m. **Verified headlessly with Playwright geolocation overrides; not exercised on a real phone.**
- Species, tree count, planted date (defaults to today, capped at today — **and rejected server-side when in the future**, same for care `logged_date`), optional display name, optional notes.
- **Optional contact phone (2026-08-21):** a phone field with a verification nudge ("a moderator may call to verify before approving — never public, never shared", linking to `/privacy`). Stored as `sites.contact_phone`, column-grant protected exactly like fire reporter PII — no client can read it; moderators read it through a service-role server function. Deliberately **optional**, not required — the nudge does the work without adding friction.
- Submits via the `submitPlanting` server function → abuse gate → service-role insert with `status = 'pending'`.
- The user sees a "under review" confirmation **with a receipt link** (`/my/<token>`, 2026-08-17): an unguessable URL to check the submission's status later. Only the token's hash is stored. The confirmation also states exactly what will be public (photo, wilaya, commune, species, count, date, display name) and what never is (IP/device — hashes only).
- **Verified live:** the E2E receipt round-trip plants anonymously, reads the token from the success screen, sees "Under review" on `/my/<token>`, and sees "Approved — on the map" after a moderator approves. A second E2E test submits with wilaya only (no GPS) and asserts the stored row is `location_approximate = true` at the wilaya centre.
- **Resolved gap:** an anonymous submitter can now follow their own pending row via the receipt link (previously there was no receipt of any kind).

## 3. Log care (`/care`) — works, verified live

- Site picker lists approved sites only; deep link `/care?site=<uuid>` preselects one.
- Action (watered / checked / needs attention / other), date, optional photo, notes, name.
- Server function re-checks that the target site exists and is `approved` before inserting. Publishes immediately, no review. Success screen shows a receipt link (status: "Published on the map").
- **Verified live:** `e2e/flows.spec.ts` care round-trip (site preselected via deep link, "Checked on it", stored row asserted via REST) — green in the 2026-08-18 run.

## 4. Report a fire (`/fire`) — works, verified live

- Same wilaya-first location flow as `/plant` (2026-08-17): wilaya dropdown primary, exact pin optional, wilaya-only reports stored as `location_approximate = true` with the honest badge. Severity wording is already plain ("Small / starting", "Large / spreading").
- Publishes immediately with `status = 'active'` — no moderation queue, by design. Success screen shows a receipt link (live status: active / resolved / false alarm) and states what's public (location, wilaya, severity, description, photo) and what never is (reporter name and phone).
- Protection Civile disclaimer ("call 14 / 1021, this platform does not dispatch help") appears on the form and on the success screen. **Verified in the source and asserted by the E2E suite.**
- Reporter name/phone are stored but never readable by clients (column-level grants). **Verified against live grants and by an E2E assertion: an anonymous `select=reporter_name` returns 401.**
- **Verified live:** `e2e/flows.spec.ts` fire round-trip (GPS pin, "Large / spreading", stored row asserted with `status = 'active'` and the coordinates within 0.01°) — green in the 2026-08-18 run.

## 5. Moderation dashboard (`/moderate`) — verified end to end

- Moderator guard (live role read). **Three tabs** — Pending plantings, Fire reports, Rejected — with live count badges and stat cards. Compact rows (photo thumbnail + clamped content).
- **Pending:** photo, count/species, wilaya/commune, exact coords + submitted-at, ContactReveal (wilaya-scoped PII), moderator note, Approve/Reject (service-role, scope-checked; **reject deletes the photo** so it never serves again).
- **Fire triage:** status/severity badges, reported-at, contact reveal, Mark resolved / False alarm / Reopen. **Admins additionally see a two-step Delete** (hard-delete + photo) — fires publish instantly, so this is the malicious-content escape hatch.
- **Rejected:** rejected plantings with **Re-approve** (same scoped service fn; photo is not restored — by design).
- **Verified live by `e2e/admin.spec.ts`:** assign Oran → Oran-only pending visible → approve; role revocation lockout.

- Behind the platform-managed `_authenticated` gate; the page additionally checks `isModerator` before running any query.
- **Wilaya scoping (2026-08-17):** every queue, triage and contact query is scoped by RLS — admins see everything, moderators only their assigned wilayas (`private.can_moderate`). A moderator with no assignments sees an empty queue. **Verified live:** the E2E admin round-trip seeds pending rows in Alger and Oran, assigns Oran to a moderator, and that moderator sees and approves only the Oran row.
- Stats strip: pending, approved today, active fires, total submissions — head-count queries (`head: true`), no row fetches.
- **Decision data (2026-08-21):** both queues show exact timestamps (`formatDateTime` — date + time): the pending queue shows the submission's `created_at` (previously only the planted date) and a wilaya-level badge; fire triage shows exact reported/resolved times. A **"Show contact"** button on each card reveals the submitter's name/phone on demand via the moderator-only server functions `getSiteContact` / `getFireContact` (service-role, live role check per call — PII is column-grant protected, so this is the only read path; nothing is fetched by default).
- Fire report triage: list with status badge (active/resolved/false alarm), severity, photo, dates; actions Mark resolved / False alarm / Reopen, writing `status` + `resolved_at` under `fire_moderator_update`. **Verified live 2026-08-13: the one live fire report round-tripped Active → Resolved → Active with zero console errors.**

## 5b. Admin dashboard (`/admin`) — verified end to end (2026-08-17, extended 2026-08-18, refactored 2026-08-28)

- Admin-only guard (`isAdmin` from `user_roles`, live read). **Four tabs** — Overview (platform stats + per-wilaya oversight), Users & roles, Volunteers, Feedback — each mounting only when selected. Lists are paginated with "Show more" (users 50, feedback/volunteers 25 per page via offset params on the server fns).
- **Users & roles tab:** user list with email, display name, role, assigned wilayas; Make admin/moderator, Assign wilayas dialog, Remove role, Sign out; self-demote blocked. **"New account"** creates a moderator account directly (email + password + display name + wilayas) via `adminCreateUser` — service-role createUser works regardless of the email-confirmation plan setting; role + wilayas assigned in the same step.
- **Volunteers tab:** applications list (name/email/phone, wilaya, intents, availability, message) with status select (new → contacted → onboarded) and the onboard hint.
- **Feedback tab:** visitor messages, kind badges, device + page provenance.
- All mutations go through `src/lib/admin.functions.ts` server functions, which re-check the caller's admin role from the request token on every call — a demoted admin loses access on the next request.
- **Verified live by `e2e/admin.spec.ts` + `e2e/activity.spec.ts`:** assign Oran to a moderator → moderator sees only Oran pending rows and approves one → remove the wilaya and the role → demoted lockout; overview stats and wilaya oversight render with real counts. The 2026-08-28 refactor (tabs/pagination/create-account) was verified with tsc + unit suite + build; hands-on click-through still queued.

## 5c. User dashboard (`/activity`) — verified end to end (2026-08-18)

- Any signed-in user (no role needed). Three sections — My plantings (with review status: under review / on the map / not approved + moderator note on rejection), My care logs, My fire reports (with triage status) — each with count, empty state + CTA, loading skeleton, and an error banner.
- Data paths: own sites and care logs via RLS directly (`sites_read_own` / public care read); own fire reports via the `myFireReports` server function — `fire_reports.user_id` is deliberately not column-granted to clients (PII protection), so the server filters by the caller's token and returns only public-safe columns. No schema change was needed.
- Nav: signed-in users get a "My activity" header link. Anonymous submitters keep using receipt links (`/my/<token>`) — the two systems don't overlap.
- **Verified live:** regular fixture user sees all three sections with real rows and correct status pills; a submission-free user sees all three empty states; signed-out visitors are redirected to `/auth`.

## 6. Auth (`/auth`) — partly verified

- Email/password sign in and sign up. One admin account exists (the owner, promoted by the roles migration).
- `handle_new_user` creates the profile row at signup. Staff privilege lives in `user_roles` and is managed from `/admin` (2026-08-17) — the first admin was seeded in SQL; `profiles.is_moderator` is a trigger-synced flag, never written directly.
- **Verified 2026-08-13 (evening):** signed in with the moderator account headlessly and drove the whole dashboard.
- **Not verified:** sign-up email confirmation behaviour, password reset (no reset UI exists), and Google/social sign-in (not implemented).

## 7. Photo serving (`/api/public/photo/*`) — verified; local-env gap

Private bucket, no storage policies, service-role fetch re-served with long cache headers. Returned HTTP 200 for a real object during an earlier pass.
**Gap found 2026-08-13 (evening):** locally the proxy returns 500 because `.env` has no `SUPABASE_SERVICE_ROLE_KEY` (the server-side admin client throws on creation). This is an environment-config gap, not a code bug — the key is injected by the host in production. Screenshots of the dashboard therefore show the fire report photo missing locally.

## 8. Abuse protection and the privacy contract — implemented (2026-08-17)

The gate is four layers, all server-side, no third-party dependency:

- **Honeypot, silent-drop.** A filled hidden field returns a normal-looking success screen but persists nothing and records nothing — bots are never told they were caught. **Verified live by E2E:** honeypot-filled submit shows the success screen, no receipt link, and zero rows in the DB.
- **Submit-timing floor** (rejects submissions faster than 1.2s).
- **Hashed-IP hourly rate limits** via `submission_meta` (planting 6, care 20, fire 8). Raw IPs are never stored — only `SHA-256("<project-id>:<ip>")`.
- **Daily-rotating device hash** (new): the browser sends a random per-browser secret (localStorage, created on first use); the server stores only `HMAC-SHA256(server key, SHA-256(secret + kind + UTC date))` in `submission_meta.device_fingerprint`. Same hourly limits per device+kind, so a VPN-hopping bot on one browser still hits the wall.

**Privacy contract (the deliberate trade-off):** the device hash makes submissions **same-day linkable** ("this browser sent these reports today") and **cross-day unlinkable** (the date in the preimage rotates the hash at UTC midnight; a trailing-1h limit check that straddles midnight can undercount — accepted). The raw secret is never stored; clearing localStorage mints a new identity. It is not a fingerprint: it carries no browser or device characteristics. **Cloudflare Turnstile: dropped by decision (2026-08-16)** — no Cloudflare dependency.

**Receipt links and anonymity:** the receipt token is a 128-bit UUID shown once on the success screen; only its salted SHA-256 hash is stored (table `receipts`, deny-all RLS, service-role only). `/my/<token>` returns kind, status, date and wilaya — never reporter PII, never the photo. Losing the link is unrecoverable by design.

## 9. Offline tolerance — implemented, not verified

`submitResilient()` retries a submission once connectivity returns. Not tested under real network loss.

## 10. Volunteer recruitment (`/volunteer`) — built 2026-08-28, account-first flow 2026-08-29

A warm, civic ask for wilaya-moderator candidates: hero ("Every green dot starts with a person"), what volunteers do / what we ask / what we never ask (money, equipment, **firefighting** — "we are a community map, not an emergency service; call Protection Civile 14/1021"). **Account-first flow (2026-08-29):** signed-out visitors create an account inline (email + password) before the application form appears (email locked to the account); "We review every application within 24 hours max" — if accepted, the same account becomes the moderator login. Form: name/email/phone-whatsapp/wilaya (58)/extra-wilayas/intent chips/availability/message (honeypot) → `public.volunteers` via service role, linked to `user_id` when signed in. Admin sees applications on `/admin` (status new → contacted → onboarded); **one-click onboard** ("Approve & make moderator") assigns role + wilaya to the linked account. **Live:** migration applied 2026-08-28 via MCP (+ `user_id` 2026-08-29); shape verified against the live table.

## 11. Not built at all

- Alerting (email/SMS) — the storage-only `alert_contacts` table and its moderator screen were **dropped 2026-08-20** (never wired to send anything; rebuild planned after the mobile phase and PR queue — see `ROADMAP.md` "Parked").
- Any Arabic/French UI translation. Wilaya Arabic names exist in data; the interface itself is English only.
- Search, per-wilaya pages, user profiles, leaderboards, sharing cards.

## 12. Automated tests (2026-08-18)

- `bun run test`: 105 unit tests (geometry, wilayas, abuse gate incl. silent-drop + device-hash, submissions validation, Google Maps link parsing, feedback schemas) — 2026-08-28 run.

## 11b. Arabic interface (2026-08-28) — implemented

Arabic is the default UI language; English is one toggle away (top bar «عربي / English», persisted in `ga-locale`). Everything is translated from the reviewed master table in `docs/I18N_AR_MASTER.md` — warm-plain MSA, official terms verified against Algerian authorities («الحماية المدنية» 14/1021, Law 18-07 official title), wilaya names in Arabic, full RTL layout with self-hosted Noto Sans/Kufi Arabic, locale-aware dates and numeral agreement. Tooltips added for the less obvious bits (legend, leaderboard, needs-water, receipt link). See `CHANGELOG.md` forty-ninth pass for the phased list.
- `bunx playwright test`: 16 live E2E tests — `e2e/flows.spec.ts` (5 core flows), `e2e/admin.spec.ts` (3 role-management flows), `e2e/receipts.spec.ts` (receipt round-trip, unknown-token, silent drop, wilaya-only), `e2e/activity.spec.ts` (4 dashboard flows: auth redirect, own activity, empty states, admin overview). Fixtures are SQL-seeded per the recipe in `SYSTEM_INSTRUCTIONS.md` and cleaned up after.
- RLS battery: `rls-audit3.mjs` role-matrix (anon / regular / wilaya-moderator / admin) — 40/40 checks green on 2026-08-17, including cross-wilaya write no-ops, contact scoping, self-promotion denial and trigger sync.

## 11c. Filming privacy mode (2026-08-29) — implemented

Sensitive data on staff pages (`/moderate`, `/admin`, `/activity`) is **masked by default** so the owner can film without leaking: volunteer names → first letter + •••, emails → `ab***@domain`, phones → `05••••••`. An Eye/EyeOff toggle sits in the top bar (staff pages only), persisted in `ga-privacy` (default ON). ContactReveal stays on-demand by design (deliberate click = the "decide to show" action).

## 11d. Satellite hotspots (NASA FIRMS) — built 2026-08-31, display-only

A fourth map layer next to Trees/Care/Fires: **amber hollow-ring dots** for NASA FIRMS satellite fire detections (VIIRS NOAA-21 NRT, 2-day window — Suomi NPP retires 2026-11-01, so SNPP was never an option). Fetch is server-side (`/api/public/hotspots`, key stays secret, edge-cached 10 min, 502-with-no-store on failure so clients keep last good data). Filtering: drop `low` confidence (NASA: mostly sun-glint), mask **13 static flare zones** (Hassi R'Mel 30km, Hassi Messaoud ×3, In Salah, In Amenas ×2, Ohanet, Gassi Touil, Hassi Berkin, Ouargla 25km, El Borma, Ghadames border — calibrated against the live feed), and a **persistence mask**: south of 33.5°N, a pixel repeating on 2+ distinct days is static infrastructure (62 industrial vs 23 real-fire repeat clusters in the verification feed; northern multi-day fire fronts are never touched). Click opens a detail sheet (confidence, FRP MW, pixel temp °C, acquisition time, satellite + day/night, wilaya when derivable) with honest "not ground-verified" copy, the Protection Civile line, and NASA FIRMS attribution. No schema, no realtime, not in list/board views, no CSP change. Verified: 13 unit tests (parser/filters/masks/country clip), live-feed calibration (483 raw → 146 shown after all filters; results clipped to the wilaya polygons — the API bbox otherwise leaks Morocco/Tunisia/sea), WebKit + Chromium probes (dots render, panel opens, 4 chips no overflow at 320px).

## 11e. PWA basics (2026-08-31) — installable, push-ready

The site is an installable PWA: `manifest.webmanifest` (Arabic name, standalone, sage background, plant theme color), icons 192/512 + apple-touch-icon (upscaled from the 128px logo — a crisp 512 master would be better), and a deliberately tiny service worker (`public/sw.js`): precaches the logo/icons, cache-first for `/assets/*` only, **no page caching** (SSR stays fresh), and **push + notificationclick handlers pre-wired** so enabling alerts (phase B) never needs a SW update. Registration is production-only (`src/lib/pwa.ts`). The install banner (`pwa-install.tsx`) shows once: Chromium gets the native `beforeinstallprompt` flow, iOS gets the Share → Add to Home Screen instructions (iOS has no programmatic prompt); dismissed state persisted. iOS 16.4+ installs from the Share menu — the path Web Push needs later. Verified: static files 200, SW registers (Chromium + WebKit), iOS banner renders correct Arabic; the Chromium native prompt is a headless limitation, device check queued.

## 11f. Web Push fire alerts (2026-08-31) — built, not pushed

Browser fire alerts, free and account-free: a card on `/fire` (form + success screen) enables Web Push, optionally scoped to one wilaya (default: all of Algeria). Subscriptions live in `public.push_subscriptions` (RLS on, zero client grants; endpoint + keys + optional wilaya — pseudonymous). After a fire insert, `notifyFireSubscribers` fans out server-side (awaited — serverless freezes after the response; total — a push failure never breaks the submission): Arabic notification «🔥 حريق جديد في {wilaya}», high urgency, 24h TTL, per-wilaya topic (coalesces repeats), stale endpoints (404/410) pruned. Post-2019 subscriber wilayas resolve to the historic parent (`shouldNotify`, unit-tested). VAPID pair in env (public key inlined in the bundle by design; private server-only; subject is the repo URL — Safari rejects localhost subjects). iOS needs the installed PWA (phase A) — the card states the requirement implicitly by just working there. /privacy gained a push-subscriptions line (AR+EN). Verified: schema + scope tests, tsc, build; live pipeline probe — fire in 16 targeted exactly the wilaya-16 + all-Algeria rows (the 31 row excluded), submission unaffected by send failures. **Not verified:** real browser subscribe + delivery (headless Chromium forces `Notification.permission: denied`) — owner's device test at release.

## 11g. IP geolocation pre-fill (2026-09-01) — built, not pushed

Forms now start one step ahead: Vercel's free IP-geolocation headers (`x-vercel-ip-latitude/longitude`) are read per request in `src/server.ts` (never stored), injected by SSR as `window.__GA_GEO__`, and `LocationField` uses them to **pre-select the wilaya** (derived via the existing polygons) and **center the picker on the visitor's city** (zoom 9 vs country 4.4). It's a suggestion only — the user can change it, and the server derives the real wilaya from the pin anyway, so a wrong hint (mobile carrier NAT resolving to Algiers) can't corrupt data. The autofill note is honest about the source: "Detected from your pin" (GPS) vs "Guessed approximately from your connection" (IP), AR+EN. Absent off-Vercel — local behavior unchanged. Verified: SSR injects the hint with headers and `null` without; probe with mocked headers → wilaya 16 pre-selected + the IP note visible.

## 11h. GPS trio (2026-09-01) — built, not pushed

Three small accuracy wins. **Median fix:** the 12 s GPS watch no longer trusts the single "best accuracy" reading (a lucky outlier can sit tens of meters off) — `medianFix` (lib/gps.ts, unit-tested) takes the 3 most recent ±100 m fixes and medians them. **WiFi hint:** Android users see "turn WiFi on (even without connecting) usually sharpens the fix" while the watch runs (Google's location service uses WiFi scanning). **Viewer controls:** the home map gains MapLibre's `GeolocateControl` ("find me" during fire waves) and a metric `ScaleControl` (km bar for judging fire distances). Verified: 4 new unit tests (157 total), tsc, build; probe — both controls render, scale reads "50 km".

## 11i. Fire weather on details (Open-Meteo, 2026-09-01) — built, not pushed

Fire report and satellite hotspot panels now carry a **"Weather now"** block: temperature, humidity, wind (speed, compass direction, gusts) — the spread-danger context, on-demand per open panel. Open-Meteo: free, no key, server-side fetch (`weather.server.ts`, 8 s timeout, 0.1°/30 min cache), `getFireWeather` server fn returning `null` on failure (the block just hides — never breaks the page). Compass mapping is a shared pure helper (`lib/weather.ts` — the client can't import `.server.*` files; the build's import-protection caught this and the split is the fix). Arabic compass labels («رياح 11 كم/س شرق»). Verified: 4 unit tests (161 total), tsc, build; live probe — a Sahara hotspot panel shows real data (43.4°C · 9% · E 11 km/h).

## 11j. Rain-aware watering (Open-Meteo, 2026-09-01) — built, not pushed

"Needs water" is no longer a dumb 14-day timer. The time rule still runs (no care in 14 days), but the home page then makes **one batched Open-Meteo call** (multi-coordinate, 14-day `precipitation_sum`) for just the thirsty candidates: **≥ 10 mm of rain in the window clears the flag** — nature watered it. Rainfall unknown (API down) → time-only behavior, never a false "all good". Threads through the stats strip, the list badge, and the detail notice via an optional `rainBySiteId` map; `needsWater(site, logs, rainMm?)` stays backward-compatible (6 unit tests incl. the rain branches). Verified: 167/167 tests, tsc, build; the multi-coordinate response shape validated against the live API (Algiers 0.8 mm / Hassi Messaoud 0 mm, 15 daily values each).

## 11k. Smoke / air quality on fire details (Open-Meteo AQ, 2026-09-01) — built, not pushed

The fire/hotspot "Weather now" block gains a smoke line: **PM2.5 µg/m³ with a plain-language band** (US AQI breakpoints: good / moderate / unhealthy for sensitive people / unhealthy) **plus Saharan dust µg/m³** — the pair that tells a fire's smoke from a dust storm. CAMS gridded data via the Open-Meteo Air Quality API (no key, server-side, same 30 min cache), `getAirQuality` fn, fail-soft like the rest. `pm25Band` is shared-pure in `lib/weather.ts` (not `.server.*` — the import-protection rule). Verified: 4 new unit tests (169 total), tsc, build; live AQ shape check (Collo area: PM2.5 19.3, dust 17.0).

## 11l. Commune dropdown (2026-09-01) — built, not pushed

The free-text commune field is now a dropdown: **1,541 communes from the Journal Officiel dataset** (`islam-re/Algeria-wilayas`, MIT — vendored as generated `src/data/communes.ts`, all 69 wilayas so phase G lights up free). Per-wilaya list (Algiers: 57), Arabic labels in AR mode, **canonical Latin name stored** for uniform data. Disabled until a wilaya is chosen; "Other" keeps a free-text escape hatch for dataset gaps. Kills typos and mixed-language commune values, and makes moderator filtering by commune meaningful. Verified: probe — wilaya 16 (IP hint) → 59 options with Arabic labels/Latin values, "Kouba" stores as `Kouba`, «أخرى» reveals the free-text input.

## 11m. Species suggestion from photos (PlantNet, 2026-09-01) — built, not pushed

The plant form gains an **"Identify from the photo"** button once a photo is picked: the compressed image goes server-side to PlantNet (key secret, 15 s timeout), and the top 2 suggestions (score ≥ 0.15) appear as one-tap chips that fill the species field — *"Aleppo pine (Pinus halepensis)"*. Suggestion only, never auto-assert; fails soft to nothing when the service is down or unsure. Free tier 500/day (we're at single digits); unthrottled in v1 (worst case is quota burn → quiet feature, no data/cost risk). Localized labels (`lang=ar` in AR mode). Verified: 2 unit tests (171 total), tsc, build; **live key check** — a Wikimedia Aleppo pine photo returned Maritime pine 0.38 + Aleppo pine 0.30 as top-2.

## 11n. Wilayas 69 — the 2025 administrative division (2026-09-01) — built, not pushed

The platform now runs the current 69-wilaya map (Law 26-06, JO No. 25, April 2026). New polygons (`namrouche993/algeria-wilayas-geojson` v69, MIT) regenerated into the app's Mercator-SVG format — sharper borders than the old Natural Earth 10m set, and every wilaya (incl. the 2019 ten) has its own geometry, so `mapCode` is now the identity mapping. The 69-entry list (AR+Latin names from the Journal Officiel dataset) drives every dropdown; the commune dropdown (phase F) was already 69-ready. **Data continuity:** `moderator_wilayas` assignments get territory-preserving expansion (2019+2025 children — the SQL ran, 0 rows needed it today: all 3 moderators hold childless codes); exact-pin sites/fires re-derived against the new polygons (all 6 already correct); approximate rows keep the submitter's chosen wilaya by design. New wilaya codes are official: 59 Aflou←03, 60 Barika←05, 61 El Kantara←07, 62 Bir El Ater←12, 63 El Aricha←13, 64 Ksar Chellala←14, 65 Aïn Oussera←17, 66 Messaad←17, 67 Ksar El Boukhari←26, 68 Bou Saâda←28, 69 El Abiodh Sidi Cheikh←32 (verified against `wilaya-hierarchy.json`, not the earlier ROADMAP guess — several codes differ). Verified: 184/184 tests (13 new geo cases incl. all 11 new wilayas + Timimoun/Touggourt), tsc, build, 69 borders render (89 features/59 codes in one viewport).

## 11o. Announcement banner (2026-09-01) — built, not pushed

A site-wide, admin-controlled banner for releases and important notes. Admin gets a 5th tab («الإعلانات» / Announcements): create (title ≤120, body ≤600, kind info/success/warning), publish/unpublish (one live at a time — activating one clears the others), delete with two-step confirm. Visitors see the active banner once per announcement (dismiss persisted per id — a new announcement re-shows). Security: writes are `requireAdmin` service-role fns; anon reads are RLS-limited to the active row only. Verified: live probe — SQL-activated test announcement rendered on the home page and dismissed; cleaned up after.

## 11p. Test pyramid: the missing middle (2026-09-01)

The suite was 184 pure-function unit tests — the pyramid's base with nothing between it and the 16 live E2E flows. Research (addyosmani/agent-skills TDD: pyramid 80/15/5, DAMP, "behavior worth having is behavior worth testing"; mattpocock/skills: test through the module's interface) led to the missing layer: **component behavior tests** with testing-library + happy-dom, aimed at the components that actually broke before: `CommuneField` (5 tests incl. the probe-caught Other-hatch bug as a regression test with a stateful harness), `SpeciesSuggest` (suggestion chips fill species only on user pick — never auto-assert), `FireAlertsCard` (the insecure-context honesty state). 192 tests total (16 files), `*.test.tsx` added to the runner + jest-dom setup. Philosophy going forward: behavior through the interface, DAMP names, probes for browser-only legs.

## 12. Design system (2026-08-18, post-viral Sprint 4 + owner-directed revision)

The app runs its own design system (`docs/DESIGN.md`), built for Green Algeria and revised against the `design-taste-frontend` and `impeccable` rubrics:

- **Light theme default** — sage canvas, white cards, ink text, lime `#9fe870` on primary CTAs only. **Dark theme** via toggle (persisted, no-flash script) — same system repolarized.
- **Typography:** Manrope 900 for the hero display (Inter 900 was judged generic by the taste rubric), Inter for body. 900 hero-only, 600 below.
- **Shell split:** public pages (home, about, forms, `/my/*`) get a top nav-bar; app pages (`/moderate`, `/admin`, `/activity`) get the sidebar shell with a lime-dot active indicator (the 4px side-stripe was dropped — it's on the impeccable ban list).
- **Anti-slop pass:** numbered 3-card strips, hero-metric stat cards, decorative tracked eyebrows and default glassmorphism were all removed from the home (they're on the rubrics' ban lists). Buttons get `:active` tactile feedback; transitions use exponential ease-out curves; reduced-motion respected.
- **Semantic mapping:** plant → positive green, care → cyan, fire → negative red. Lime is never a semantic color.
- Verified visually across home (desktop + mobile), `/plant`, `/moderate`, `/admin`, `/activity` in both themes; full E2E suite green after the revision.

## 13. Scale posture (2026-08-18, Sprint 8)

Done in code/schema:

- Composite indexes on the hot read paths: `sites(status, created_at)`, `fire_reports(status, created_at)`, `submission_meta(kind, created_at)` and `submission_meta(device_fingerprint, kind, created_at)` — the last two match the gate's two rate-limit queries exactly.
- Every list query is bounded: home sites 2000 / care 3000 / fires 1000 (data.ts), pending queue 200, contacts 200, admin user list 500 (+ auth list perPage 200).
- Photos are immutable UUID paths uploaded with `cacheControl: 31536000` and served through the proxy with long cache headers — CDN-safe as-is.
- Auth: staff can now sign out from the header (was missing — there was no logout path at all).

Owner actions before launch (not code): Supabase Pro ($25/mo), Vercel Pro + Firewall rules on the public POST endpoints (defense-in-depth on top of the gate), the 1k-concurrent load test against the deployed URL (needs the deploy target and a stable route to supabase.co — the local route was down during this sprint), and the spam-flood rerun at scale.
