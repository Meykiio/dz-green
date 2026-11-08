# ROADMAP

Status: 2026-11-08. Live at green-dz.vercel.app (production still runs the
2026-09-28 build until the owner deploys the November work; see "Deploy the
November release" below). Ordered by what matters. Completed work lives in
`CHANGELOG.md`.

## Deploy the November release (owner, about 15 minutes)

Everything below is committed on local `main`, tested, and NOT pushed.

1. Review: `git log origin/main..main --oneline` (the sprint merges are the
   chapters: fire-risk pipeline, security, bug fixes, national model,
   Where to plant, docs).
2. Push `main` to GitHub. Vercel deploys production from it automatically.
3. Apply the one pending migration (safe, relaxes a CHECK, touches no rows):
   `docs/pending-migrations/2026-11-08_throttle_kinds.sql`, in Supabase
   Dashboard > SQL Editor. The app works without it (in-memory limits apply).
4. Check on a phone: the map in Arabic (place names joined correctly), the
   risk layer toggle and its legend, `/restore`, one test planting.
5. If any E2E fixture accounts still exist in the live project, delete them;
   their passwords were public in the repo until 2026-11-08 (now env vars).

## Owner actions (not code)

- **Supabase account access for agents:** the live project
  (`jnunqilxiajinylgehuh`) is not in the Supabase account connected to the
  coding tools, so live-schema checks are impossible from a session. Connect
  the owning account, or keep running SQL by hand.
- **Supabase support ticket** for the PostGIS-owned `spatial_ref_sys`
  (still client-writable; `docs/SECURITY.md` #1). Keep it alive.
- **Pro plans + firewall rules** on public POST endpoints, leaked-password
  protection, a load test (1k concurrent home loads, p95 < 2 s).
- **Real-device pass:** mid-range Android on 4G, both themes, Arabic.
- **Native-speaker read** of the new Arabic and French copy (risk layer,
  Where to plant, GPS and receipt messages).
- **Show the 2027 priority map to one forest office** (Conservation des
  forêts, Bejaia or Tizi Ouzou) and ask whether they would plan clearing
  with it. Their answer decides the next model investment more than any
  metric.

## Every January (owner or agent, 30 minutes)

NASA publishes the previous year's fire file. In `ml/fire-risk/`: run
`fetch_firms.py` and `run_national.py`, bump `TARGET_YEAR` (pipeline config)
and `RISK_TARGET_YEAR` (`src/lib/risk.ts`), commit the regenerated
`public/data/*.json` and `results/national/`. Publish the new map before
spring, then grade last year's map against what burned (that is the
credibility story).

## Next-up candidates (impact order, need owner approval)

1. **Model inputs:** land cover and terrain for the national model (the
   free elevation APIs were rate-limited or unreachable on 2026-11-08), and
   a burned-area label source (MODIS MCD64A1 or EFFIS) instead of hotspot
   squares. Keep each only if the honest test improves.
2. **Campaign support (needs schema):** organisations and campaigns
   (a school, an association, a wilaya forest office) that group plantings,
   with a goal and survival follow-up. Design first; owner approval for the
   migration.
3. **Atomic rate limiting:** the gate's check-then-insert lets a fast burst
   exceed the hourly limit. Fix with a Postgres function doing count+insert
   in one statement (schema change).
4. **Client-side scale wall:** the home map loads all approved rows
   (bounded 2000/3000/1000). At ~10k rows build the `/api/map-data` bounds
   endpoint (designed, do not pre-build).
5. **Fire-confirmations follow-ups:** submitter self-vote prevention,
   reputation weighting, `verified_labels` export for model retraining.
6. **submission_meta retention** (~45 days).
7. **Vendored UI prune:** 40 of 46 `src/components/ui/*` files have no
   consumer.
8. **Moderator recruiting for 69 wilayas** (people plan, not code).

## Explicitly deferred (from the fire-AI plan)

- Fire spread prediction: a separate project, after the layers prove useful.
- Live daily forecasts (WeatherNext or similar): the yearly priority map is
  v1; a forecast is v2 and needs a provider.
- Burn-severity layer and NDVI tree-health job (Phases B and D): data and
  plan in `docs/HANDOFF_FIRE_AI_CONTEXT.md`.

## Parked

- Photo CDN beyond Supabase storage + proxy + cache headers.
- Realtime at 500 connections (Pro ceiling).
- Field performance data (RUM on the deployed URL).
- Search, per-wilaya pages, public profiles, sharing cards.

## Mobile app

The companion Expo app: `laidanimounir/dz-green-mobile` (Expo SDK 57,
MapLibre native, sqlite outbox, same Supabase). It submits through
`POST /api/mobile/submissions` (Bearer-authed, same gate). Blocker: running
a development build (`docs/MOBILE.md`).
