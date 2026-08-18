# FEATURES.md

Status of every user-facing flow. "Verified" means I traced the code path end to end and, where noted, exercised it against the running app on 2026-08-13, with a full re-verification pass on 2026-08-18 (E2E suite 16/16, unit 91/91, build clean). "Not verified" means the code exists and reads correct but I did not execute it.

Smoke check performed: `GET /`, `/about`, `/plant`, `/care`, `/fire`, `/auth`, `/moderate` all return HTTP 200 from the dev server, and `/api/public/photo/sites/<real-object>` returns 200 with a real stored image.

## 1. Home map (`/`) — works, verified live in both themes

- **The map IS the home (2026-08-18, owner-directed rebuild):** MapLibre GL + OpenFreeMap vector tiles (open-source, no API key) fill the viewport under a slim top bar. WebGL-smooth pan/zoom, real geography with Arabic labels rendered correctly (the RTL text plugin is mandatory — without it Arabic renders reversed and detached). Algeria stays framed via `maxBounds`; a recenter control returns to it. **No clustering anywhere** — every tree, care log and fire shows as its own dot at every zoom (the product's purpose is a map that turns green; fires are always individual and pulsing). Care dots are offset slightly so they peek out from under a site's tree dot.
- **Wilaya boundaries** in green (theme-aware colors — brighter on dark) from the converted polygon data (`src/lib/wilaya-geo.ts`); click a wilaya to zoom into it.
- **Chrome:** slim top bar (hamburger drawer with the full nav, brand, SOS, theme toggle, auth). The **SOS pill lives in the top bar** and expands above everything — emergency numbers: Protection Civile 14 and 1021, Police 17, Gendarmerie Nationale 1055, SAMU 16 (owner-corrected). Legend + Map/List toggle float top-right. The **action card** (hero copy, stats line, CTAs, layer chips) has a smaller 2-line title and a hide button; hidden state leaves a sticky show button at bottom-left.
- **Detail panel** (site/care/fire details + Directions link) hardened: images capped (`max-h-44/52`), no horizontal overflow.
- Loads approved sites, care logs and fire reports through TanStack Query with explicit safe column lists (`src/lib/data.ts`). Realtime: one channel, filtered (`sites` approved, all `fire_reports`, `care_logs` INSERT) — **verified live:** a care log inserted via SQL appeared as a new blue dot with pulse, no reload.
- "Needs water" badge is a client-side derived flag: no care log within 14 days (`needsWater()` in `src/lib/types.ts`). **Verified by reading the implementation.**
- **Load-bearing dev note:** `optimizeDeps.exclude: ["maplibre-gl"]` in `vite.config.ts` — without it the maplibre worker 404s in dev and every GeoJSON source silently never renders (the day-long "no dots/borders" saga's root cause, with a StrictMode double-mount race as the second).

## 2. Report a planting (`/plant`) — works, verified live

- Photo required, camera-capable, compressed on-device to max 1024px / WebP-JPEG before upload.
- **Wilaya-first location (2026-08-17):** the wilaya dropdown is the primary control and works without GPS. An exact pin is optional precision on top — GPS button (gesture-gated, with a "used once, never stored, never tracked" privacy line), the MapLibre picker behind "Adjust on map" (hidden by default), **or pasting a Google Maps link** (2026-08-18): the input parses `@lat,lng`, `!3d!4d` place segments and `q|query|ll|center|destination=` params client-side (unit-tested), and short `goo.gl`/`maps.app.goo.gl` links resolve via the `resolveMapsLink` server function. With no pin, the server stores the wilaya's display centre and marks the row `location_approximate = true`; the detail panel and list view show an honest "wilaya-level" badge instead of fake precision. With a pin, the server still derives the wilaya from the coordinates (client value ignored).
- GPS accuracy is shown as a colour-coded badge (±m, excellent/good/rough/poor) and as an amber accuracy-radius circle on the picker map. **Verified headlessly with Playwright geolocation overrides; not exercised on a real phone.**
- Species, tree count, planted date (defaults to today, capped at today — **and rejected server-side when in the future**, same for care `logged_date`), optional display name, optional notes.
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

- Behind the platform-managed `_authenticated` gate; the page additionally checks `isModerator` before running any query.
- **Wilaya scoping (2026-08-17):** every queue, triage and contact query is scoped by RLS — admins see everything, moderators only their assigned wilayas (`private.can_moderate`). A moderator with no assignments sees an empty queue. **Verified live:** the E2E admin round-trip seeds pending rows in Alger and Oran, assigns Oran to a moderator, and that moderator sees and approves only the Oran row.
- **Section navigation is a segmented tab bar** (`ModTabs`, 2026-08-18) — the old second sidebar is gone (the app shell already provides one; the double sidebar was an owner-flagged bug). Tabs carry live count badges: Pending plantings, Fire reports, Alert contacts.
- Stats strip: pending, approved today, active fires, total submissions — head-count queries (`head: true`), no row fetches.
- Pending plantings: oldest-first list with photo, approve/reject via direct RLS-scoped `sites` update (`sites_moderator_update`), writing `status`, `reviewed_by`, `reviewed_at` and an optional `moderator_notes`. **Verified live by the E2E suite (approve with note, fields asserted via REST).**
- Fire report triage: list with status badge (active/resolved/false alarm), severity, photo, dates; actions Mark resolved / False alarm / Reopen, writing `status` + `resolved_at` under `fire_moderator_update`. **Verified live 2026-08-13: the one live fire report round-tripped Active → Resolved → Active with zero console errors.**
- Alert contacts: add (email/phone segmented control), pause/resume, delete, plus a persistent "nothing is sent yet" notice. `alert_contacts_moderator_all` RLS — moderators manage only contacts fully inside their assigned wilayas; global contacts are admin-only. **Verified live: add + delete round-tripped cleanly.**

## 5b. Admin dashboard (`/admin`) — verified end to end (2026-08-17, extended 2026-08-18)

- Admin-only guard (`isAdmin` from `user_roles`, live read). Two sections: **Overview** (platform stats — users, pending/approved, active fires, care logs, submissions 24h — plus per-wilaya oversight: pending + active-fire counts per wilaya, sorted by load) and **Moderators & roles** (user list with email, display name, role, assigned wilayas; Make admin/moderator, Assign wilayas dialog, Remove role, Sign out; self-demote blocked).
- All mutations go through `src/lib/admin.functions.ts` server functions, which re-check the caller's admin role from the request token on every call — a demoted admin loses access on the next request.
- **Verified live by `e2e/admin.spec.ts` + `e2e/activity.spec.ts`:** assign Oran to a moderator → moderator sees only Oran pending rows and approves one → remove the wilaya and the role → demoted lockout; overview stats and wilaya oversight render with real counts.

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

## 10. Not built at all

- Alerting (email/SMS) — nothing sends alerts; `alert_contacts` now has a moderator management screen (storage only, persistent notice).
- Any Arabic/French UI translation. Wilaya Arabic names exist in data; the interface itself is English only.
- Search, per-wilaya pages, user profiles, leaderboards, sharing cards.

## 11. Automated tests (2026-08-18)

- `bun run test`: 91 unit tests (geometry, wilayas, abuse gate incl. silent-drop + device-hash, submissions validation, Google Maps link parsing).
- `bunx playwright test`: 16 live E2E tests — `e2e/flows.spec.ts` (5 core flows), `e2e/admin.spec.ts` (3 role-management flows), `e2e/receipts.spec.ts` (receipt round-trip, unknown-token, silent drop, wilaya-only), `e2e/activity.spec.ts` (4 dashboard flows: auth redirect, own activity, empty states, admin overview). Fixtures are SQL-seeded per the recipe in `SYSTEM_INSTRUCTIONS.md` and cleaned up after.
- RLS battery: `rls-audit3.mjs` role-matrix (anon / regular / wilaya-moderator / admin) — 40/40 checks green on 2026-08-17, including cross-wilaya write no-ops, contact scoping, self-promotion denial and trigger sync.

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

Owner actions before launch (not code): Supabase Pro ($25/mo), Vercel Pro + Firewall rules on the public POST endpoints (defense-in-depth on top of the gate), the 1k-concurrent load test against the deployed URL (needs the deploy target and a stable route to supabase.co — the local route was down during this sprint), and the spam-flood rerun at scale. Alerting on rate-limit spikes: wire or drop `alert_contacts` — owner decision, flagged.
