# ROADMAP

Status: 2026-09-12. Live at green-dz.vercel.app. Ordered by what matters.
Nothing is scheduled — the owner calls the sequence, and **no fix starts
without owner approval**. Completed work lives in `CHANGELOG.md`.

## Before anything else (owner actions, not code)

1. **Merge decision on `feat/canopy-redesign`** — the Canopy redesign is
   code-complete: Sprints 0–6, E2E 16/16, unit 219/219, build green, docs
   current. The owner should do a hands-on pass (both themes, Arabic RTL,
   phone width, keyboard queue flow) and then explicitly approve the merge.
2. **Database owner actions** (`docs/DATABASE.md` §Owner dashboard actions):
   the `spatial_ref_sys` + PostGIS views read-only fix (the 2026-08-30
   revoke did not stick — verified live 2026-09-12).
3. **Pending schema:** apply `fire_confirmations` (community vote trust
   layer; code committed, failing soft until then) — owner approval gates
   it. SQL: `docs/pending-migrations/`.
4. **Supabase Pro + Vercel Pro + firewall rules** on public POST endpoints,
   leaked-password protection toggle, load test (1k concurrent home loads,
   p95 < 2s) + spam-flood rerun at scale. Per the scale posture.
5. **Real-device testing:** mid-range Android + slow connection; realtime
   push check on an open map session.

## Open decisions (owner call)

- **Vendored UI prune:** `src/components/ui/chart.tsx` + `sidebar.tsx`
  (~1000 lines, zero consumers) — delete or keep vendored.
- **Moderator recruiting:** promotion is admin-driven; recruiting 69 wilaya
  moderators is a people plan, not code.
- **Theme default:** Canopy is light-default on the branch (owner D1); the
  dark token set is canonical in the SSOT — flipping the default later is a
  one-line change if the owner prefers dark-first.

## Next-up candidates (in rough impact order, all need owner approval)

1. **Canopy follow-ups found during device pass** (whatever the owner's
   device pass surfaces).
2. **Client-side scale wall (the launch wall):** the home map loads ALL
   approved rows client-side (bounded 2000/3000/1000). At ~10k rows the
   GeoJSON rebuild + realtime invalidation spikes; the designed fix is the
   `/api/map-data` bounds endpoint (audit Phase B+, designed now, build
   when needed) — do not pre-build.
3. **Fire-confirmations follow-ups** once the migration lands: self-vote
   prevention (submitter excluded — currently only device-hash dedup),
   reputation weighting (voter_trust), verified_labels export for model
   retraining.
4. **Fire-AI plan leftovers** (from the 2026-09-05 plan, archived):
   coastal/national risk-grid expansion (swap the bundled asset), live
   forecast instead of climatological estimate.
5. **submission_meta retention** (opportunistic cleanup in the gate or a
   cron, keep ~45 days).
6. **Payload reduction:** first load is tile-heavy (~700-900KB gz);
   evaluate a lighter basemap style after launch numbers exist.
7. **Moderator onboarding at scale:** in-app mod guide + training content
   (people problem, plan separately).

## Parked (would be real scope; revisit when relevant)

- Photo CDN beyond Supabase storage + proxy + cache headers.
- Realtime design check at 500 connections (Pro ceiling); hide ticker
  behind a client feature flag if limits near.
- Field performance data (PageSpeed/RUM on the deployed URL post-launch).
- Search, per-wilaya pages, user profiles, sharing cards (ideas, not plans).

## Mobile app

The companion Expo app exists: `laidanimounir/dz-green-mobile` (Expo SDK 57,
Expo Router, MapLibre native, sqlite offline outbox, same Supabase). The
submissions contract shipped (`POST /api/mobile/submissions`, Bearer-authed,
same gate) and deep-link auth is registered. The one blocker is running a
development build (Android emulator on Windows is the free path; iOS needs
Apple Developer signing). Details: `docs/MOBILE.md`.

## Done recently (pointers)

- Canopy redesign Sprints 0–6 + E2E gate repair → `CHANGELOG.md` passes
  93–102.
- 69-wilaya division, announcement banner, Web Push, PWA, fire-AI layer
  phases → `CHANGELOG.md` earlier passes.
