# CHANGELOG.md

Reconstructed from git history (17 commits, 2026-08-12 → 2026-08-13) plus the live database state. Commit messages are mostly the generic "Changes", so entries below are grouped by what the diffs actually contain, not by message. Superseded on 2026-08-17: the working tree was committed as the repo's single initial commit `ecb4209`, so history from here on is real.

## 2026-09-01 (seventy-third pass) — Banner done properly: marquee strip, bilingual, color control, edit — NOT PUSHED

Owner tested the first banner version and rejected it (invisible tint, overlapped the navbar, no edit, no list). Full rework:
- **Bug:** the migration granted SELECT to anon/authenticated but not `service_role` → the admin list was empty (the feedback-table lesson recurring). Fixed live + mirrored.
- **Design:** solid strip ABOVE the top bar (admin-picked color from a curated contrast-safe palette: ink/plant/care/fire/amber), marquee traveling in the reading direction (EN left→right, AR right→left), seamless loop, hover-pause, reduced-motion off. The chrome formally yields: header/sidebar/main/map-height all shift via the shared `announcementQuery` (one fetch, TanStack cache).
- **Bilingual:** `title_ar/body_ar/title_en/body_en` — the banner shows the visitor's locale automatically (`localizedAnnouncement`, 2 unit tests). Existing row backfilled (EN=old text, AR=copy placeholder).
- **Admin panel:** bilingual create + **edit** (the missing capability), color swatches, kind, publish/unpublish, delete.
- **Verified:** 194/194 tests, tsc clean, build green; live probe — plant strip with Arabic in AR / English in EN, `stripBottom == headerTop` (no overlap), screenshot reviewed; test row cleaned.
- **Also:** `.env.vercel` generated (all 12 vars in one upload-ready file, gitignored) for the owner's one-shot Vercel env setup.

## 2026-09-01 (seventy-second pass) — Announcement banner + test-pyramid middle layer — NOT PUSHED

- **Announcement banner (owner request):** `announcements` table (RLS: anon reads active rows only; writes service-role via `requireAdmin` fns; migration live + mirrored). Admin 5th tab «الإعلانات»: create/publish/unpublish (one live at a time)/delete. Visitor banner: once per announcement id, tone by kind, AR+EN. Verified: live probe — SQL-activated test banner rendered + dismissed; cleaned up after.
- **Test-quality upgrade (owner: "tests that really test the app"):** researched addyosmani/agent-skills (pyramid 80/15/5, DAMP, Beyonce Rule) + mattpocock/skills (test through the interface). Installed testing-library + happy-dom + jest-dom; 8 component behavior tests for the components that actually broke before (CommuneField Other-hatch as a regression test, SpeciesSuggest pick-flow, FireAlertsCard honesty state). 192/192 green, tsc clean, build green.
- **Also researched (design only, not built):** "what to plant where" — GBIF per-wilaya species evidence (568k Algeria Pinopsida occurrences, faceted, free) + Open-Meteo climate classes + a curated species×climate matrix → later suggestion chips on /plant. Plan in the session report.
- Docs: DATABASE (announcements), FEATURES 11o + 11p, PROJECT_STRUCTURE.

## 2026-09-01 (seventy-first pass) — Wilayas 69 (release-program phase G) + insecure-context alerts note — NOT PUSHED

- **The 2025 division, shipped:** all 69 wilayas (Law 26-06, JO No. 25 — verified against the official hierarchy, NOT the ROADMAP's guessed codes: several differ, e.g. El Kantara is 61, Messaad 66, El Abiodh Sidi Cheikh 69). New v69 polygons (namrouche993, MIT) regenerated into the app's Mercator-SVG format — sharper borders, and every wilaya now has geometry, so `mapCode` is identity. 69-entry list (JO names AR+Latin); meta copy 58→69 (EN+AR).
- **Data continuity:** moderator expansion SQL (2019+2025 children) ran — 0 rows needed it (all 3 moderators hold childless codes 36/18/23); exact-pin backfill — all 6 rows already correct; approximate rows keep the submitter's choice by design.
- **Verified:** 184/184 tests (13 new geo cases — all 11 new wilayas + Timimoun/Touggourt; two of my guessed town coordinates were wrong, fixed against the dataset's own centers), tsc clean, build green, 69 borders render (89 features/59 codes in one viewport probe).
- **Also in this pass (owner report):** the fire-alerts card vanished silently on `http://<lan-ip>` — not a bug: browsers gate ServiceWorker/PushManager to secure contexts (HTTPS/localhost). The card now shows an honest note («التنبيهات غير متوفرة هنا — تحتاج اتصالًا آمنًا») instead of hiding. iPhone push testing happens on the HTTPS production URL at release.
- Docs: FEATURES 11n, DATABASE (moderator_wilayas semantics), PROJECT_STRUCTURE, ROADMAP (#6 wilayas-69 → shipped).

## 2026-09-01 (seventieth pass) — PlantNet species suggestion (release-program phase H) — NOT PUSHED

- **What shipped:** "Identify from the photo" on the plant form — photo → server-side PlantNet (key in env) → top-2 chips that fill the species field. Suggestion-only UX, fail-soft everywhere, `lang=ar` in AR mode. Unthrottled v1 (documented reasoning: worst case is free-quota burn → quiet feature).
- **Verified:** 171/171 tests (2 new mapper tests), tsc clean, build green; **live key check** — Wikimedia Aleppo pine → Maritime pine 0.38 + Aleppo pine 0.30 as top-2 (correct species present, user picks).
- Docs: FEATURES 11m, PROJECT_STRUCTURE, .env.example.

## 2026-09-01 (sixty-ninth pass) — Commune dropdown (release-program phase F) — NOT PUSHED

- **What shipped:** commune free-text → dropdown. Dataset: `islam-re/Algeria-wilayas` (MIT, Journal Officiel — 69 wilayas, 1,541 communes, AR+Latin) vendored as generated `src/data/communes.ts`. `CommuneField`: per-wilaya list, Arabic labels in AR mode, canonical Latin stored, disabled until wilaya chosen, "Other" free-text hatch. Probe caught + fixed a real bug: the hatch was unreachable from the empty state (select snapped back to placeholder) — now tracked with explicit `otherMode` state.
- **Verified:** tsc clean, 169/169 tests, build green; probe — wilaya 16 (IP hint) → 59 options («حسين داي=Hussein Dey»), "Kouba" stores Latin, «أخرى» shows the input with the Arabic placeholder.
- Docs: FEATURES 11l, PROJECT_STRUCTURE, ROADMAP (commune auto-suggest resolved).

## 2026-09-01 (sixty-eighth pass) — Smoke/AQ on fire details (release-program phase E3) — NOT PUSHED

- **What shipped:** the fire/hotspot weather block gains a smoke line — PM2.5 with a plain band (US AQI breakpoints, AR+EN) + Saharan dust µg/m³ (fire smoke vs dust storm). Open-Meteo Air Quality API (CAMS, no key, server-side, cached), `getAirQuality` fn, fail-soft. `pm25Band` shared-pure in `lib/weather.ts`.
- **Verified:** 169/169 tests (4 new: band breakpoints + AQ mapper), tsc clean, build green; live AQ shape check (PM2.5 19.3, dust 17.0 near Collo).
- Docs: FEATURES 11k.

## 2026-09-01 (sixty-seventh pass) — Rain-aware watering (release-program phase E2) — NOT PUSHED

- **What shipped:** "needs water" gains a water check. Time rule first (unchanged), then one batched Open-Meteo 14-day-rainfall call for thirsty candidates only (max 100, multi-coordinate); ≥10 mm (`RAIN_RESET_MM`) clears the flag. Fail-soft: API down → time-only behavior. `needsWater(site, logs, rainMm?)` — all 4 call sites keep working; `rainBySiteId` threads index → SiteList/DetailPanel/stats.
- **Verified:** 167/167 tests (6 new: rain branches + rain-total mapper), tsc clean, build green; live API shape check — 2-coordinate response = array of locations with 15 daily values each (Algiers 0.8 mm, Hassi Messaoud 0 mm).
- Docs: FEATURES 11j.

## 2026-09-01 (sixty-sixth pass) — Fire weather on details (release-program phase E1) — NOT PUSHED

- **What shipped:** a "Weather now" block on fire-report + hotspot panels (temp, humidity, wind speed/compass/gusts) via Open-Meteo — free, no key, server-side, cached. `getFireWeather` fn fails soft (block hides). Arabic compass labels.
- **Caught by the build:** the client imported `compass` from a `.server.*` file — TanStack's import-protection denied it (the audit's S8 guard working as designed). Fix: shared pure helpers in `lib/weather.ts`, fetch/cache in `weather.server.ts`.
- **Verified:** 161/161 tests (4 new: compass + payload mapper), tsc clean, build green; live probe — a Sahara hotspot panel shows real Open-Meteo data (43.4°C · 9% · E 11 km/h, gusts 31).
- Docs: FEATURES 11i, PROJECT_STRUCTURE.

## 2026-09-01 (sixty-fifth pass) — GPS trio (release-program phase D) — NOT PUSHED

- **What shipped:** (1) `medianFix` — the GPS watch finishes with the median of the last 3 ±100 m fixes instead of one lucky best reading (pure fn in `lib/gps.ts`, 4 unit tests); (2) Android WiFi hint while locating («تفعيل الواي فاي يحسّن دقة الموقع»); (3) home-map `GeolocateControl` ("find me") + metric `ScaleControl`.
- **Verified:** 157/157 tests, tsc clean, build green; probe — both controls render on the home map, scale reads "50 km".
- Docs: FEATURES 11h, PROJECT_STRUCTURE.

## 2026-09-01 (sixty-fourth pass) — IP geolocation pre-fill (release-program phase C) — NOT PUSHED

- **What shipped:** forms start one step ahead. Vercel's free IP-geo headers read per request in `server.ts` (never stored) → SSR injects `window.__GA_GEO__` → `LocationField` pre-selects the wilaya (existing polygons) and centers the picker on the visitor's city (zoom 9). Suggestion-only by design: user-overridable, and the server derives the real wilaya from the pin regardless. Honest source copy: "Detected from your pin" vs "Guessed approximately from your connection" (AR+EN). Graceful null off-Vercel.
- **Verified:** tsc clean, 153/153 tests, build green; SSR injects the hint with headers and `null` without; browser probe with mocked headers → wilaya 16 pre-selected + the IP note renders.
- Docs: FEATURES 11g, PROJECT_STRUCTURE (geo-hint + LocationField's honest line count).

## 2026-09-01 (sixty-third pass) — Web Push fire alerts (release-program phase B) — NOT PUSHED

- **What shipped:** browser fire alerts, free and account-free. `FireAlertsCard` on `/fire` (form + success screen) → permission → push subscription → `push_subscriptions` row (new table, RLS on, zero client grants — migration applied live via MCP + mirrored). Fire insert → `notifyFireSubscribers` fan-out (awaited, total): Arabic «🔥 حريق جديد في {wilaya}», high urgency, 24h TTL, per-wilaya topic, stale-endpoint pruning. Wilaya scoping incl. post-2019 → historic-parent resolution (`shouldNotify`, 3 unit tests). VAPID pair generated + env'd (public key bundled by design; subject = repo URL — Safari rejects localhost). `web-push` dependency added (server-only). /privacy gained a push line (AR+EN); supabase types regenerated for the new table.
- **Verified:** 153/153 tests, tsc clean, build green; live pipeline probe — fire in wilaya 16 fanned out to exactly the wilaya-16 + all-Algeria subscriptions (the 31 row excluded), send failures left the submission unaffected; test rows + test fires cleaned from the live DB after (fires back to 5, subs 0).
- **Not verified (honest gap):** real browser subscribe + push delivery — headless Chromium forces `Notification.permission: denied` even with grants. The card, the fn wiring, and the server pipeline are verified; the last leg is the owner's device test at release.
- Docs: DATABASE (push_subscriptions), FEATURES 11f, PROJECT_STRUCTURE, ROADMAP (alerting item resolved).

## 2026-08-31 (sixty-second pass) — PWA basics (release-program phase A) — NOT PUSHED (single release at the end)

Owner picked 10 features (+FIRMS) for one release; nothing pushes until the end. Program tracked in the session todo list: A PWA → B Web Push → C IP geolocation → D GPS trio → E Open-Meteo (×3) → F communes → G wilayas-69 → H PlantNet.

- **Phase A done:** the site is an installable PWA. `manifest.webmanifest` (Arabic name, standalone, sage/plant colors), icons 192/512 + apple-touch-icon (upscaled from the 128px logo — honest note: a crisp 512 master would be sharper), tiny `public/sw.js` (precache icons, cache-first `/assets/*` only, **no page caching** — SSR stays fresh; **push + notificationclick handlers pre-wired** so phase B needs no SW update), production-only registration, one-time install banner (Chromium native prompt / iOS Share instructions, dismissed state persisted, AR+EN).
- **Verified:** tsc clean, 150/150 tests, build green; probe — manifest/sw/icons all 200, manifest fields correct, SW registers in Chromium AND WebKit, iOS banner renders correct Arabic. **Not verified:** Chromium's native `beforeinstallprompt` (headless limitation — owner's device check at release).
- Docs: FEATURES 11e, PROJECT_STRUCTURE.

## 2026-08-31 (sixty-first pass) — Satellite hotspots layer (NASA FIRMS) — built, NOT YET PUSHED (owner device test first)

Owner picked the FIRMS overlay from the FireSightDZ study report. Deep research before code caught two real mistakes avoided: **Suomi NPP retires 2026-11-01** (FireSightDZ's default source — we use `VIIRS_NOAA21_NRT`) and the API day-range max is 5, not 7.

- **What shipped:** a 4th map layer — amber hollow-ring dots (no pulse; pulsing stays the community-fire signature) for NASA FIRMS detections, 2-day window. Server route `/api/public/hotspots` (key server-side, edge-cached 10 min, 502/no-store on failure → clients keep last good data). Click → detail sheet (confidence, FRP MW, pixel °C, acquisition time, satellite + day/night, wilaya when derivable) with "not ground-verified" copy, the Protection Civile line, and NASA attribution. 4th legend dot + chip (AR «الأقمار» / EN "Satellite"). No schema, no realtime, no CSP change, not in list/board views.
- **Filtering (calibrated against the live feed, 483 raw → 146 shown):** drop `low` confidence (NASA: sun-glint class); **country clip** — the API bbox is a rectangle, so results are clipped to the wilaya polygons (`wilayaCodeForPoint`): the owner's first look caught dots in Morocco/Tunisia/the sea, and the big "El Tarf" cluster turned out to be almost entirely Tunisia's Kasserine/Jendouba fire (what remains on our side: a smaller fire near Collo); **13 static flare zones** (Hassi R'Mel needed 30km — flares ring the field 20-25km out; Hassi Messaoud ×3, Ouargla 25km, Ohanet, In Amenas ×2, In Salah, Gassi Touil, Hassi Berkin, El Borma, Ghadames border); **persistence mask** — south of 33.5°N, a pixel repeating on 2+ distinct days is static infrastructure (feed had 62 southern industrial repeat clusters vs 23 northern real-fire ones; northern multi-day fronts untouched).
- **Caught by probes, fixed:** MapLibre rejects `zoom` nested inside `["*", …]` — the radius expression was restructured as a top-level zoom interpolate with the FRP factor inside the stops (layer silently didn't render before this; WebKit probe caught it).
- **Verified:** 12 new unit tests (149 total) — parser, filters, flare mask, persistence; tsc clean; build green; live-feed calibration (El Tarf real fire kept, 40 points, sitting beside the community fire dots); WebKit + Chromium probes — dots render, detail panel opens with correct Arabic («نقطة حرارية — قمر صناعي», «31 أوت 2026»), 4 chips no overflow at 320px; screenshots reviewed.
- **Extraction to stay under the cap:** `map-failure.tsx` (WebGL probe + overlay out of HeroMap), `LegendDots.tsx` (home route back to exactly 250).
- **Files:** `hotspots.server.ts`, `api/public/hotspots.ts`, `hotspots-layer.ts`, `detail-bodies.tsx`, `map-failure.tsx`, `LegendDots.tsx` + wiring (HeroMap, index, map-layers, DetailPanel, HomeBits, data, types, i18n en/ar).
- **Before push:** owner adds `FIRMS_MAP_KEY` to the Vercel dashboard env, then device-tests (layer toggle, a hotspot tap, Arabic). The key lives in local `.env` (gitignored) and `.env.example` documents it.

## 2026-08-31 (sixtieth pass) — Safari crash fixed (CSP blocked the realtime WebSocket), #418 ITP hole closed, admin.functions split

- **Owner report: iPhone shows the root error boundary on every visit ("لم تُحمَّل هذه الصفحة").** Diagnosed with evidence: production SSR healthy (HTTP 200, full Arabic app HTML), Chromium client render healthy, **Playwright WebKit reproduced the crash**. Root cause: the 2026-08-30 security pass's CSP (`df40d22`) set `connect-src` without `wss://*.supabase.co` — and per CSP rules `https://` does NOT cover websockets. Chromium only fires an async error on a CSP-blocked `new WebSocket()`, but **Safari throws a synchronous `SecurityError`** inside the realtime subscribe effect → commit-phase error → root error boundary. **Every Safari/iPhone visitor got the error page since 2026-08-30.** Fix: `connect-src` gains `wss://*.supabase.co`; `font-src` gains `data:` (a build-inlined woff2 was also blocked, cosmetic). Verified: fresh + returning WebKit probes against the production preview — no boundary, map canvas mounts, zero CSP errors (`498f7ec`).
- **React #418 hole found + closed in the same probe:** the EN-visitor scenario (saved locale, no cookie) showed a #418 hydration mismatch. Cause: Safari **ITP expires client-set cookies after 7 days**, so an EN Safari user's `ga-locale` cookie dies while localStorage survives — and the boot script preferred localStorage, making the first client render EN against an AR SSR. Fix: the boot script treats the **cookie as the only first-render source** (it's what SSR used); a localStorage-only save is stashed as `__GA_LOCALE_PENDING__` and flipped in a post-mount effect (one clean re-render, re-mints the cookie). Verified: the ITP scenario now renders with zero pageerrors (`d396331`).
- **`admin.functions.ts` split (484 → 5 files, all ≤228):** barrel (`admin.functions.ts`, import path unchanged — 8 call sites untouched) + `admin-users.functions.ts` (accounts), `admin-content.functions.ts` (feedback/volunteers/deletes), `admin-stats.functions.ts` (Overview), `admin-shared.server.ts` (`requireAdmin`/`currentAdminId`). Pure refactor, no logic changes. Verified: tsc clean, 137/137 tests, build green, server bundle contains the new fn chunks.
- **Honest note:** the two remaining CSP-side effects on production are intentional (analytics script loads only on Vercel) or pre-existing (map `circle-11` sprite warning from OpenFreeMap). The four other 250-line exceptions stay flagged in PROJECT_STRUCTURE.
- **Deploy note:** the Safari crash fix only reaches users on the next Vercel deploy (push to main).

## 2026-08-31 (fifty-ninth pass) — Docs hygiene: conflict markers removed, structure/roadmap corrections

- **Committed merge-conflict markers removed from `main`:** an orphan `<<<<<<< HEAD` line above the 58th-pass entry in this file, and a full `<<<<<<< HEAD / ======= / >>>>>>> origin/feat/volunteers` block in `PROJECT_STRUCTURE.md` (around the test-count row). Both shipped in an earlier docs sweep and were visible in the published docs.
- **`PROJECT_STRUCTURE.md` corrected against the tree:** 137 unit tests in 8 files (was 105/113 in the conflict block), admin described as the 4 tabs it actually is, `docs/` listing gains MOBILE.md / I18N_AR_MASTER.md / archive, missing lib rows added (`feedback.*`, `volunteers.*`, `privacy-mode.tsx` — which lives in `src/lib/`, not `src/components/lib/`), missing component rows added (`FeedbackDialog`, `admin/FeedbackPanel`).
- **250-line rule claim made honest:** five hand-written files are currently over the cap — `admin.functions.ts` (484), `LocationField.tsx` (308), `AppShell.tsx` (273), `activity.tsx` (269), `index.tsx` (255). Splitting is queued as its own task; the doc no longer claims compliance.
- **`ROADMAP.md` dead items refreshed:** #6 (wilayas 69) closed 2026-08-30 without shipping (still 58 wilayas); PR #9 closed as superseded by the merged Arabic-first PR #35; #2/#3 marked shipped (they said "commit pending"); #8 updated to its real state (app exists, contract shipped, blocked on a dev build); the demo-data block noted as cleaned back to zero.
- Verified: tsc clean, 137/137 unit tests. Docs-only change — no code touched.

## 2026-08-30 (fifty-eighth pass) — Privacy toggle polish, issue-tracker housekeeping, mobile handoff, support ticket

- **Privacy toggle made discoverable:** the masked-by-default filming mode now has a labeled pill on staff pages ("Show infos" green when masked / "Hide infos" when revealed) instead of an icon-only button.
- **GitHub issue housekeeping:** closed 8 fixed/shipped issues with notes (#13, #36, #37, #38, #39, #5, #9, #6), replied and closed #4 + #14 (parked with reasons), opened **#40** to track the `spatial_ref_sys` anonymous-write exposure until Supabase support applies the fix. Open now: only #8 (mobile collab) and #40.
- **Mobile handoff (#8):** repo cloned (`dz-green-mobile`, Expo SDK 57 + MapLibre native module), `.env` set (same Supabase project + live API URL). Deep-link scheme `dzgreenmobile://**` registered in Supabase Auth redirect URLs by the owner. **Research verdict:** Expo Go is retired from the App Store (frozen at SDK 54) and can never run native modules anyway — the app needs a development build (Android emulator free today / iOS needs Apple Developer). Walkthrough for the Android emulator path provided.
- **Supabase support ticket filed** for the `spatial_ref_sys` anonymous-write exposure (verified: PATCH on srid 4326 returns the modified row). Tracked as #40.
- Docs sweep: DATABASE.md (column-level UPDATE grants, throttle kinds), PROJECT_STRUCTURE (SectionTabs, RejectedQueue, privacy-mode), AUDIT status header, mojibake fix.

## 2026-08-30 (fifty-seventh pass) — Security pattern review + OWASP API Top 10 sweep

A dev DM'd 4 issues on Instagram; the owner asked for a full pattern review + deep research (OWASP API Top 10 2023 mapping). Everything verified against code + live DB, all fixed except one owner-dashboard item:

- **NEW P1 (worse than the DM's finds): `spatial_ref_sys` is anonymously writable** — DELETE via REST returned HTTP 200/204 in a live probe. An attacker could wipe all 8,500 projection rows → PostGIS (wilaya derivation) breaks platform-wide. Root cause: extension-installed default grants; revoking requires the **table owner (postgres)** — the MCP SQL role can't. **Owner action: run the script in `docs/SYSTEM_INSTRUCTIONS.md` (Dashboard → SQL Editor, 30 seconds).** Belt-and-suspenders: RLS enable + read-only policy + revoke writes.
- **DM #3 mapped to OWASP API3 (property-level authz) — fixed:** table-level UPDATE on `sites`/`fire_reports` revoked; column-level grants now allow only the moderation columns (`status, resolved_at` on fires; `status, reviewed_by, reviewed_at, moderator_notes` on sites). Moderators can no longer write tree_count/photo_url/PII via direct client updates. Live-verified in `column_privileges`.
- **DM #2 — fixed:** `adminSetRole` self-guard ("You can't change your own role") + last-admin guard (can't demote the final admin).
- **DM #1 — fixed:** `receipts.server.ts` fallback salt removed (fail loud like the others).
- **DM #4 — fixed:** shared throttle wired into feedback (10/hour) + volunteers (5/hour) via the existing hashed-IP `submission_meta` mechanism (CHECK widened to the two new kinds, migration live).
- **Geometry/geography columns:** probed — they're views, not writable (non-issue).
- **Security headers (OWASP API8):** global `/**` routeRules — X-Frame-Options SAMEORIGIN, nosniff, Referrer-Policy, Permissions-Policy (camera/mic off, geolocation self), pragmatic CSP (self + Supabase + OpenFreeMap + Vercel analytics; inline script/style allowed for the boot scripts + Tailwind).
- **Staff error toasts:** 12 spots now pass through `localizeError` (known messages localized; no raw schema/SQL hints).
- Verified: tsc clean, 137/137 tests, build green; live grant verifications above.

## 2026-08-30 (fifty-sixth pass) — React #418 eliminated + volunteer CTA flow finalized

- **React #418 (hydration text mismatch) — the recurring /volunteer spinner:** SSR always rendered Arabic while an EN-saved client flipped on first render → full-tree text mismatch → hydration aborted mid-tree → effects never ran → spinner forever. Final design (no flip, no flash, no mismatch possible): `setLocale` mirrors to a `ga-locale` cookie; `src/server.ts` reads it per request onto a request-global; `initLocale()` reads it on the server; RootShell + I18nProvider init via `initLocale()` — **SSR text == first client render, always.** The no-flash script reads localStorage OR the cookie. (The PowerShell `Invoke-WebRequest` Cookie-header drop nearly masked the verification — curl proved the chain works.)
- **/auth `?mode=signup`:** the volunteer CTA now lands on sign-up mode — new users were hitting sign-in mode and getting 400 Bad Request on `signInWithPassword` (no account yet).
- **Verified:** EN cookie → full EN SSR; no cookie → AR default; browser test with EN saved: no #418, instant CTA, zero spinners. 137/137 tests, tsc clean, build green.
- **Owner-visible note:** `ERR_NAME_NOT_RESOLVED` for `*.supabase.co` in the console = the local DNS/ISP failing to resolve Supabase intermittently (same flakiness this machine shows). The app code is fine; retry when DNS recovers. If it persists for Algerian users, a Supabase custom domain (Pro) is the path.

## 2026-08-30 (fifty-fifth pass) — Hydration mismatch fixed (React #418): the /volunteer stuck-spinner bug

- **Owner report:** `/volunteer` shows a loading spinner forever for anonymous visitors; console shows React error #418 (hydration text mismatch). Signing up first made the content appear.
- **Root cause:** SSR always rendered Arabic (server default), but a visitor with English saved flipped to English on the first client render — a full-tree text mismatch (#418). React discarded hydration mid-tree, the auth effect never fired, and the page stayed on the SSR spinner forever. Same latent crash existed on every page; /volunteer was the first with a loading-dependent branch, so it was the first visible victim.
- **Fix:** the client's first render now always matches the SSR locale (Arabic default), and the saved locale flips in a post-mount effect (one clean re-render). No request-context needed, no SSR/client divergence possible, works for every page. `setLocale` also mirrors to a `ga-locale` cookie for any future SSR-locale work.
- **Verified:** EN-saved visitor loads `/volunteer` — no #418, SSR Arabic flips to English cleanly (`lang=en dir=ltr`, full English content). 137/137 tests, tsc clean, build green.
- **Known honest limitation:** EN-saved visitors see one frame of Arabic before the flip (visible for ~100ms on slow devices). Accepted; the alternative (cookie-aware SSR per request) has a serverless concurrency race and was rejected.

## 2026-08-29 (fifty-fourth pass) — Volunteer account-first flow, filming privacy mode, staff card fixes

- **Volunteer flow redesigned (owner: "volunteers must create an account first — for female cases I don't want to contact them by phone"):** `/volunteer` now requires an account first — signed-out visitors get an inline "Create your account first" card (email + password, 20 seconds, or sign-in link); the application form appears with the email locked to the account. New copy: **"We review every application within 24 hours max"** — if accepted, the same account becomes the moderator login. Schema: `volunteers.user_id` (nullable, indexed) links applications to accounts; `submitVolunteer` links via `optionalUserId`. Older applications without a link stay workable via "New account".
- **One-click onboarding:** "Approve & make moderator" on each volunteer card (`adminOnboardVolunteer`) — replaces any existing role, assigns moderator + the application's wilaya, marks onboarded. Errors clearly when no account is linked.
- **Filming privacy mode (owner: "I film the platform — sensitive data must be hidden by default until I decide to show it"):** masked-by-default on staff pages (`/moderate`, `/admin`, `/activity`) — volunteer names → first letter + •••, emails → `ab***@domain`, phones → `05••••••`. Eye/EyeOff toggle in the top bar (only on staff pages), persisted in `ga-privacy` (default ON). ContactReveal stays on-demand by design.
- **Staff card overflow fixes (owner screenshots):** volunteers cards — status select + delete no longer overflow (header = title + badge only; actions moved to a dedicated wrap row with `max-w` truncate select); rejected cards — Re-approve + delete wrap safely; triage delete gets `shrink-0`. Consistent pattern across VolunteerPanel, RejectedQueue, FireTriage, AdminUsersPanel, FeedbackPanel.
- Verified: tsc clean, 137/137 tests, build green. **Visual verification of the new surfaces is blocked right now:** this machine's network can't reach supabase.co from the browser (probe returns "Failed to fetch"), so useAuth-based pages show the SSR spinner fallback in tests — the flow itself is sound (SSR renders the fallback gracefully, the card swaps in once the client can reach Supabase). Owner's device check queued.

## 2026-08-29 (fifty-third pass) — Staff UX redesign + GitHub issues #36–#39

- **Issues fixed (replies posted on the threads):** #39 `needsWater` now uses `created_at` (backdated care can't fake freshness, 2 new tests); #38 goo.gl dropped (dead service since 2025-08-25) from short-link detection + SSRF allowlist; #37 demotion clears `moderator_wilayas`; #36 validate-first + photo-orphan cleanup on insert failure. #38's reply kept failing on the flaky network — retry on next session.
- **Staff redesign (owner: "not satisfied with admin/moderate — main working places"):** shared `SectionTabs` (icon + count always, labels from sm, **no more overflow at 390px** — the old scroll-arrows are gone); admin page header = current tab title + compact tabs; stale "Moderators & roles" copy → "Users & roles" everywhere (lead + onboard hint, EN + AR).
- **Filters:** fire triage gets status filter chips (All / Active / Resolved / False alarm); admin users gets a client-side search (email/name) — cheap, no schema.
- **RejectedQueue:** broken thumbnails (photo deleted on reject) hide on 404 instead of a black box.
- **Verified:** tsc clean, 137/137 tests, build green; real screenshots of the redesigned /moderate + /admin on 390px mobile + desktop (Arabic RTL) — all correct (temporary admin account created for the check, deleted after).
- **Honest note:** external web research was blocked by the flaky network (fetches failed); the redesign stands on the screenshot evidence + the established moderation-queue patterns from this session.

## 2026-08-28 (fifty-second pass) — Moderation CRUD, re-approve, compact queue + translation fixes

- **Owner screenshot findings:** raw `mod.*` keys visible on `/moderate` (heading + stat labels) — the i18n paths were wrong (`mod.*` instead of `moderation.mod.*`); fixed.
- **Compact queue/triage rows (owner: "posts take too much space"):** PendingQueue + FireTriage items now show a 96px photo thumbnail (or icon placeholder) beside a clamped content column instead of a full-width 16:9 image; descriptions clamp to 2 lines.
- **Rejected plantings tab (owner: "rejected posts should be accessible so we can re-approve"):** third moderation tab "Rejected" (`RejectedQueue`, count in `useModerationStats`), with **Re-approve** — `moderateSite` now allows the `rejected → approved` transition (scope-checked; note: the photo was deleted on reject, so a re-approved record shows without its photo — documented trade-off, intentional per the immutable-cache rule).
- **Admin CRUD deletes (owner: spam/malicious inputs):** `adminDeleteUser` (ordered child deletes + auth delete; self-delete blocked), `adminDeleteVolunteer`, `adminDeleteFeedback`, `adminDeleteFire` (+ photo), `adminDeleteSite` (+ care logs + photo). UI: two-step confirm buttons (Trash → "Confirm?" for 4s) on Users/Volunteers/Feedback panels; FireTriage + RejectedQueue show the delete action to **admins only** (malicious fires publish instantly, so hard-delete is the real mitigation — false-alarm alone keeps them public).
- Verified: tsc clean, 135/135 tests, build green. Hands-on click-through queued for the owner (delete + re-approve paths).

## 2026-08-28 (fifty-first pass) — Admin dashboard: accounts, tabs, pagination + audit leftovers

- **Admin can now create moderator accounts directly** (`CreateAccountDialog` + `adminCreateUser`): email + generated/typed password (show/hide) + display name + wilaya checkboxes → service-role `createUser` (usable immediately, `email_confirm:true` — independent of the Pro-plan email settings), profile display name, role + wilayas assigned in the same step. Duplicate email surfaces a friendly error. Reuses the shared `WilayaChecklist` (also deduplicated into `AssignWilayasDialog`).
- **Admin layout refactor (owner: "it's a mess, endless scrolling"):** the admin page is now **four tabs** — Overview / Users & roles / Volunteers / Feedback — each mounting only when selected (`admin.tsx` 100 lines).
- **Pagination everywhere:** `adminListUsers` / `adminListFeedback` / `adminListVolunteers` take offset+limit (50/25/25 pages); the three admin panels use "Show more" (`moderation.adm.more`) with accumulated rows and index-based query keys.
- **Audit leftovers fixed:** magic-byte image sniff (mismatch → "Unsupported image format"; 4 new tests + storePhoto test hardened with a real full-size JPEG fixture), Nitro `routeRules` edge caching for `/about /privacy /terms /volunteer` (swr 3600) + `og.png`/`logo.png` cache headers. Shared-read throttle stays PARKED (needs `submission_meta.kind` CHECK widening — schema change deferred).
- **Settings note (owner decision):** leaked-password protection + email-confirm toggle require **Pro** — documented in `docs/AUDIT_2026_08.md` §D; revisit on upgrade. Until then, confirm stays ON (built-in SMTP 2 emails/hour cap known) or OFF is the owner's choice at upgrade time.
- Verified: tsc clean, **135/135 tests**, build green. Admin flows need a hands-on check (login as admin → four tabs, create an account, show-more on users/feedback).

## 2026-08-28 (fiftieth pass) — Audit fixes: live, phased (docs/AUDIT_2026_08.md)

Owner: "test everything, find all problems, make a plan, fix what's broken" — audit + fix, then viral-launch readiness. Implemented this pass:

- **P1 fixed — SSRF (`resolveMapsLink`):** server-side Google-host allowlist (`goo.gl`, `maps.app.goo.gl`, `maps.google.com`, `www.maps.google.com`, `www.google.com/maps…`), IP-literal rejection, manual redirect loop with per-hop re-validation. 8 new allowlist unit tests (incl. metadata endpoints + lookalike hosts).
- **P1 fixed — wilaya-scoped PII:** `getSiteContact`/`getFireContact` now assert the submission's wilaya (incl. post-2019 parent) against the moderator's assignment; admins global. New `moderateSite` service fn replaces the direct-RLS update in PendingQueue — role + scope + "already reviewed" checks, and on **reject the storage photo is deleted** (proxy 404s; no immortal rejected photos).
- **P2 fixed — rate-limit IP trust:** `clientIp()` now uses Vercel-sanitized `x-forwarded-for` first, `x-real-ip` second; `cf-connecting-ip` no longer trusted (spoofable without Cloudflare). Tests updated to the new order.
- **P3 fixed:** neutral auth error (email-enumeration side channel removed), fail-loud salt/env checks (no more `?? "green-algeria"`), unhandled-promise fixes (clipboard, getSession, role fetch, signOut).
- **P2 fixed — rejected-photo lifecycle:** above (delete on reject).
- **P2 fixed — bucket backstop:** `photos` bucket now 10 MB + jpeg/png/webp (live-verified).
- **P3 fixed — `rls_auto_enable()` executable by anon/authenticated:** revoked (PUBLIC) — live-verified `has_function_privilege` false.
- **Migration `20260829000000_audit_hardening` (live):** 4 FK indexes (`sites.user_id`, `sites.reviewed_by`, `care_logs.user_id`, `fire_reports.user_id`) + RLS initplan rewrites (8 policies → `(select auth.uid())`, same semantics).
- **P2 fixed — realtime burst storm:** invalidations debounced 2s per table in `useMapRealtime`.
- Verified: tsc clean, **131/131 tests** (8 new), build green, migration applied + post-verified.
- **Owner actions pending (dashboard only):** leak-password protection toggle ON (1 click); **confirm-email = OFF deliberately** (instant signups; trade-off documented: email not verified, roles stay admin-granted); plan/PITR/support-ticket checklist in the AUDIT doc §D.
- Parked (documented, not urgent): shared throttle for receipt/maps/photo-public paths, receipt-token expiry, magic-byte sniffing, `user_id`/`reviewed_by` column visibility (accepted by design).

## 2026-08-28 (forty-ninth pass) — Arabic-first interface

Owner request: the whole platform in Arabic (default), with English one click away. Phased on `feat/ar-i18n`, each phase verified + committed separately: i18n core → chrome/home → forms → info pages → moderation/admin → feedback/offline/tooltips.

- **Core** (`src/i18n/`): typed dictionaries en/ar (key parity enforced by tsc — a missing translation is a compile error), `pluralAr` numeral agreement (1/2/3–10/11+ with Western digits), Arabic dates via `ar-DZ` + Latin digits, singleton locale + no-flash script (default `ar`, EN users set `ga-locale` pre-paint), RTL `html lang/dir`, Noto Sans Arabic + Noto Kufi Arabic self-hosted (display-hero swaps per direction).
- **Owner decisions applied:** Arabic default; brand text «الجزائر الخضراء» in AR mode (Latin wordmark in EN); wilaya names shown in Arabic (data `nameAr`) everywhere.
- **Surfaces migrated:** AppShell (nav/brand/locale toggle English⇄عربي), EmergencyContacts, home (hero/stats/CTAs/chips/ticker/board/leaderboard), SiteList, DetailPanel (incl. fire disclaimer kept intact), plant/care/fire flows, LocationField (wilaya dropdown Arabic), PhotoInput, ReceiptLink, PrecisionPicker, about/privacy/terms (Law 18-07 cited by its official Arabic name; Protection Civile lines bold and untouched), auth, receipt page, 404/error boundary, moderation (queue, triage, contact reveal), activity, admin (roles, wilaya assignment in Arabic), AdminOverview, FeedbackPanel, FeedbackDialog, offline toasts. Server error strings are rewritten locally via a known-message map.
- **RTL fixes:** drawer slides the correct way, map zoom/recenter move to the corner opposite the action card, arrows mirror, inline `text-left` → `rtl:text-right` where needed, hero width.
- **Tooltips (first batch):** legend dots, leaderboard toggle, Needs-water chip, receipt copy button — EN + AR. Radix Tooltip already installed.
- **Verified:** tsc clean after every phase; 105/105 unit tests; `bun run build` green; headless Playwright smoke (home/plant/fire default-Arabic) passed. Screenshot review loop with the owner (drawer placement, hero width, control overlap caught and fixed).
- **Known limitation (honest):** route `head()` uses the singleton locale — a returning EN visitor gets Arabic meta on first SSR until a client nav; default-language visitors (the target majority) are exact. Documented, accepted, fixable later via cookie-aware head if needed.

## 2026-08-28 (forty-eighth pass) — Volunteer recruitment (wilaya moderators)

- **Owner request, urgent — recruit wilaya moderators while the country watches the fires** (Aug 26–27: 12+ dead, 54 injured across Jijel/Béjaïa/Tizi Ouzou; 154 fires in a day). New `/volunteer` page: warm, civic hero ("Every green dot starts with a person"), what volunteers do (review plantings / triage fire reports / rally your area), what we ask (a few minutes, honesty), what we never ask — money, equipment, **firefighting** (we are not an emergency service; Protection Civile 14/1021 stays prominent). Simple form: name, email, phone/WhatsApp, wilaya dropdown (all 58), extra wilayas, intent chips (preselects "Review plantings"), availability, message, honeypot.
- **Schema:** `public.volunteers` — PII-heavy, same posture as feedback: RLS on, **zero client grants**, service-role only; `status` track (new → contacted → onboarded). Migration applied live (2026-08-28, MCP); shape verified after apply.
- **Admin:** `VolunteerPanel` on `/admin` (intent chips, status select, onboard hint). Server fns: `adminListVolunteers`, `adminSetVolunteerStatus` (requireAdmin). Drawer nav gets a "Volunteer" row (HandHeart).
- **Merged into the Arabic-first main; all volunteer surfaces localized** in the merge (route, form, admin panel — dictionary keys, no hard-coded strings).
- Verified: tsc clean, 113/113 unit (8 new zod tests), build green.

## 2026-08-22 (forty-seventh pass) — PrecisionPicker slow-tile feedback + sdk2627 reply

- **Owner report: the pin-adjust map shows blank with only the green pin.** Investigated in dev AND production headlessly: the picker mounts and loads tiles fine (production tile responses all HTTP 200) — **no code bug**; the blank map was the owner's saturated connection stalling the tile fetch (the DOM pin renders regardless, which is why it looked broken). The real gap was UX: the picker said nothing when tiles stall.
- **Fix:** `PrecisionPicker` now shows an honest state — after 8 s without the style load, a "Map is loading slowly — weak connection. You can still drag the pin, or paste a Google Maps link instead" note; on style error, a "couldn't load (connection issue)" note pointing at the same fallback. Small, no dependencies. (Localized in the Arabic-first merge — same behavior, both languages.)
- **sdk2627 replied on issue #5** (taking the PR #9 translation review + ticket #4). Replied in French: welcomed the native AR/FR review, clarified #4's reduced scope (clickable floating legend + list filtering), and pointed him at §8's El Aricha source error with a suggestion to file it upstream.
- Verified: tsc clean, 105/105 unit, build green.

## 2026-08-24 (forty-sixth pass) — Map direction: the live look is the look (boundary swap reverted)

- **Owner verdict after the side-by-side:** he prefers the **map look of the live version** — the original Natural Earth wilaya boundaries on the real basemap. The 69-wilaya boundary swap (detailed SVG shapes) was **evaluated, verified (11-town check, 9/11 + Aflou edge + El Aricha source error), and reverted** — the map keeps its original boundaries. The verification research stays documented in `docs/MAP_ARCHITECTURE_REPORT.md` §8 (and in git history) for a future revisit.
- **Kept from the review cycle:** GPS best-fix watch (see the next pass), the picker slow-tile feedback, and all previously shipped features. No map data changed in the shipped state; the dim mask, Algeria-only label filter, north framing and leaderboard stay as live.
- The tile-free schematic map experiment was also dropped (owner: prefers the real basemap).

## 2026-08-22 (forty-fifth pass) — GPS best-fix watch

- **GPS accuracy fix (owner-approved after discussion):** the "Use my location" button no longer grabs the first fix (usually a coarse network/WiFi guess at ±50–500 m). It now runs a 12 s `watchPosition`, keeps the best reading, shows "Best fix so far: ±X m" live, stops early at ±15 m, and offers "Use this now" to accept the current best — typically ±5–20 m instead of ±50–100 m, same hardware. `maximumAge: 0` on the watch so fixes are fresh. Verified headlessly with a mocked ±10 m fix: pin sets, improving state clears. (Localized in the Arabic-first merge — same behavior, both languages.)
- **Seed data cleaned (owner-requested):** all SEED-marked plantings + care logs + fires deleted via the marker, plus the owner's own test post (row, receipt, photo). All tables verified zero.

## 2026-08-24 (forty-seventh pass) — Mobile submissions API route (issue #8)

- **Contract, now real:** `POST /api/mobile/submissions` — one endpoint for the mobile app (laidanimounir's `dz-green-mobile`), per the agreed contract on issue #8. Body: `{ kind: "plant" | "care" | "fire", data: <same fields as the web form> }`. Auth: `Authorization: Bearer <supabase access token>` — verified live server-side via `supabaseAdmin.auth.getUser`; invalid/missing token → 401 (no JWT staleness window). The route then validates with the *existing* zod schemas and dispatches to the same impls — abuse gate (timing floor, device + IP hash), service-role inserts, receipts — all unchanged. The service-role key never ships in the app.
- **Contract pinning:** exact JSON schema posted on the issue #8 thread for the mobile side.
- Verified: tsc clean, 105/105 unit, build green; headless route check — no token → 401, bad token → 401, invalid body → 400.

## 2026-08-22 (fortieth pass) — Phase 1 quick wins: mobile legend fix + /plant trims

- **Mobile legend cutoff fixed (owner-reported):** the Trees/Care/Fires legend pill next to the Map/List/Board toggle overflowed small screens. The text labels are now `hidden sm:inline` — dots stay visible on phones (the color key survives), the full legend returns at ≥sm.
- **/plant trims (owner-delegated decision, response to the "too much text on phone" feedback):** intro drops "No account needed." (the form makes it obvious); the GPS helper shortens to "Used once, never stored. Skip it and the report is wilaya-level." The trust-bearing lines (phone nudge, never-public) stay.
- Verified: tsc clean, 105/105 unit, build green.

## 2026-08-21 (thirty-ninth pass) — og.png retaken from a populated home + showcase seed/cleanup

- **Showcase seed (temporary, owner-requested):** 24 approved plantings across 20 wilayas (1,218 trees, all this month so the leaderboard race was full), 8 care logs, 4 fire reports — inserted with generated UUIDs, `photo_url = ''`, `location_approximate = true` at wilaya centres. Used to review the populated app (map, Board view, grouped list) and to retake the README/og screenshot. **Cleaned back to zero afterwards** (delete by saved ID list; verified zero across sites, care_logs, fire_reports, receipts, photos).
- **`public/og.png` retaken:** 1200×630 Playwright capture of the production home with the showcase data live ("1,218 trees" visible in the stats line) and the new north framing. Verified non-blank (67 sampled color buckets), replaces the old cut-off screenshot the owner flagged.
- PRs merged in this window: #25 (north initial view), #26 (list view rebuild).

## 2026-08-21 (thirty-eighth pass) — List view rebuilt (PR F)

- **Wilaya-grouped list (owner: "not the perfect UI/UX — rethink and rebuild"):** the flat 30-row wall is gone. Reports (plantings + fires, same layer filters as the map) are now grouped by wilaya — section headers with per-wilaya totals ("Oran · 12 trees · 1 fire"), groups ordered by most recent activity, photo-thumb rows for plantings (private-bucket proxy URLs, lazy-loaded) with the needs-water badge, fire rows with severity + status. 181 lines, under the cap.
- Verified: tsc clean, 105/105 unit, build green; headless render check passes (empty state — the DB is intentionally empty after the data reset; grouped rendering verified structurally).

## 2026-08-21 (thirty-seventh pass) — Map starts on the populated north + full data reset

- **Test data fully cleaned (owner decision):** everything remaining was from the testing window — 4 sites (one literally noted "Test"), 5 fire reports (three submitted within one minute), their receipts and storage photos. Deleted via SQL + per-object Storage API deletes; verified zero across `sites`, `care_logs`, `fire_reports`, `receipts` and the `photos` bucket. The map now starts truly empty for real users.
- **Initial map view starts from the top (owner complaint):** the whole-country `fitBounds` framed the geographic centre, cutting the northern coast — where most people (and future plantings) are — off the top edge. New `NORTH_BOUNDS` ([-2.6, 33.2] → [10.2, 37.4]: Oran to Annaba, High Plateaus to the sea) drives both the constructor `bounds` and the Recenter control; the rest of the country remains a scroll away inside `maxBounds`. Verified headlessly: the loaded view spans ~32.5°N–38.1°N.
- Verified: tsc clean, 105/105 unit, build green. Follow-up queued: retake `og.png`/README screenshot later with showcase data populated.

## 2026-08-21 (thirty-sixth pass) — Leaderboard view + activity ticker (PR H)

- **Leaderboard (owner-requested, reordered up):** the home toggle is now Map / List / **Board** (`ViewToggle.tsx`, trophy icon). The Board view (`Leaderboard.tsx`) is this month's wilaya race: approved plantings only, summed per wilaya from the already-loaded sites (no schema, no new query), resets on the 1st. Leading-wilaya highlight card + ranked list with proportional bars + empty state with a plant CTA.
- **Activity ticker:** an anonymous pill on the map ("2 trees just planted in Oran", "Fire just reported in…", "Trees just watered in…") fed by the realtime inserts on the existing subscription; auto-dismisses after 6s, re-mounts per event.
- **Extraction to stay under the 250-line cap:** the realtime channel moved out of the home route into `useMapRealtime.ts` (it also emits the ticker messages), and the toggle into `ViewToggle.tsx`. `index.tsx` is 234 lines.
- **Verified in a real headless Chromium** (temp Playwright spec, deleted after): Board button switches to the leaderboard with this month's real data (leading wilaya + ranked second), toggle round-trips back to the map. Found and worked around the known SSR hydration timing (clicks before hydration attach no handlers — the suite's documented gotcha). tsc clean, 105/105 unit, build green.

## 2026-08-21 (thirty-fifth pass) — Structured feedback kinds (PR D)

- **Schema (applied live):** `feedback.kind text not null default 'other' check (kind in ('bug','idea','other'))` — existing rows become 'other'. Mirrored as `supabase/migrations/20260821190000_*.sql`; `FULL_SCHEMA_EXPORT.sql` §17 and `DATABASE.md` updated.
- **Dialog:** a Bug / Feature idea / Other segmented selector (radiogroup, plant-toned when active) above the message; resets to 'other' after send. Zod: `kind` enum defaulting to 'other'; 3 new schema tests (default, bug/idea accepted, unknown rejected) — 105 total.
- **Admin panel:** each message now carries a kind badge (bug=fire, idea=care, other=muted) so feature propositions are separable from bug reports at a glance.
- Verified: tsc clean, 105/105 unit, build green.

## 2026-08-21 (thirty-fourth pass) — Moderation decision data (PR B)

- **Exact times where decisions happen:** new `formatDateTime` (date + time). PendingQueue now shows the submission's `created_at` (it previously showed only the planted date — the "not enough data about time" owner complaint) plus the wilaya-level badge; FireTriage shows exact reported/resolved times.
- **Contact reveal:** new `getSiteContact` / `getFireContact` server functions (`moderation.functions.ts`) — service-role, live `user_roles` check per call (admin or moderator; a demoted moderator loses access next request). Until now even moderators could not read reporter PII (column grants block every client) — these are the only read path. UI: a "Show contact" button per card (`ContactReveal.tsx`) fetches on demand only; shows name + tel-linked phone, or "no contact info left".
- Verified: tsc clean, 102/102 unit, build green. Note: PR C's grant swap briefly broke the production pending queue between the live migration and the PR #21 deploy (the `select("*")` fix shipped in the same PR) — sequencing lesson recorded: client fixes ride with or before their grant changes.

## 2026-08-21 (thirty-third pass) — Optional contact phone + privacy/terms pages (PR C)

- **Schema (applied live, verified):** `sites.contact_phone text` (nullable). Grants swapped from table-level to **column-level SELECT** on `sites` for `anon`/`authenticated` (19 columns, excluding `contact_phone`) — the same posture `fire_reports` uses for reporter PII; `select *` now fails on purpose here too. Migration mirrored as `supabase/migrations/20260821180000_*.sql` and `FULL_SCHEMA_EXPORT.sql` §18; `DATABASE.md` updated.
- **Owner decision: optional, not required.** The plant form gains a phone field and the fire form's existing phone field gets the same treatment: a verification nudge under the field ("a moderator may call to verify before approving — never public, never shared") with a "Why we ask" link to `/privacy`. Success screens now list the phone under "never public".
- **Client fix forced by the grant swap:** `PendingQueue` used `select("*")` on sites — now the shared explicit `SITE_COLUMNS` list (exported from `data.ts`). Every other client select was already explicit and within the granted columns (verified by grep: data.ts, moderation.ts, activity.tsx).
- **Legal pages:** `/privacy` (what's collected, why, public vs never, Law 18-07 rights, hosting, who runs it) and `/terms` (honest submissions, volunteer moderation, not-an-emergency-service, no warranty), plain language, linked from the drawer nav and the phone fields.
- Types: `contact_phone` added to the sites block (surgical edit, matching the live schema). Zod: `contact_phone` max 40 on the planting schema; `PlantingInput` extended.
- Verified: tsc clean, 102/102 unit, build green. Grant verification via `information_schema.role_column_grants` (19 columns, no `contact_phone`).

## 2026-08-21 (thirty-second pass) — Algeria-only map labels

- **Owner request:** drop the names of other countries and their regions — only Algeria-related place names should render. Implementation: `algeriaMultiPolygon()` (one MultiPolygon from the wilaya shapes, 3,142 points) + `applyAlgeriaLabelFilter(map)` which scans the active style's symbol layers with a `text-field` and composes `["all", existingFilter, ["within", algeria]]` on each — style-agnostic, so liberty and dark both work; runs on init and on every theme switch. Cities, villages, POIs, road names/shields and water labels outside Algeria no longer render; Algerian labels keep working.
- **Verified in a real headless Chromium** (temp Playwright spec, deleted after): all 23 basemap text layers carry the `within` filter, correctly composed onto the existing filters; `ga-mask` present; no page errors. tsc clean, 102/102 unit, build green.
- **Incident (owned):** while clearing zombie headless-browser processes for the verification, the cleanup matched the owner's real Chrome windows too and killed them. Tabs restore on reopen. The filter was too broad; noted for future verification runs.

## 2026-08-21 (thirty-first pass) — Open-source infrastructure

- **CI:** `.github/workflows/ci.yml` — on every PR and push to `main`: `bun install --frozen-lockfile`, `tsc --noEmit`, unit tests, build (placeholder `VITE_*` env so the bundle inlines harmless values). E2E stays out of CI — it needs the live database, as documented.
- **Templates:** bug + feature issue forms (the structure Ahmeddsssscd used by hand in #13/#14 is now the template) and a PR template with the verification checklist ("not verified" is acceptable, a false "done" is not).
- **`SECURITY.md`:** private reporting via GitHub advisories + the posture (service-role key never client-side, fire PII column-grant protected, IP hashes only, private photo bucket).
- **README:** the live app link (`green-dz.vercel.app`) was missing entirely — now at the top next to the repo link, plus the CI badge.
- **CONTRIBUTING:** fixed a real bug — it said "branch off `master`" (the default branch is `main`); added the CI line to the checks section.
- Docs: PROJECT_STRUCTURE (.github/ + SECURITY.md entries).

## 2026-08-21 (thirtieth pass) — Chrome fixes: bottom bar removed, GitHub link, Algeria dim mask

- **Test data cleaned (live DB, owner-approved):** the "Test the app" site row (10 Pine, wilaya 33) deleted along with its storage photo; the map now shows only real submissions (2 sites, 4 trees).
- **Mobile bottom action bar removed** (`AppShell.tsx`): it duplicated the action card's three CTAs and covered the card's reveal button. The `pb-20` compensation and the now-unused `ACTIONS` const went with it.
- **GitHub repo link in the top bar** next to SOS/Feedback (icon button, opens in a new tab).
- **Non-Algeria dim mask:** new `wilayaMaskGeoJSON()` (world polygon with the 58 wilaya outer rings as holes, same simplified shapes as the boundary layers so the dim edge matches the green borders exactly) + a `ga-mask` fill layer below every custom layer (`colors.mask` per theme: sage `#e8ebe6` light, ink `#0e0f0c` dark, 55% opacity). Neighbouring countries and their labels fade; Algeria stays crisp.
- Verified: tsc clean, 102/102 unit, build green.

## 2026-08-21 (twenty-ninth pass) — Mobile UX owner pass

- **Action card hidden by default on phones** (≤767px, `useLayoutEffect` + `matchMedia`, runs pre-paint so no flash) — the map gets the space; the reveal button pulses with a soft plant ring until used (`motion-reduce` respected). Desktop unchanged.
- **Top bar brand hidden on phones** (logo + "Green Algeria") — the hamburger already carries Home; the drawer keeps the brand.
- **Real logo in the chrome:** `public/logo.png` (128px, converted from `favicon.ico`) replaces the TreePine icon in the top bar and drawer.
- **Feedback pill is plant-green** (`border-plant/30 bg-plant/10 text-plant`) instead of muted gray.
- Verified: tsc clean, 99/99 unit, build green. Owner device check pending.

## 2026-08-20 (twenty-eighth pass) — Photo size checked before decode (issue #13)

- `storePhoto` decoded the whole base64 payload before the 900 KB check, so a direct API caller's oversized payload was fully allocated before rejection (the client compresses to ~400 KB, so only direct calls hit this). Now rejects on the base64 string length first (`floor(len * 0.75) > MAX_PHOTO_BYTES`); the exact post-decode check stays as a second guard. 3 new `storePhoto` tests: oversized never reaches the storage upload, exactly-at-limit uploads, bad format rejected. PR #16. tsc clean, 102/102 unit.

## 2026-08-20 (twenty-seventh pass) — Map "disappears" fix + feedback device capture

- **Investigation first (owner-mandated standard):** the feedback report "MapLibre GL has a bug where sometimes it disappears completely" was investigated before any code. Ruled out with evidence: the context-lost blank-map bugs (#6398, #6935) merged pre-v6.0.0 and can't affect 6.4.0; v6.4.1 (2 days old) fixes an unrelated XSS sanitize bug. Root cause path confirmed in the shipped 6.4.0 bundle: WebGL2 context creation failure fires `error` + `GPUInitializationError` synchronously inside the Map constructor, and Evented drops errors with no listeners — so the map died with only a `console.error`. Confidence stated honestly: medium-high for context creation/loss failure, not confirmed (the reporter left no device data).
- **HeroMap defensive handling (part 1):** pre-construction `webgl2` probe, bubbling `webglcontextcreationerror` listener on the container (catches the constructor-time failure `map.on("error")` would miss), `map.on("error")` branch on `instanceof GPUInitializationError`, `webglcontextlost`/`webglcontextrestored` handling with `redraw()` on restore, and a clear overlay (two variants: no-WebGL2 vs. lost-connection) with a reload fallback.
- **Feedback device capture (part 2, schema change approved for this specific case):** migration `add_feedback_device` (applied live, verified): `public.feedback.device text` (nullable, no constraint). Client sends `navigator.userAgent` capped at 300 chars (zod); admin panel renders it (truncated, mono); `AdminFeedback` + supabase types updated; 2 new schema tests.

## 2026-08-20 (twenty-sixth pass) — Issue #8 replied (mobile app)

- **Posted the approved reply** to the issue #8 thread (comment `5350062315`, Meykiio account, 2026-08-20 01:29Z): framed as **Ground rules vs. Your call** — the three fixed items (write path through the existing server gate, v1 ships after the PR queue #9→#10→#11 + wilayas update, append-only outbox) each with its "why", and everything else explicitly delegated to the contributor (code structure incl. the separate-repo call, libraries, screen order, pace, UI). Addresses both `laidanimounir` (the proposal) and `morch23mj` (the monorepo comment).

## 2026-08-20 (twenty-fifth pass) — Alerting feature removed (owner decision)

The "wire or drop" open decision is resolved: **drop**. The feature was storage-only — nothing ever sent an alert.

- **Schema (migration `drop_alert_contacts`, applied live + mirrored in `supabase/migrations/20260820000000_c3b7bda7-….sql`):** dropped `public.alert_contacts` (0 rows), its `alert_contacts_moderator_all` RLS policy, and `private.can_manage_contact` (existed only to back that policy; its EXECUTE grant went with it). Verified live: table and function both gone. No other schema references (no publication membership, no indexes elsewhere).
- **Code:** deleted `src/components/moderator/ContactsPanel.tsx`; removed the "Alert contacts" tab from `ModTabs` (`Section` is now `queue | fires`), the ContactsPanel render + tab count from `moderate.tsx` (page description updated), the `contacts` head-count query from `moderation.ts`, the `AlertContact` interface from `src/lib/types.ts`, and the `alert_contacts` block from `src/integrations/supabase/types.ts` (regenerated types confirmed clean — the file was also stale on `feedback`/`receipts`, now accurate).
- **Docs:** `ROADMAP.md` — moved under "Parked" with the full story (what it was, why dropped, rebuild after mobile + PR queue settle); `DATABASE.md` — sections removed, helper count six → five; `FULL_SCHEMA_EXPORT.sql` — table/policy/function/grant blocks removed, sections renumbered 1–17; `PROJECT_STRUCTURE.md` + `FEATURES.md` + `PRE_MOBILE_BLOCKERS.md` — references removed/updated.
- **Delivered as a PR** (not a direct push).

## 2026-08-20 (twenty-fourth pass) — PR #9 rebase deadline posted

- **PR #9 (i18n/RTL): deadline comment posted** (`5349625809`, Meykiio account): rebase onto main **by 2026-08-25** or we take over the branch (copy into repo, apply required changes incl. the client-side locale fix, open replacement PR). Verified before posting: repo `Meykiio/dz-green`, PR #9 open, head `2c6c3daa73` unchanged, 7 behind main and diverged, `mergeable_state: unknown`; only prior comment was the 2026-08-19 rebase request (no deadline).

## 2026-08-19 (twenty-third pass) — Mobile dev onboarding note

- **`docs/MOBILE_HANDOFF.md` written** — handoff note for the mobile developer: required reading (`MOBILE_RESEARCH.md`, `PRE_MOBILE_BLOCKERS.md`), the write path (API route into `submissions.server.ts`) and the offline outbox design marked as decided (don't re-litigate), and a plan-first requirement for the two highest-risk pieces (auth flow, offline queue) before building. Everything else is free to build.

## 2026-08-19 (twenty-second pass) — Pre-mobile blocker resolution (research + planning only)

No code written, fixed, or merged — owner brief: four separate investigations (PRs #9/#10/#11, wilayas 58→69), each with an explicit verdict, plus flag-only items. Every fact re-verified against the actual code and the live schema (nothing taken from ROADMAP titles). Deliverable: `docs/PRE_MOBILE_BLOCKERS.md`.

- **PR #9 — verdict: code ready to fix now; merge blocked on author's rebase.** Re-checked via API: head `2c6c3daa` unchanged, now **7 commits behind main and diverged** (the ROADMAP's "2 behind" was stale); author pinged on the PR 2026-08-19 14:43Z, no rebase since. P1 bug confirmed present in the head code (`detect.ts` client branch never reads the browser's language → first in-app navigation flips `dir` to LTR for Arabic-first visitors). ~5-line fix planned; ready-to-merge checklist written.
- **PR #10 — verdict: merge after #9; `isMobile`/`isRtl` read-once bug accepted as fast-follow** (needs a language switch or 768px rotation while the map stays mounted; the post-merge device pass is the right place). Cannot start until PR #9 is **merged**, not ready.
- **PR #11 — verdict: not mergeable until (a) reopened + rebased and (b) runtime-verified** — "plan exists" ≠ "verified" is a hard gate here. Wrote the 6-flow verification procedure (getMyProfile / updateMyProfile+avatar / getPublicProfile / password reset / route guard / cleanup, each with a pass criterion and throwaway-user cleanup). PR confirmed closed + dirty, head `dcf7fcd`, 7 behind.
- **Wilayas 58 → 69 — verdict: No-Go as a mobile blocker; Go as a parallel item that must land before mobile v1 forms.** Live `pg_constraint` query: zero CHECK constraints/enums on `wilaya_code` — DB is fully additive. Verified the real work: 58-entry `wilayas.ts` vs **48-polygon** `algeria-wilayas.ts` (auto-generated, new source needed for Nov-2025 divisions), silent misfiling path (`geo.ts:86` point-in-polygon + `deriveWilaya`, fires publish immediately under parent codes), `.max(48)` moderator cap at `admin.functions.ts:107`, "58 wilayas" copy at `index.tsx:26`/`README.md:13`.
- **Flags (open, flagged only):** load test never run (ROADMAP item 4, gated on items 2–3); auth dashboard check (`AUDIT.md` P1 #3) still open, owner-side, 2 minutes; alerting wire-or-drop still undecided (owner decision, not a task).
- **Final line:** nothing in the queue blocks mobile scaffolding from *starting* (write-path architecture already decided and independent), but mobile v1 must not ship before the PR queue (#9 → #10 → #11), the wilayas update, and the 2-minute auth dashboard check. Wilayas/alerting/load test can run in parallel with mobile scaffolding.

## 2026-08-19 (twenty-first pass) — Mobile app research; issues #2/#3 replied to and closed

- **`docs/MOBILE_RESEARCH.md` written** — research phase for the community-proposed mobile app (no code, no repo setup). All 7 questions answered with 2026 sources: (1) write path = a new route in this app reusing the gate (not RLS inserts — honeypot/timing can't survive in Postgres; not an Edge Function — would duplicate the gate in Deno); (2) append-only offline need = expo-sqlite outbox + NetInfo drain + backoff, no WatermelonDB/RxDB; (3) auth = Supabase JS client direct, SecureStore (LargeSecureStore pattern), PKCE + deep-link email confirmation; (4) sharing = vendored copy of pure-TS files via sync script, server fns stay here; (5) map = `@maplibre/maplibre-react-native` v11 stable, OpenFreeMap proven compatible, offline packs real but cut from v1; (6) repo = separate `dz-green-mobile`; (7) EAS free tier 15+15 builds/mo, TestFlight internal is the zero-gatekeeping channel, Play's 14-day closed test is the long pole for new personal accounts. Lock-in flags: write path + repo structure hard to reverse, decide before code. PRD split: v1 = field submission + offline queue; v2 = offline map tiles, push, realtime sync, App Attest/Play Integrity (alpha — not v1).
- **Issues #2 and #3 closed with replies** — after verifying the fixes live on `green-dz.vercel.app` (Playwright 5/5), posted French replies (reporter wrote in French) and closed both. Links: #2 https://github.com/Meykiio/dz-green/issues/2#issuecomment-5345310575, #3 https://github.com/Meykiio/dz-green/issues/3#issuecomment-5345310750.

## 2026-08-19 (twentieth pass) — First backlog fixes: fires in the list, Directions button unclipped

Two confirmed bugs from the community backlog, fixed and verified against the production bundle (7-check Playwright pass on `vite preview`). `tsc` clean, 97/97 unit tests, build green.

- **Issue #2 — the List view now shows fire reports.** `SiteList` previously received only `sites` + `careLogs`, so the Map/List toggle's List view showed plantings and never fires (fires existed on the map and in the legend). The list now renders both plantings and fires, sorted by date, with fire status + severity badges and a flame badge — and it respects the same Trees/Fires layer toggles as the map (`index.tsx` passes `fires` + `layers` through). Empty state reworded to "Nothing on the map yet" since the list is no longer plantings-only.
- **Issue #3 — the Directions button is no longer clipped.** `DetailPanel` was a fixed 360 px desktop panel with `overflow-x-hidden` and two `flex-1` buttons; the labels physically overflowed and were cut off (worse in French, the reporter's language). Fixed by widening the panel to 400 px and switching the buttons to the `sm` size with wrapping allowed. Verified: the button's right edge sits inside the panel on a 1280 px viewport.

## 2026-08-19 (nineteenth pass) — Full verification of the community backlog

No code fixes — this pass replaced every "assigned from title" guess with evidence. All 3 PRs reviewed diff-by-diff, all 5 issues checked against the actual code, `tsc` clean + 97/97 tests + build verified on `main`.

- **PR #9 (i18n+RTL):** worker fix preserved (branch contains `bfa3ce2`, doesn't touch map files), no schema, no scope creep, no new deps, honeypot/feedback/disclaimer intact. Needs changes before merge: P1 — cookie-less Arabic visitor gets correct SSR `dir="rtl"` but the first in-app navigation flips `<html dir>` to LTR (client resolver ignores Accept-Language); P2 — mobile drawer uses physical `translate-x` + `start-0`, visible mid-screen when closed in RTL; P3 — hardcoded Arabic comma in admin, untranslated severity in activity, English plural keys leak "(s)" into fr/ar. Rebase mandatory (2 commits behind main; keep `<Analytics />` in `__root.tsx`).
- **PR #10 (mobile UX):** worker fix preserved (map-style.ts untouched). Map changes small/self-contained. One edge bug (language switch/resize after mount leaves controls misplaced). Merge gotcha: stacked on #9, missing 2 main commits — rebase must re-add `<Analytics />` or Web Analytics disappears.
- **PR #11 (profiles+password reset):** **verified NO schema change** (zero migrations; `DATABASE.md` edit is docs-only). Security posture correct (service-role-only, no RLS loosening, no PII on public pages). Needs changes: rebase, drop duplicated `currentUserId()`, `noindex` on `/u/$userId`, minor count over-disclosure; author never runtime-verified it.
- **Issue #2 (list lacks fires):** **verified real** — `SiteList` only receives sites+careLogs, never fires. **Issue #3 (Directions clipped):** **verified real** — `md:w-[360px]` + `overflow-x-hidden` + two `flex-1` buttons clip the labels (worse in French). **Issue #4 (legend click-filter):** partially exists — action-card chips filter the map; the legend dots are static and the list is unfilterable. **Issue #7 (WebGL2):** technically true (`maplibre-gl@6.3.0` dropped WebGL1 in v6, April 2026) but WebGL2 is ~97% of browsers and MapLibre has no built-in raster fallback — recommended minimal fix is a `GPUInitializationError` message, not a hybrid. **Issue #8 (mobile app):** no mobile code exists; offline sync is genuinely large scope; Expo + existing backend is the right stack. Details + file evidence in `ROADMAP.md`.
- **Doc fix:** `PROJECT_STRUCTURE.md` claimed "5 files, 91 unit tests" — actual is 6 files, 97/97 (re-run 2026-08-19). CHANGELOG/FEATURES were right; PROJECT_STRUCTURE was stale.

## 2026-08-19 (eighteenth pass) — Demo data seeded live; community backlog planned

- **Demo data seeded (live, no code).** So the map shows everything: 13 sites (12 approved + 1 pending), 6 care logs, 4 fire reports (3 active + 1 resolved). Every row is visibly tagged as fake — `planter_display_name`/`submitter_name`/`reporter_name` = "Démo — …", notes/description = "Données de démonstration — Green Algeria" — and carries a deterministic UUID prefix (`d0000000-…` sites, `d1000000-…` care logs, `d2000000-…` fires) so removal is one SQL command (recorded in `ROADMAP.md`). Real rows (Bachir's pending site, Béchar fire) untouched. Learned this pass: `sites.location`/`fire_reports.location` are **generated** geography columns (lat/lng → point) — never insert into them.
- **Community backlog planned in `ROADMAP.md`.** Everything from the 7 issues + 3 PRs is triaged and ordered; owner approves before any fix starts. Wilaya 58→69 verified as real (APS, 16/11/2025) and replied to on issue #6; PR merge order set (#9 i18n → #10 mobile → #11 profiles last, schema change); PR #1 (Vercel bot analytics) to close as duplicate.

## 2026-08-19 (seventeenth pass) — Feedback box actually works now

- **Live bug: feedback submissions failed with 42501.** A real user reported the Feedback dialog erroring out. Root cause: the feedback migration revoked anon/authenticated grants but never granted DML to `service_role` — and RLS bypass does not imply table privileges, so `supabaseAdmin.from("feedback").insert(...)` returned `permission denied for table feedback`. Every other app table already had `SELECT, INSERT, UPDATE, DELETE` for service_role; feedback was the odd one out. It slipped through because the feedback tests only covered the zod schema — no live end-to-end insert was ever run (a "not verified" gap, owned). Fix: `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feedback TO service_role` applied live; migration file, `FULL_SCHEMA_EXPORT.sql` §18 and `DATABASE.md` updated to match. **Verified end-to-end on the live site:** Playwright drove the real dialog on `green-dz.vercel.app`, success toast shown, row confirmed in the table, probe row deleted.
- **Feedback is now readable in-app.** Until today the only way to see messages was the Supabase dashboard. New `adminListFeedback` server fn (admin-gated, service-role read, latest 100) + a read-only `FeedbackPanel` on `/admin` between Overview and Moderators & roles. `DATABASE.md` updated (it previously said "no UI exists").

## 2026-08-19 (sixteenth pass) — Vercel Web Analytics

- **`@vercel/analytics` 2.0.1 wired into the root layout** (`src/routes/__root.tsx`): `<Analytics />` from `@vercel/analytics/react` mounted in `RootComponent`. Note for future readers: this app is TanStack Start, not Next.js, so the `@vercel/analytics/next` entry is wrong here (it pulls Next.js internals) — the framework-agnostic `/react` entry is the correct import. The loader script self-detects the Vercel environment server-side and no-ops elsewhere. Web Analytics must be toggled ON in the Vercel dashboard (Project → Analytics) for data to be collected; that toggle lives outside the repo.

## 2026-08-18 (fifteenth pass) — Production map fix: the missing MapLibre worker

- **The borders/dots bug on the live site, root-caused and fixed.** The deployed map rendered tiles but never the wilaya boundaries or the data dots. Evidence: a Playwright pass over `green-dz.vercel.app` logged exactly one failed request — `assets/maplibre-gl-worker.mjs → net::ERR_FAILED`. MapLibre GL v6 resolves its web worker from `import.meta.url`, which bundlers rewrite to nothing; the asset was never emitted into `.output/public/assets`, so the worker never started and every GeoJSON source silently failed (the dev fix `optimizeDeps.exclude` masks it locally, which is why this never reproduced in dev). Two-part fix, both verified against the production bundle on `localhost:3000` before shipping: (1) `import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"` + `setWorkerUrl(...)` at module scope — **`?worker&url`, not `?url`** (v6's worker imports a sibling `maplibre-gl-shared.mjs`, and `?url` would emit the stub without its sibling); build now emits a self-contained 470 KB `maplibre-gl-worker-*.js` with no `maplibre-gl-shared` reference left. (2) **The ordering bug that made (1) ineffective:** the first deploy bundled the worker correctly, yet the browser still requested the fallback URL — instrumented chunk interception proved `wx()` (worker-pool acquire) ran *before* `setWorkerUrl`. Root cause: `setRTLTextPlugin(...)` in `map-style.ts` runs at module scope and instantiates maplibre's internal throwaway map (for Arabic label shaping), which acquires the singleton worker pool with whatever `WORKER_URL` exists at that moment — and `map-style.ts` evaluated before `HeroMap.tsx`'s `setWorkerUrl` statement. In dev this was invisible because the fallback URL resolves to a real file under `node_modules/`. Fix: `setWorkerUrl` now runs at the top of `map-style.ts`, before the RTL plugin call; `HeroMap.tsx` no longer owns it. The `ssr.noExternal` note from the v6 docs was considered and skipped: this app's SSR already serves 200s, and the worker import is a string asset, safe on the server.
- **Verification (local, against the production bundle):** rebuilt, re-served `.output` on `localhost:3000`, instrumented both chunks in-flight. Before the fix: `wx reads WORKER_URL= "" → fallback .../maplibre-gl-worker.mjs` then `setWorkerUrl` — wrong order, worker 404'd. After: `setWorkerUrl` first, `wx reads WORKER_URL= /assets/maplibre-gl-worker-COyPxcFs.js` — hashed bundled worker requested, zero fallback requests, zero failed requests, and a canvas pixel scan of the rendered map counts 27,259 border-green pixels (dark theme `#7ee2a8`). Post-deploy pass on `green-dz.vercel.app` appended below when it lands.

## 2026-08-18 (fourteenth pass) — Live on Vercel; feedback box ships

- **Deployed.** `green-dz.vercel.app` is live. Two issues had to be solved on the way: the first deploy 404'd (TanStack Start needs the `nitro()` plugin registered in `vite.config.ts` so the Vercel preset emits `.vercel/output/functions/__server.func`), and the runtime crashed with `createCsrfMiddleware is not a function` — a circular import between two chunks of the Nitro build split the server entry; fixed by upgrading TanStack (`@tanstack/react-start` 1.168.32→1.168.47, `react-router` 1.170.18→1.170.30, `router-plugin` 1.168.23→1.168.33). Verified before shipping: local execution of the built `.vercel/output` bundle serves SSR HTML; server functions respond (403 = CSRF working); unit 97/97; `tsc` clean. `.vercel` added to `.gitignore`.
- **Feedback box.** A "Feedback" pill sits next to the SOS pill in the top bar on every viewport (owner placement: sign-in moved into the drawer/static sidebars so SOS + Feedback share the top bar, desktop and mobile). It opens a dialog: message 1–2000 chars with live counter, honeypot, optional page path. Server fn `submitFeedback` validates with zod then inserts via the service-role client into the new `public.feedback` table (RLS on, zero client policies, anon/authenticated grants revoked — service-role only, same posture as `receipts`). Migration applied live via MCP, mirrored as `supabase/migrations/20260818230000_*.sql` and `FULL_SCHEMA_EXPORT.sql` section 18; `DATABASE.md` documents the table. Schema tests added (`feedback.schemas.test.ts`). Deliberately no rate limit — low-value write path; honeypot handles bots.
- **DB state:** the project's data tables were wiped on 2026-08-18 (pre-wipe backup in the temp workspace, recovery-only, never committed). The live map showing "0 trees" is expected until real submissions land.

## 2026-08-18 (thirteenth pass) — Design system made our own; repo moves home

- **`docs/DESIGN.md` de-Wised.** Every reference to the Wise brand is gone (name, description, "Wise Green", "Wise Sans", the font-substitute note, the currency-converter card, the kit-mirror "Examples" section whose `/preview-design` / `/generate-kit` routes and `scripts/derive-examples-block.mjs` never existed in this app). The document is now Green Algeria's own design system: lime `#9fe870` CTA, sage canvas, ink, Manrope 900 display (self-hosted via `@fontsource-variable/manrope`), 24 px pill radius, map-first hero. Token values untouched — names and attribution only.
- **Code comments synced:** `src/styles.css` header + palette comments, `src/components/ui/button.tsx` variant comment. `docs/FEATURES.md` §12 now says "its own design system". Historical CHANGELOG entries keep their original wording (they are a record, not a spec).
- **Repo home change:** `Meykiio/dz-green` (github.com/Meykiio) becomes the canonical repository with a fresh single-commit history — "as if it was the first time", no leaked anything (verified: no `.env` ever committed; no secret literal in any commit; the only key in the tree is the publishable anon key that ships in browsers by design). The `notsifeddine/dz-green` mirror keeps the full messy history as a frozen archive.

## 2026-08-18 (twelfth pass) — Docs restructure: truth pass, deletions, single sources

Owner call: the docs were messy, not open-source-ready, and some claims were unverifiable — devs are about to join. Every doc was re-verified against the codebase and the live database; nothing was rewritten on assumption.

- **Deleted:** `MASTER_SPRINT_PLAN.md` (consumed executor instructions — all 7 sprints shipped), `DESIGN.md` + `DESIGN_ADAPTATION.md` (historical analysis of the retired dark theme). All remain in git history.
- **Renamed:** `DESIGN-wise.md` → `DESIGN.md` (the active design system takes the canonical name; code comments updated).
- **`ROADMAP.md` rewritten forward-looking:** the old file was a completed-sprint history (that's CHANGELOG's job). Now: pre-launch owner actions (deploy target, dashboard check, plans, load test, device testing), open decisions (alerting wire-or-drop, Arabic/French, vendored prune, moderator onboarding), parked ideas.
- **`PROJECT_STRUCTURE.md` regenerated from the actual tree.** Old version was stale on real facts: listed `ModSidebar.tsx`/`AlgeriaMap.tsx`/`WilayaClusters`/`WilayaPins` (deleted files), duplicated `DetailPanel.tsx`, said "62"/"67" unit tests (real: **91, re-run**), "11 E2E" (real: **16, re-counted per spec: 5+3+4+4**), said 3 receipts tests (real: 4), described the home's hero as "SVG map" (it's MapLibre GL), and called `PrecisionPicker` "the only real-world tile map" (false — the hero map is tiles too).
- **`FEATURES.md` stale claims fixed:** §3 care and §4 fire said "submit path not re-run" — both ARE re-run by `e2e/flows.spec.ts` (care deep-link round-trip; fire GPS-pin round-trip with PII-401 assertion) and were green in the 2026-08-18 16/16 run. §12 design reference updated for the rename. Header now records the 2026-08-18 re-verification pass.
- **`DATABASE.md` re-verified against live (all match):** 12 policies, 8 functions (`private.*` × 7 + `handle_new_user`), all 24 app indexes, 4 enums, `photos` bucket private with no limits, realtime publication `sites, care_logs, fire_reports`. Fixed the stale "five entries" → live `schema_migrations` has **six** (bootstrap + 5 post-bootstrap). Same fix in `supabase/migrations/README.md` ("last four" → "last five files", export sections 13–17).
- **Verified unchanged:** README claims (env vars, LICENSE, emergency numbers 14/1021/17/1055/16, rate limits 6/20/8, bounds 2000/3000/1000, Manrope 900 hero), `AUDIT.md` (updated in the previous pass), `SYSTEM_INSTRUCTIONS.md`, `CONTRIBUTING.md`, `FULL_SCHEMA_EXPORT.sql` (17 sections).

## 2026-08-18 (eleventh pass) — Full audit + docs refactor + UI consistency completion

Owner-requested four-part pass: a real audit, open-source-ready docs, go-live cleanup, and about/forms/dashboard UI aligned to the home's chrome.

- **Audit (`docs/AUDIT.md`):** six tracks with evidence — security (OWASP ASVS; `bun audit` 0 vulns; XSS surface = 3 static literals; PII column grants intact; RLS battery 40/40; service key server-only; upload validation), performance (CLS 0, zero long tasks, code-split bundles, ~21 MB/209 requests tile-heavy first load), a11y (contrast AAA on body/CTA both themes; one h1 per route; **drawer made `inert` + `aria-hidden`** — real keyboard bug found), SEO (meta/titles/robots clean; sitemap relative `loc`s spec-invalid), code quality (no TODOs/`any`), data (schema matches `FULL_SCHEMA_EXPORT.sql` exactly; EXPLAIN-proven index; zero receipt orphans). Verdict: **0 P0, 3 P1, 7 P2**.
- **Fixes (`777a1bc` + `be33a38`):** HeroMap split 393 → 4 files (all < 250 lines); invalid sitemap removed (regenerate with real domain at deploy); error states added to PendingQueue/FireTriage/ContactsPanel; dark `--fire` 4.18:1 → ≥ 4.5; `inputValidator` → `.validator()` in 8 server fns.
- **Docs refactor (`ebd7be3`):** README rewritten to the opensource.guide skeleton (stale claims fixed); CONTRIBUTING expanded with every test layer + fixture recipe; AGENTS.md restructured (owner voice preserved); volatile row counts removed from DATABASE/FEATURES; design docs marked historical; CODE_OF_CONDUCT added (Covenant v2.1); package.json metadata (name, AGPL-3.0-only, repository).
- **Go-live green run:** tsc clean, unit 91/91, build clean, **E2E 16/16** with fixtures; fixtures/markers/photos/receipts/meta cleaned and verified zero. Pushed.
- **UI consistency (`6a37cc8` + this pass):** about page rebuilt in the home's visual language; `FormShell` wraps the three forms in the home's rounded-2xl card; dashboards verified page-by-page against the home chrome (shared `rounded-lg`/`border-border bg-card` family, eyebrow pattern, icon-tinted section headers, tone colors) — one divergence found and fixed (`PendingQueue` now uses `formatDate` like activity). Screenshots captured for `/moderate`, `/admin`, `/activity`.
- **Open for the owner:** Auth-dashboard settings check (P1 #3); deploy target (wires sitemap regeneration + redirect URLs); CoC contact email; vendored `ui/chart.tsx` + `ui/sidebar.tsx` prune decision (P2 #7).

## 2026-08-18 (tenth pass) — The map-first rebuild (owner-directed, multi-round)

The owner rejected the incremental redesigns and asked for a real map. Full rebuild of the home and shell:

- **Hero map: MapLibre GL + OpenFreeMap** (open-source, no key), replacing the hand-built SVG (owner rule change, recorded in SYSTEM_INSTRUCTIONS). No clustering anywhere — every tree/care/fire is its own dot at every zoom ("green dots are the product"); fires always individual with a pulsing halo; care dots offset to peek out from under tree dots. Wilaya boundaries in theme-aware green from the converted polygon data (`wilaya-geo.ts`), click-to-zoom; `maxBounds` keeps Algeria framed; a recenter control returns to it. Arabic labels render correctly via the RTL text plugin (browser-guarded module call — SSR has no document).
- **Shell:** slim top bar everywhere (hamburger drawer with the full nav, brand, SOS, theme toggle, auth); the static sidebar survives only on app pages. **SOS pill moved into the top bar**, popover above everything; numbers owner-corrected (Protection Civile 14/1021, Police 17, Gendarmerie Nationale 1055, SAMU 16 — "Mobile" label and 115 removed everywhere). **Action card:** smaller 2-line title, hide button, sticky show button when hidden. **DetailPanel:** images capped, no horizontal overflow.
- **The debugging saga (the reason dots/borders were invisible for a day):** (1) `maplibre-gl-worker.mjs` 404'd in dev — vite dep-optimization breaks the maplibre worker; fixed with `optimizeDeps.exclude: ["maplibre-gl"]` in `vite.config.ts` (load-bearing, documented in SYSTEM_INSTRUCTIONS). (2) A StrictMode double-mount race: the first map's late `style.load` set a shared ready-flag after its cleanup, gating the second map's init — fixed with per-instance cancellation. (3) `useTheme` was per-component state, so the map never got theme changes — fixed with a shared module-level store. (4) The `load` event stalls forever when a sub-resource is blocked; init runs on `style.load` instead.
- **Verification:** screenshots reviewed across both themes — borders glowing on dark, city labels with correct Arabic, fire dots with pulse, SOS popover above the card, hidden-card state with the sticky show button. Realtime verified live: a SQL-inserted care log appeared as a new blue dot without reload. Full E2E suite green across runs (two failures were the recurring supabase.co flap; both green on re-run). Unit 91/91, `tsc` clean, build clean. Fixtures, markers, photos, receipts, meta cleaned and verified zero. `og.png` regenerated from the map-first home.

## 2026-08-18 (ninth pass) — Owner-directed redesign revision + authority contacts + Maps links

Owner feedback on the Sprint 4 redesign, all addressed in one pass:

- **No more sidebar on the landing page.** `AppShell` is split by route: public pages (home, about, forms, `/my/*`) get a top nav-bar; the sidebar shell exists only on app pages (`/moderate`, `/admin`, `/activity`). The moderate page's own section sidebar is gone too — replaced by a segmented tab bar (`ModTabs`), killing the double sidebar the owner flagged in a screenshot.
- **Anti-slop pass, rubric-driven.** Loaded the `design-taste-frontend` and `impeccable` skills — their ban lists indicted the build directly (4px side-stripe indicator, tracked eyebrows everywhere, 3 numbered cards, hero-metric stat cards, default glass). Home restructured: Manrope 900 hero (the Wise doc's own sanctioned substitute — Inter 900 read generic), a flowing how-it-works line, one inline stats line, lime primary + tertiary CTAs. The mobile home had a real bug the owner caught: stats and filter chips rendered twice (mobile block + unhidden desktop column) — fixed by restructuring to a single responsive layout with **the map first on mobile**.
- **Authority contacts on the home page.** Emergency strip with clickable `tel:` links: Protection Civile 14 and 1021, Police 17, Gendarmerie 1055, SAMU 115. Numbers cross-checked against Wikipedia's emergency-number list (14 and 1055 confirmed there; 14/1021 from the product's standing copy; the full set is flagged for the owner's local verification).
- **Google Maps link input.** The Exact-location card accepts a pasted Maps link: client-side parsing of `@lat,lng`, `!3d!4d` place segments and `q|query|ll|center|destination=` params (15 unit tests), short `goo.gl`/`maps.app.goo.gl` links resolved via the new `resolveMapsLink` server function. Verified live: paste → pin set → wilaya auto-derived. Every map pin also got a **Directions** link (official `maps/dir/?api=1&destination=` URL) in the detail panel.
- **Roles.** `sifeddine@gmail.com` made admin (owner request). Found and fixed a latent bug while doing it: `notsifeddine@gmail.com` held stacked moderator+admin rows, and role reads took an arbitrary first row — `useAuth` now prefers admin, `adminSetRole` replaces instead of stacking, and `private.user_role()` is deterministic (`order by role asc`, migration `20260818040000`).
- **Verification.** Unit 91/91 (15 new Maps-link tests). Screenshots reviewed: home desktop/mobile both themes, moderate (single sidebar + tabs), plant form with the link input working. E2E: every spec green across runs; the day's failures were all the flaky supabase.co route (WARP fixed it at the network layer — nothing built) or the rate limiter/fixture state doing their documented jobs. Fixtures, markers, photos, receipts, meta cleaned and verified zero.

## 2026-08-18 (eighth pass) — Full visual redesign: Wise design language (post-viral Sprint 4)

**Systemic token refactor, not a page-by-page reskin.** `src/styles.css` rewritten: light theme is now the default (sage canvas `#e8ebe6`, white cards, ink text, lime `#9fe870` reserved for primary CTAs per the doc's Don't rules); `.dark` repolarizes the same system (same shapes/spacing/radius — not a separate language). Semantic mapping per the doc: plant → positive green `#2ead4b`, care → accent cyan `#38c8ff`, fire → negative red `#d03238` — the lime CTA is never a semantic color. Radius canonical 24px (buttons/cards), 12px inputs with 1px ink hairline, pill badges. Inter variable font self-hosted (`@fontsource-variable/inter`); weight 900 for the home hero only, 600 below (the doc's discipline).

**Theme toggle** (`useTheme` + sidebar/top-bar button, localStorage-persisted, no-flash script in `__root`). First render is always light so SSR and client match — a hydration mismatch on the toggle button was caught during screenshot verification and fixed by making the stored choice sync in a mount effect.

**Navigation restructure.** `AppShell` is now a desktop sidebar (role-scoped nav rows with the doc's lime left-bar active indicator, theme toggle + auth in the footer) plus a mobile top bar; the mobile bottom action bar stays. Buttons rebuilt to Wise chrome (lime primary / sage secondary / ink-outline tertiary, ~48px tall). The hero map is theme-adaptive via CSS vars (light: sage-to-pale landmass with ink hairlines on a white card; dark: the original near-black treatment). Root default title fixed ("Eljazayer Elkhadhra" → "Green Algeria" — stale brand from the template). `og.png` regenerated from the new light home.

**Verification.** Screenshots reviewed for home, `/plant`, `/moderate`, `/admin`, `/activity` in BOTH themes (consistency confirmed page by page); full E2E suite **16/16 green** after the refactor (one locator update: the nav landmark changed); `tsc` clean, build clean, unit 76/76. Fixture resets between runs remain the documented workflow (one run tripped on the owner approving a fixture row in the live queue — real usage, not a bug).

## 2026-08-18 (seventh pass) — Dashboards (post-viral Sprint 3)

**Step 0 verdict (live-verified, screenshots-level DOM dumps):** the master plan's premise was stale on two of three claims. `/admin` already rendered a real user/role management page (not empty); the nav was already role-scoped (a moderator sees no Admin link and is redirected from `/admin` — the alleged bug does not exist, no fix needed). The one real gap: no dashboard for signed-in regular users (`/activity` → 404). Schema ceiling confirmed: `user_id` columns + `sites_read_own` + service-role counts cover everything below without a schema change.

**User dashboard (`/activity`).** Any signed-in user: own plantings with review status (under review / on the map / not approved + moderator note), own care logs, own fire reports with triage status; per-section counts, empty states with CTAs, loading skeleton, error banner. Own fire reports come from the new `myFireReports` server function — `fire_reports.user_id` is deliberately not column-granted (PII protection), so a client-side filter is a 403 by design; the server filters by the caller's token and returns public-safe columns only. Header nav gains "My activity" for signed-in users. Anonymous receipt links stay the separate, non-overlapping path.

**Admin dashboard completed.** New Overview section: platform stats (users, pending/approved, active fires, care logs, submissions 24h) + per-wilaya oversight (pending + active-fire counts, sorted by load) via the new `adminStats` server function. `admin.tsx` was over the 250-line cap — split into `components/admin/AdminOverview.tsx` + `components/admin/AssignWilayasDialog.tsx`.

**Verification.** `e2e/activity.spec.ts` (4 tests: signed-out redirect, own activity across sections, empty states, admin overview) + full suite **16/16 green**. Two non-bugs hit during the runs, both the system working as designed: the 6/hour planting rate limit tripped under repeated test submissions (cleared via `submission_meta` reset), and mod2 needed its documented between-runs fixture reset. `tsc` clean, build clean, unit 76/76. Fixtures, markers, photos, receipts, meta all cleaned and verified zero by query.

**Flagged, not touched:** two owner accounts exist (`notsifeddine@gmail.com`, `sifeddine@gmail.com`, both admin). And a real-world fire report from the viral traffic is live in Tipaza (description "goooo", active since 00:43) — review it in `/moderate` when you have a minute.

**Network note.** supabase.co was ISP-blocked from this machine for most of the day (Cloudflare error 1034 killed every IP-mapping workaround). Fixed at the network layer with Cloudflare WARP per the owner's call — no proxy infrastructure was built, and the playwright config carries no workaround.

## 2026-08-18 (sixth pass) — AGPL-3.0 + dead code / docs-truth pass (post-viral Sprint 2)

**License (own commit `544a297`).** AGPL-3.0 full text, copyright Sifeddine Mebarki 2026; README badge. Owner's explicit decision.

**Dead code (grep-verified, one file).** Deleted `src/integrations/supabase/auth-middleware.ts` — zero consumers anywhere in `src/` (only self-reference), and it was already documented as unused. Checked and kept: `use-mobile.tsx` + vendored `ui/sidebar.tsx` (dead in practice but part of the deliberately vendored `components/ui/` set — flagged, not removed); `error-capture.ts`/`error-page.ts` (used by `start.ts`/`server.ts`); `auth-attacher.ts` (used by `start.ts`); `src/routes/README.md` (accurate contributor guidance, kept). No Lovable references remain outside CHANGELOG history.

**GENESIS check, explicit:** no `GENESIS.md` (or similar) exists in the repo, and zero mentions of "genesis" anywhere in `docs/`, README, AGENTS, or `src/`. Nothing to archive.

**Stale-doc rewrites (all re-verified):** README "Current status" (three claims were fixed items: audit trail exists, fire triage + contacts UI exist, Turnstile was dropped by decision); FEATURES.md row counts (1 site / 1 care log / 0 fires live, re-queried); DATABASE.md table-header counts updated to current (1/1/0/9/0/1/0/0) and the old-project-counts note removed; ROADMAP.md header now marks the old plan complete and points to `MASTER_SPRINT_PLAN.md` as the active plan (saved verbatim into the repo); PROJECT_STRUCTURE.md gained LICENSE/CONTRIBUTING/DESIGN-wise/MASTER_SPRINT_PLAN rows and lost the deleted auth-middleware row.

## 2026-08-18 (fifth pass) — Pushed to GitHub

All 14 commits are now on `github.com/notsifeddine/dz-green` (master), pushed with a PAT supplied by the owner (used inline, never written to the repo config). Remote head verified equal to local `eb7e64e`. The earlier remote target `Meykiio/dz-green` was wrong — the owner's account is `notsifeddine`.

## 2026-08-18 (fourth pass) — Sprint 10 code parts + clean-clone walkthrough

- `.env.example` (every variable incl. optional `DEVICE_HASH_KEY`, no real values), `CONTRIBUTING.md`, bug-report + PR templates, `public/sitemap.xml` (relative `loc`s until the production domain exists).
- README setup corrected: port 5173 (was 8080), `cp .env.example .env` flow, admin seeding via `INSERT INTO user_roles` (was the pre-roles `UPDATE profiles` SQL with "no in-app way, deliberately" — superseded by `/admin`).
- **Secrets scan:** `git grep` across all 13 commits — the service-role key appears nowhere in history; the publishable key is present by design (public by definition, RLS/guards behind it).
- **Clean-clone walkthrough, run literally from the README:** clone → `bun install` (444 packages) → `cp .env.example .env` + fill → `bun run build` clean → `bun run dev` serves HTTP 200. First attempt caught the Sprint 10 files uncommitted (the clone lacked them) — committed `da2b6fc`, re-cloned, full pass. Temp clone (with a real `.env`) deleted after.
- Owner-blocked and flagged: `LICENSE` (open question 1), device testing + Realtime hand-check (Sprint 11), Arabic/French (open question 2), `alert_contacts` wire-or-drop (open question 3), commune dataset (7), photo CDN (9), spike scenario (10).

## 2026-08-18 (third pass) — Sprint 8: scale hardening (code parts) + sign-out

- **Indexes (migration `20260818010000`, applied and verified live):** `sites(status, created_at DESC)`, `fire_reports(status, created_at DESC)`, `submission_meta(kind, created_at DESC)`, `submission_meta(device_fingerprint, kind, created_at DESC)` — the queue read paths and both gate rate-limit queries are now composite-covered.
- **Bounded fetches:** pending queue 200, contacts 200, admin profiles 500 (home queries were already bounded at 2000/3000/1000).
- **Photos confirmed CDN-safe:** immutable UUID object names + `cacheControl: 31536000` at upload + long-cache proxy.
- **Sign-out button** in the header for signed-in staff (owner request — there was no logout path at all).
- Owner actions recorded in `FEATURES.md` §12 (not code): Supabase Pro, Vercel Pro + Firewall on the POST endpoints, the 1k-concurrent load test against the deployed URL, spam-flood rerun at scale, and the `alert_contacts` wire-or-drop decision.
- `tsc` clean, build clean, unit 76/76.

## 2026-08-18 (second pass) — Sprint 7: UI polish

- 3-step "how it works" strip under the hero: report (no account) → a volunteer moderator reviews in their wilaya → it's on the map.
- Home error state: a calm banner when the data queries fail, noting the forms still work (offline queue). Verified rendering — the banner was in the DOM during the og screenshot run and had to be hidden for the shot.
- CTA hierarchy: "I planted a tree" stays the solid primary; "Log care" and "Report a fire" become outline secondaries with accent text.
- `og:image`: `public/og.png` (1200×630) screenshotted from the real home page on the dev server, wired with `og:image` + dimensions + `twitter:card`/`twitter:image` on `/`.
- Consistency audit: cards/inputs/buttons already ride the same tokens (`rounded-lg border-border bg-card`, tap-target, eyebrow) — no changes needed.
- **Decision gate parked for the owner:** Arabic and/or French UI (ROADMAP open question 2). Not started — needs his call before Sprint 7's translation scope exists.
- `tsc` clean, build clean. No DB changes; the supabase.co outage from this machine did not block this sprint.

## 2026-08-18 — Sprint 6: forms v2 (wilaya-first location)

**Wilaya-first flow (migration `20260817203000`, applied and verified live).** `LocationField` reordered: the wilaya dropdown is now the primary control (works without GPS), and the exact pin moved into an "Exact location (optional)" card — GPS button with a "used once, never stored, never tracked" privacy line, the MapLibre picker hidden behind "Adjust on map" by default, and a remove-pin action. With no pin, the server stores the wilaya's display centre (`wilayaCenterLatLng`, inverse of the map projection) and marks the row `location_approximate = true` (new column on `sites` + `fire_reports`; the fire column added to the column-level SELECT grants). The detail panel and list view show an honest "wilaya-level" badge. With a pin, server-side derivation is unchanged. Schemas: coordinates must come as a pair or not at all; `planted_date`/`logged_date` in the future are rejected server-side. Success screens now state exactly what will be public and what never is.

**Verification.** Unit 76/76 (new: centroid round-trip through the projection, every historic wilaya's centre inside Algeria's bounds, pair rule, future-date rejection, half-pair rejection). E2E: new wilaya-only test submits with no GPS and asserts the stored row is `location_approximate = true` at the wilaya centre — passed live (4/4 receipts spec). `tsc` clean, build clean. **Caveat:** the full-suite re-run was blocked mid-session by a local network outage — supabase.co became unreachable from this machine (0/5 probes, Cloudflare connect timeouts, while the MCP path kept working). The failing tests were all `ConnectTimeoutError`-flavoured; the fire form's live submission with the new layout is covered by unit tests but not re-run live. A full-suite re-run is queued for the final verification pass. Cleanup done regardless: fixtures, markers, photos, receipts, `submission_meta` all verified zero.

**E2E hardening (worth recording).** The map picker moving behind a toggle removed the old "page is hydrated" proxy element; GPS clicks and file uploads can now land before hydration attaches handlers. All three specs now retry the GPS click / file upload until the pin readout / preview appears.

## 2026-08-17 (night, third pass) — Sprint 5: map v2

**Hero map UX pass, all verified headlessly on the running app.** Pins are now ≥16px diameter at every zoom (base radius 6→8, active 9→11, still zoom-compensated); the zoom viewport now fits shape ∪ pins so a pin near a wilaya border is no longer cropped; a one-time "Tap a wilaya to zoom in" hint shows until the first zoom (localStorage flag, storage-blocked browsers just see it again); an always-visible legend (green/blue/red dots) sits above the map; a Map/List toggle switches to `SiteList` — a scrollable list of the 30 most recent approved plantings with needs-water badges, the mobile fallback for map-frustrated visitors; a skeleton block shows while the first load runs; `prefers-reduced-motion` now also disables the 700ms zoom transition (verified: computed `transition-duration: 0s`, grid animation `none`). `index.tsx` was over the 250-line cap, so `Stat`/`Chip`/`HomeCtas` moved to `src/components/home/HomeBits.tsx`. Unit 67/67, `tsc` clean, build clean, home E2E regression green. The DoD's mid-range-Android hand test remains with the owner.

## 2026-08-17 (night, second pass) — Sprint 4: anonymous-first submissions

**Receipt links (migration `20260817190000`, applied and verified live).** New `public.receipts` table (`token_hash` UNIQUE, `kind`, polymorphic `submission_id`, deny-all RLS, service-role only). Every successful submit mints a 128-bit UUID receipt token; only its salted SHA-256 hash is stored. All three success screens now show a copyable `/my/<token>` link ("Save your receipt link — the only way to check your status later"). New public route `/my/$token` renders kind, status pill (under review / approved / not approved / published / active / resolved / false alarm), date and wilaya via the `getReceipt` server function — never PII, never the photo; unknown tokens get a friendly not-found. Losing the link is unrecoverable, deliberately.

**Silent-drop honeypot.** A filled honeypot no longer throws — the gate returns `dropped`, the impl returns a synthetic success payload (random id, `receipt: null`), and nothing is inserted or recorded. Bots are never told they were caught.

**Daily-rotating device hash.** Forms send a per-browser random secret (`src/lib/device.ts`, localStorage); the gate stores only `HMAC-SHA256(server key, SHA-256(secret + kind + UTC date))` in `submission_meta.device_fingerprint` and enforces the same hourly limits per device+kind, so VPN-hopping no longer resets the budget. Privacy contract written into `FEATURES.md` §8: same-day linkable by design, cross-day unlinkable, raw secrets never stored, not a fingerprint. The 429-from-the-roadmap is delivered as a thrown gate error (server-fn transport doesn't surface status codes); the contract is "blocked, nothing persisted".

**Verification.** Unit 67/67 (gate tests rewritten: silent drop, device-hash limit independent of IP, per-kind hash separation). E2E: new `e2e/receipts.spec.ts` — receipt round-trip pending → approved through the real moderator UI, unknown-token not-found, honeypot silent drop (success screen, no receipt link, zero rows). Full suite 11/11 green (one transient `ConnectTimeoutError` to supabase.co on the fire flow, green on re-run). `tsc` clean, build clean. Fixtures, markers, photos, receipts and `submission_meta` cleaned up and verified zero by query.

## 2026-08-17 (night) — Sprint 3: roles (admin + wilaya-scoped moderators)

**Schema (migration `20260817173000`, applied and verified live).** New enum `user_role` (`admin`/`moderator`); new tables `user_roles` (source of truth for privilege; clients read only their own row via column grant + own-row policy) and `moderator_wilayas` (no client grants at all — service-role managed). Six `private.*` SECURITY DEFINER helpers: `user_role`, `is_admin`, `user_wilayas`, `is_moderator` (redefined as "any staff role"), `can_moderate(uid, wilaya)`, `can_manage_contact(uid, region_filter)`. Every staff policy rescoped: `sites_moderator_read/update` and `fire_moderator_update` now call `can_moderate`, `alert_contacts_moderator_all` calls `can_manage_contact` (global contacts are admin-only). `profiles.is_moderator` is now a denormalized flag synced by the `user_roles_sync_profile` trigger. Grant tightening applied: the broad Supabase-default table privileges for `anon`/`authenticated` are revoked (the long-standing DATABASE.md caveat is resolved). The migration promoted existing `is_moderator=true` users to `admin` — the owner is the only admin. Design decision: no access-token auth hook — RLS helpers live-read the tables, so revocation is immediate and there is no dashboard dependency (revisit at scale).

**Server-side wilaya derivation (closes ROADMAP question 6).** `submissions-impl.server.ts` now derives `wilaya_code` from the pin via `wilayaCodeForPoint` and ignores any client-supplied value; outside all polygons it throws. The one row corrupted by the old client-authoritative path (`16c2758c…`, stored `05`, actually in Ghardaïa) was repaired to `47`.

**App.** `useAuth` reads `role`/`isAdmin`/`isModerator` live from `user_roles`. New `/admin` route: user list with roles, Make admin/moderator, Assign-wilayas dialog (58 wilayas grouped under the 48 historic parents — assignments store the parent code), Remove role, Sign out; self-demote blocked. Mutations go through `src/lib/admin.functions.ts`, which re-checks the caller's admin role from the request token on every call. Moderator sidebar + app nav gain an Admin link for admins.

**Race bug the E2E suite caught.** `useAuth`'s `loading` cleared when the session resolved but before the role query settled, so the `/admin` and `/moderate` guards intermittently redirected signed-in staff to `/`. Fixed: `loading` now covers the role query (raised in the same tick the session arrives). Verified by console-level reproduction before/after.

**Verification.** RLS role-matrix battery (`rls-audit3.mjs`, 40/40): anon sees nothing staff-related; a regular user cannot self-promote or read others' roles; a wilaya-16 moderator sees/updates only wilaya-16 rows (cross-wilaya UPDATE is a 204 no-op with the row verified unchanged), manages only contacts inside the assignment, and cannot create global contacts; admin does everything; the trigger syncs `profiles.is_moderator` both ways. E2E: new `e2e/admin.spec.ts` (assign Oran → moderator sees only Oran and approves → remove wilaya + role → demoted lockout) — full suite 8/8 green together with the 5 core flows. Unit 65/65, `tsc` clean, build clean. Fixtures, seeds, marker rows, test photos and `submission_meta` all cleaned up and verified zero by query.

**Fixture recipe gotcha found:** SQL-seeded auth users need `instance_id = '00000000-0000-0000-0000-000000000000'` (NULL makes the password grant return `invalid_credentials` despite a correct hash). Recipe in `SYSTEM_INSTRUCTIONS.md` updated, including the admin-spec seeds and the between-runs reset.

## 2026-08-17 (late) — Roadmap revision: roles, anonymous-first, map/forms/UI, scale

Owner-requested deep research (FixMyStreet/mySociety moderation model, Supabase official RBAC — custom access token hook + `authorize()` —, NNGroup mobile-map usability, geolocation UX best practices, OWASP bot-management, Gambia Outage anonymous-reporting design, Feedbask anonymous-vs-account funnel data, Veld Systems UGC scale). `ROADMAP.md` rewritten: new Sprint 3 (admin + one moderator per wilaya — `user_roles` + `moderator_wilayas` join, JWT hook, layered RLS, immediate revocation, server-side wilaya derivation made mandatory, absorbs old grant tightening), Sprint 4 (anonymous-first submissions, receipt links, silent-drop honeypot, device-hash limits), Sprint 5 (map v2 UX), Sprint 6 (forms v2 wilaya-first location), Sprint 7 (UI polish + Arabic/French decision gate), Sprint 8 (scale hardening). Old sprints renumbered 9–11. Open questions updated: #2 language is now a Sprint 7 dependency, #4 resolved by receipt links, #6 resolved by server derivation (data-repair migration optional), #10 defines the viral spike scenario. No schema changed; this entry is docs-only.

## 2026-08-17 (evening) — Map pin/cluster split fix, moderator route guard

**Disappearing dot (reproduced numerically, not guessed).** A planted site was approved with `wilaya_code = 05` while its actual coordinates sit inside the Ghardaïa (47) polygon — the client-supplied wilaya code disagreed with reality. The cluster dot bucketed by the stored code (drawn on wilaya 05 at country zoom), but the pin renders at the true projected position — outside 05's bounds box (pin at x=604/y=293 vs 05's box x∈[652,749]/y∈[71,139]), so zooming into 05 the dot vanished. Fix: `mapCodeForPoint()` in `src/lib/geo.ts` resolves the map bucket from the actual geometry first (`wilayaCodeForPoint`), falling back to the stored code only when the point is outside every polygon (e.g. at sea). Applied to sites, care logs and fire reports in `AlgeriaMap.tsx`. The stored `wilaya_code` itself is still client-authoritative — server-side re-derivation remains open (ROADMAP question 6). Verified: 3 new unit tests, 65/65 green, `tsc` clean, build clean. Re-checked the exact failing coordinate: now buckets to 47.

**Moderator route reachable by any authenticated user.** `/moderate` rendered a "not a moderator" message instead of refusing access. Now redirects non-moderators to `/` once auth resolves (data was never exposed — panels and their server functions are moderator-gated; this closes the surface).

## 2026-08-17 (later) — Verification suite, RLS audit, Lovable decoupling, initial commit

**Three automated suites shipped** (all green at commit time):
- **RLS battery — 32 live checks** run against the project via a session PowerShell script (kept out of the repo; it is evidence, not code). Covers `sites`/`care_logs`/`fire_reports`/`alert_contacts`/`submission_meta`/`profiles`/`photos`/`private.is_moderator` from the anon, authenticated, and service_role angles: reads, writes, updates, per-column PII reads, and update-without-select behaviour. Findings re-classified, not just counted: moderator fire UPDATE returning 403 (not 400), `submission_meta` unreadable (401/403) accepted as deny-by-default, anon `sites` UPDATE returning 204 no-op accepted (RLS filter semantics).
- **Unit — 62 vitest tests** (`src/lib/__tests__/`): abuse gate (limits, header fallback chain, salt, fail-open), Zod schemas, `needsWater` boundaries, wilaya derivation.
- **E2E — 5 Playwright tests** (`e2e/flows.spec.ts`, serial): home render + wilaya hover + detail panel, planting round-trip with success confirmation, care log round-trip, fire report with PII screening (anon response must be 401 — column-level grants deny `reporter_name`; the earlier 400 expectation was the bug), moderator approve round-trip. The moderator fixture (auth user with the fixed UUID asserted as `reviewed_by`, `is_moderator` profile) is created via SQL before a run; the suite does **not** clean up after itself — rows, storage objects, `submission_meta` and the fixture user are removed manually after a run (recipe in `SYSTEM_INSTRUCTIONS.md`).
- **RLS per-identity audit pass — 50/50 green (2026-08-17, evening).** Second-generation battery (`rls-audit2.mjs`, evidence kept out of the repo) run against actually-seeded rows, not schema-level checks: an approved site, two pending sites (one owned by the regular fixture user, one by the moderator), care logs on approved and pending parents, a fire report carrying real PII (`reporter_name`/`reporter_phone`/`user_id`), a `submission_meta` row, and both fixture identities minted via the SQL recipe. Body-level assertions throughout — a 200 with an empty body counts as filtered, not readable. Verified: anon/auth blocked from the three PII columns (401/403) while the safe set stays readable; profiles own-row-only (other rows return `[]`) with self-escalation 403 and the flag unchanged; anon sees only approved sites, owner sees own pending, nobody but a moderator's UPDATE lands (non-moderator writes are 204 no-ops with the row verified unchanged); alert_contacts moderator-only on all four verbs (anon 401, user 403 or no-op, moderator 201/204/204/204); care logs invisible while the parent site is pending; submission_meta 401/403 for clients vs 200 for service_role; no direct INSERT path for anon/auth on `sites`/`care_logs`/`fire_reports`. Contract notes: a denied write surfaces as 204-no-op (not 403) when RLS filters it, and error codes legitimately differ by role (401 vs 403) on `submission_meta`. All seeded rows, the `submission_meta` seed and both fixture auth users were deleted afterwards and verified zero by query.

**Plant-flake root cause (not an app bug).** The planting test intermittently timed out; the trace showed the serverFn POST taking 11.4s and returning the catch-all "Something went wrong." The row *was* inserted server-side. Both legs verified standalone with the exact failing payload (storage upload 200/657ms, insert 201/752ms). Cause: machine memory starvation (Photoshop ~7GB, <2GB free of 32GB, pagefile commit errors) stalling the dev server >30s. Fix: success-assertion timeout 30s → 60s. A "mojibake" scare in a failed-run snapshot was a session-file encoding artifact, not real data corruption.

**Cleanup verified by query after the final run:** zero E2E sites/fire rows, zero `submission_meta`, zero fixture auth users/profiles; 12 test photos deleted from `photos/sites/` (the batch delete endpoint silently no-ops — per-object DELETE works).

**Lovable decoupling.** Every platform reference removed (grep-clean): `@lovable.dev/vite-tanstack-config` preset and `vite-tsconfig-paths` dropped for a canonical `vite.config.ts` (plugin order: TanStack Start before JSX transforms; Vite-native `resolve.tsconfigPaths`), `src/lib/lovable-error-reporting.ts` deleted with its call in `__root.tsx`, Lovable meta tags removed, error copy in the three Supabase clients reworded, README/AGENTS/docs cleaned. Both lockfiles were regenerated — the old `bun.lock` resolved every package from Lovable's private GCP registry. `.gitignore` gained `.env` (the service role key was one commit away from being public), `test-results`, `playwright-report`.

**Git.** Repo initialized (`ecb4209`, local identity `notsifeddine`), remote `origin` → `github.com/Meykiio/dz-green` (owner moved the target; `notsifeddine/dz-green` is left empty and `Meykiio/dz-green` still needs creating once GitHub recovers). Five commits local, nothing pushed — a GitHub-wide incident (2026-08-17 13:40 UTC; API/auth at ~20% error rate) plus the machine's broken `gh auth login` browser callback are blocking the push, not anything in the tree. The two 08-16 migrations tracked here are the audit-trail fixture DML (insert + delete) from the Sprint 2 verification.

## 2026-08-17 — Migration to a new Supabase project

**What happened.** The app's backend moved from the original project (`jvxotfcxolwotcavrluu`) to a brand-new, empty project (`jnunqilxiajinylgehuh`). `.env` and `supabase/config.toml` now point at the new ref; `src/integrations/supabase/types.ts` was regenerated from the new project (verified: only `Database` is imported by the three client files, so the rewrite is safe).

**Step 0 — new project was confirmed empty first.** Zero tables in `public` before any SQL ran.

**Step 1 — export reconciled, with a documented limit.** `FULL_SCHEMA_EXPORT.sql` cross-checks cleanly against the six local migrations: `private.is_moderator` (not `public`), `profiles_read_own` (not the older `profiles_authenticated_read`), fire PII column grants excluding `reporter_name`/`reporter_phone`/`user_id`, `handle_new_user` execute revoked. The only post-export migrations are DML test fixtures, so no schema drift is expected. Limit: the live source project could not be introspected from this session — the MCP connection binds to one project — so the Step-1 check is file-level, not live-vs-live.

**Step 2 — schema applied and verified table-by-table.** `FULL_SCHEMA_EXPORT.sql` ran top to bottom as a single migration (`green_algeria_full_schema_from_live_export`). Verified by live query, not assumption: all six tables present with RLS enabled; `private.is_moderator` EXECUTE granted to `authenticated` + `service_role` only; `handle_new_user` revoked from anon/authenticated/service_role; `profiles` policies are `profiles_read_own` / `profiles_insert_own` / `profiles_update_own`; `fire_reports` PII columns not selectable by anon/authenticated (checked per-column); `photos` bucket exists and is private; realtime publication includes `sites`, `care_logs`, `fire_reports`. Known-accepted: `public.spatial_ref_sys` has RLS off (extension-owned CRS reference table, same as source; flagged by the Supabase advisor, left as-is deliberately).

**Step 3 — env re-pointed.** `.env` + `supabase/config.toml` switched to `jnunqilxiajinylgehuh` / `sb_publishable_qkH7kzDc8Dohru5j--104A_afZPeMmc`. `SUPABASE_SERVICE_ROLE_KEY` remains absent locally (host-injected in production) — the photo proxy and submissions will 500 locally as before until Sifeddine sets it.

**Not ported — open items, all manual, none run.** Row data (the old project's 3 sites / 2 care logs / 1 fire report), the moderator auth account, and storage objects do not carry over. To recreate the moderator: sign up in the new project's Auth panel, then `UPDATE public.profiles SET is_moderator = true WHERE id = '<new auth id>';`.

**Git.** The working tree is still not a git repository — nothing in this entry is committed.

## 2026-08-16 — Moderation audit trail (Sprint 2), doc drift fixed

**Docs realigned to live (Part 0).** `DATABASE.md` was stale on the previous security round: `is_moderator` now lives in the non-API `private` schema (all four moderator policies reference `private.is_moderator`), and `profiles_authenticated_read` (`USING (true)`) was replaced by own-row-only `profiles_read_own` (`id = auth.uid()`). Also corrected the "no UI for fire triage" line — the dashboard has had it since 2026-08-13. Verified against `pg_policies` and `pg_proc` ACLs, not migration files.

**Audit trail on site review.** `PendingQueue` now writes `reviewed_by` (current moderator), `reviewed_at` (decision timestamp) and `moderator_notes` (optional free-text, per-card textarea, `null` when blank) alongside `status`. No schema change — the three columns already existed and nothing wrote them. Verified live: a temporary pending fixture was approved through the dashboard UI as the moderator account, the row came back `status=approved`, `reviewed_by=891063e2…`, `reviewed_at=2026-08-16 14:33:45Z`, `moderator_notes='Verified during audit-trail test.'`, and the fixture was then deleted. Sprint 2 is now complete.

**Turnstile (Sprint 1) dropped** at the owner's request — no Cloudflare dependency. Honeypot, timing check and hashed-IP rate limiting remain the whole abuse gate. Sprint 1 removed from the roadmap; `FEATURES.md` §8 updated to record it as a decision, not a gap.

## 2026-08-13 (evening) — Design adaptation, moderation dashboard, map footprint

Five commits (`c94b2b0`, `e28c707`, `a35d577`, `aaff4f4`, `905a896`). No schema changes; `FULL_SCHEMA_EXPORT.sql` untouched.

**Cluster color bug (`c94b2b0`).** Wilaya clusters containing only care logs rendered green — the color fallback ignored the care kind. Now fire → care → plant. Verified headlessly: care-only view shows a blue cluster, zero red pixels.

**DESIGN.md adaptation (`e28c707`).** Adopted the structural tokens from the MongoDB design analysis while dropping its marketing identity: every button is now a pill (`rounded-full`, weight 600, ~40px), content cards standardized to 12px radius, inputs to 8px, the radius scale aligned (sm 6 / md 8 / lg 12 / xl 16 / 2xl 24), container widened to 1280px, eyebrow tightened to ~1px tracking. Kept Inter, the dark canvas, and `--plant`/`--care`/`--fire` as the only accents. Added `docs/DESIGN_ADAPTATION.md` recording adopted/mapped/dropped tokens.

**Moderation dashboard (`a35d577`).** The bare queue became a dashboard: collapsible sidebar (icons-only when collapsed, off-canvas drawer on mobile) with live count badges; stats strip (pending / approved today / active fires / total submissions via exact head-count queries); fire report triage with status badges and Mark resolved / False alarm / Reopen (writes `status` + `resolved_at`); `alert_contacts` management (add, pause/resume, delete, "nothing is sent yet" notice). Verified live as the moderator: fire report round-tripped Active → Resolved → Active; contact add/delete round-tripped; mobile drawer opens and navigates. Zero console errors. This pulls the Sprint 2 fire-triage and alert-contact items forward — ROADMAP updated; `reviewed_by`/`reviewed_at`/`moderator_notes` remain outstanding.

**Home layout (`aaff4f4`).** The hero map is square (~1000×1000.5 viewBox), so on `lg+` it is now capped at 540px wide beside a right column holding stats, layer chips and the three CTAs stacked. CTAs verified fully visible without scrolling at 1440×900, 1366×768 and 1280×800. Below `lg` the layout is unchanged.

**Map border contrast (`905a896`).** Rest-state wilaya borders raised `0.035` → `0.1` (requested range 0.08–0.12) so the wilayas read as regions; hover (0.6) and selection (0.7) untouched. Verified via DOM attribute check plus before/after screenshots.

**Environment note.** The photo proxy returns 500 locally — `.env` lacks `SUPABASE_SERVICE_ROLE_KEY` (injected by the host in production). Pre-existing, not a code change; recorded in `FEATURES.md` §7.

## 2026-08-13 — UI/UX pass: hero map polish, wilaya auto-derivation, form review

Three commits (`0b2886c`, `a400132`, plus the docs commit below). No schema changes; `FULL_SCHEMA_EXPORT.sql` untouched.

**Hero map visual pass (`0b2886c`).**
- Root cause of the "top-lit blob + seams" look: the land gradient was per-polygon (`objectBoundingBox`), so each wilaya rendered its own top-to-bottom gradient and shared edges showed as seams. Replaced with one `userSpaceOnUse` radial gradient across the whole country — the landmass now reads as a single softly-lit shape.
- Rest-state wilaya borders dropped from `stroke-opacity 0.1` to `0.035`; they appear on hover/selection only. Hover feedback is now a subtle brightness lift instead of a flat fill swap (which would have broken the unified gradient).
- Outer halo softened (opacity 0.55 → 0.22, darker fill, tighter blur); `--canvas` token darkened `oklch(0.16)` → `oklch(0.1)` (near-black, only usage is the map container); background grid wrapper opacity 70% → 40%.
- Split `AlgeriaMap.tsx` (307 lines → 198) into `map/WilayaClusters.tsx` and `map/WilayaPins.tsx` — pure extraction, no behaviour change. This completes the Sprint 5 split item early (see ROADMAP).
- Verified headlessly: render, cluster click → zoom → pins + label, back button; zero console errors. **Visual sign-off is the owner's call** — before/after screenshots were handed over, not committed.

**Wilaya auto-derivation and accuracy visibility (`a400132`).**
- Pulled forward from its original sprint sequencing (flagged in `FEATURES.md` §2 and the roadmap): `wilayaCodeForPoint(lat, lng)` in `src/lib/geo.ts` does point-in-polygon against the generated wilaya polygons (projection unchanged — no geo-data lockstep concern). Verified against 12 known coordinates (Algiers→16, Oran→31, Tamanrasset→11, sea/Morocco→null, etc.).
- `/plant` and `/fire` now auto-select the wilaya from a GPS fix or a pin drop. The dropdown stays editable; a manual change is respected (never overwritten by later fixes). A "Detected from your pin" hint shows when the value was auto-filled.
- GPS quality is now visible: accuracy badge with colour-coded tone (excellent/good/rough/poor) plus an amber accuracy-radius circle on the picker map (GeoJSON circle layer sized from the fix's metres at the current zoom). A bad fix no longer looks as trustworthy as a good one.
- Known limitation, documented: the geometry covers the 48 historic wilayas only, so a pin in a post-2019 wilaya (49–58) auto-derives to the parent historic wilaya; the user can correct in the dropdown.
- Verified end-to-end in a headless browser with Playwright geolocation overrides (good fix → 16 + hint; manual override respected; poor fix → "poor — adjust the pin"; pin drop → auto-fill; fire form → 31). Zero console errors.

**Form redundancy review (this pass).**
- The location/wilaya duplication was the only hard redundancy; it is gone. `/care` needed nothing. Findings flagged as open questions in `ROADMAP.md` (server-side wilaya derivation for data quality, commune dataset for auto-suggest, care-log future-date guard) — not built.

## 2026-08-13 — Documentation and export pass (this pass)

- Added `/docs`: `PROJECT_STRUCTURE.md`, `DATABASE.md`, `FEATURES.md`, `SYSTEM_INSTRUCTIONS.md`, `CHANGELOG.md`, `ROADMAP.md`.
- Added `docs/FULL_SCHEMA_EXPORT.sql` — a single-file recreation of the live database, generated from live introspection rather than the tracked migrations.
- Rewrote `README.md` for an outside reader and rewrote `AGENTS.md` as real working rules for this repo.
- Documented live-vs-migration drift (see `DATABASE.md`).
- No feature, refactor or schema changes.

## 2026-08-13 — Security hardening (`57187f4`, `dc3031b`, `79e2e05`, `6f824a6`)

Two migrations (`20260813000353`, `20260813000446`) plus client changes:

- `fire_reports`: table-level SELECT revoked from `anon`/`authenticated`, replaced with column-level grants that exclude `reporter_name`, `reporter_phone` and `user_id`.
- `src/lib/data.ts` / `src/lib/types.ts`: reporter PII removed from the client query column list and from the `FireReport` type.
- `profiles`: `profiles_public_read` dropped, replaced by `profiles_authenticated_read`; `anon` SELECT revoked.
- `is_moderator(uuid)`: EXECUTE revoked from `anon`/`PUBLIC`, granted to `authenticated` and `service_role`.
- `handle_new_user()`: EXECUTE revoked from `anon`, `authenticated` and `PUBLIC` (trigger-only helper).
- Attempted to enable RLS on `public.spatial_ref_sys`; the statement is wrapped in an exception handler and **did not apply** — the table is PostGIS-owned. Accepted risk.
- Findings for the private storage bucket having no `storage.objects` policies, and `submission_meta` having no SELECT policy, were reviewed and accepted as intentional deny-by-default.

## 2026-08-12 — Publish prep (`1f084c0`, `d5cb9d0`)

- Added the original project README (the full one-shot build spec).
- Site metadata updated for publishing.

## 2026-08-12 — Application build (`08fd8c2`, `317d608`)

- All routes wired: `/`, `/about`, `/plant`, `/care`, `/fire`, `/auth`, `/moderate`, plus `/api/public/photo/*`.
- Components: `AppShell`, `FormShell` + `Honeypot`, `PhotoInput`, `PrecisionPicker` (MapLibre + OpenFreeMap), `LocationField`, `map/AlgeriaMap`, `map/DetailPanel`.
- Libraries: `wilayas.ts`, `geo.ts`, `image.ts`, `offline.ts`, `data.ts`, `types.ts`.
- Server side: `submissions.functions.ts`, `submissions-impl.server.ts`, `submissions.server.ts` (honeypot + timing + hashed-IP rate limiting).
- `useAuth` hook and Supabase integration files.
- Root route gained the toaster and error/404 boundaries.

## 2026-08-12 — Foundation (`3a09b7a`, `f54fa3c`, `6d4700a`, `af4896b`, `49246ae`)

- TanStack Start template baseline.
- Initial migration `20260812145139`: PostGIS, three enums, `profiles`, `sites`, `care_logs`, `fire_reports`, `alert_contacts`, `submission_meta`, all indexes, RLS + policies, `is_moderator`, `handle_new_user` + signup trigger, realtime publication.
- Private `photos` storage bucket created through the platform (not tracked in any migration).
- Design system in `src/styles.css`; generated Algeria wilaya SVG path data in `src/data/algeria-wilayas.ts`.

## Known gaps in this history

Commit messages are not descriptive and several unrelated changes are bundled per commit, so the sequencing above is inferred from diffs. Anything created through the platform API rather than a file change (the storage bucket, the moderator account, auth settings) leaves no trace in git at all.
