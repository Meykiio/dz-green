# FEATURES — current state

What exists today, feature by feature. "Verified" = traced or executed
against the live app (latest full pass: 2026-09-12, E2E 16/16 + unit 219/219
+ build). Status of every flow is checked by the live E2E suite
(`e2e/`, run per `SYSTEM_INSTRUCTIONS.md` §fixture recipe). History lives in
`CHANGELOG.md`.

## Public surface

| Feature | State | Notes |
|---|---|---|
| Home map (5 layers) | verified | MapLibre + OpenFreeMap; trees/care/fires/satellite/risk; realtime; active fires only on public views; detail panel per kind; action card (stats strip, CTAs, icon toggles); Map/List/Board views; monthly wilaya leaderboard; activity ticker. |
| Plant flow (`/plant`) | verified | Photo required (on-device compression), wilaya-first location (GPS best-fix watch, map picker, Google Maps link parse, wilaya-only → approximate), species suggestion (PlantNet) + planting guide (GBIF evidence × climate), contact phone (PII-protected), receipt link. E2E-covered. |
| Care flow (`/care`) | verified | Approved-sites picker, 4 actions, date/photo/notes, publishes instantly, receipt link. E2E-covered. |
| Fire flow (`/fire`) | verified | Publishes instantly, Protection Civile disclaimer on form + success screen (asserted by E2E), severity chips, reporter PII server-only, Web Push fan-out, receipt link, community confirmations (vote buttons + counts + verified badge — UI live, **schema pending owner approval**, see `pending-migrations/`). |
| Receipt links (`/my/<token>`) | verified | Anonymous status lookup; only the salted token hash stored; noindex. E2E round-trip covered. |
| Satellite hotspots | verified | Server-proxied NASA FIRMS (4-day window), flare-zone + persistence masks, edge-cached 10 min, fail-soft. |
| Fire-risk layer | verified | Bundled 0.826-AUC Kabylie grid, default OFF, honest "model estimate" copy. |
| Fire weather + air quality | verified | Open-Meteo on fire/hotspot/risk panels, fail-soft. |
| Web Push fire alerts | verified (delivery not device-tested) | Subscribe card on `/fire`, wilaya-scoped fan-out on fire insert, stale endpoints pruned. |
| PWA | verified | Manifest, tiny service worker (no page caching), install banner (Chromium native + iOS instructions). |
| Auth (`/auth`) | verified | Email/password sign-in/up; neutral error copy (no enumeration). Password reset and social login do not exist. |
| Volunteer application (`/volunteer`) | verified | Account-first flow, admin pipeline (new → contacted → onboarded), one-click onboard. |
| User dashboard (`/activity`) | verified | My plantings/care/fires with statuses; empty states. E2E-covered. |
| Moderation (`/moderate`) | verified | Wilaya-scoped by RLS: pending queue (keyboard-first: arrows/j-k pick, A approve, R reject, never while typing; age urgency chips; no queue-depth pressure), fire triage (resolve/false alarm/reopen + admin delete), rejected queue (re-approve; photo stays deleted). Contact reveal on demand. E2E-covered (admin.spec). |
| Admin (`/admin`) | verified | Overview stats, Users & roles (list, role changes, wilaya assignment, create account, sign-out, delete), Volunteers, Feedback, Announcements (trilingual marquee with color/speed). E2E-covered (admin.spec). |
| Filming privacy mode | verified | Staff screens mask PII by default; top-level Show/Hide toggle. |
| Announcements banner | verified | Admin-controlled, several live at once, trilingual, color/speed controlled. |
| AI-training consent banner | verified | First-visit consent (accept/decline persisted), privacy-page section. |
| Legal pages | verified | `/about`, `/privacy` (Law 18-07 + AI training), `/terms`. |
| Feedback dialog | verified | Bug/idea/other + message + honeypot, UA snapshot for bug reports. |
| SOS panel | verified | Protection Civile 14/1021, Police 17, Gendarmerie 1055, SAMU 16. |
| Offline tolerance | built, not verified | `submitResilient` retries on reconnect. |
| IP-geo pre-fill | verified | Vercel headers pre-select wilaya/center the picker; suggestion only, never stored. |

## Canopy design system (2026-09-12, branch `feat/canopy-redesign`)

The full platform redesign shipped as Sprints 0–6 (13+ commits): Canopy
tokens (light default / night-soil dark), Sora + DM Sans with Arabic Noto
faces, 4/8/16/24 radius scale, motion tokens, staff sidebar (280px → 78px
rail, sliding indicator), Canopy chips/buttons/forms/tables, PhotoThumb
fallbacks, skeleton loaders, Reveal entrances, global focus ring, RTL-mirrored
patterns. Zero logic or schema changes; full E2E + unit suites green.
Doc: `DESIGN.md`; SSOT: `design-system/canopy.html`; plan + sprint record:
`archive/` (REDESIGN_CANOPY_PLAN.md). **Merge awaits owner approval.**

## Not built (deliberate)

- Email/SMS alerting (Web Push replaced the old design), password reset UI,
  social login, search, per-wilaya pages, public user profiles, sharing
  cards, photo CDN, map-data server endpoint (designed, built when row
  counts demand it).
