# ROADMAP

Status: 2026-11-08. Live at green-dz.vercel.app; production runs the
November release (deployed 2026-11-08, commit `829e399` + follow-ups).
Ordered by what matters. Completed work lives in `CHANGELOG.md`. The
evidence behind every item below is in
`docs/archive/RESEARCH_2026-11_NEXT_LEVEL.md` (six research tracks, sourced).

## The strategy in one paragraph

Become the one public place in Algeria that shows **which planted trees are
still alive**, checked by someone other than the planter, with the method
next to every number. Official survival claims run 80-98% while independent
checks find 15-40%, and nobody publishes method-backed survival data. The
state already has a reforestation-tracking platform (UNDP + DGF "Tashdjir"),
and the World Bank is designing a national fire early-warning system, so
Green Algeria is pitched as the **citizen and survival layer that feeds
them**, not a replacement. First customer is likely the association
"Algérie Verte" or a donor project, not a ministry directly.

## Finish the November release (owner)

1. Authenticate the Supabase MCP once (terminal: `claude`, then `/mcp`,
   supabase, Authenticate, account notsifeddine@gmail.com). It is
   configured read-only on purpose (production).
2. Apply `docs/pending-migrations/2026-11-08_throttle_kinds.sql` in the
   Supabase SQL editor (safe, relaxes a CHECK). The app works without it.
3. Delete any E2E fixture accounts still in the live project (their
   passwords were public until 2026-11-08).
4. Phone pass in Arabic: map labels, risk layer + legend, `/restore`, one
   test planting.

## Phase 0: decisions before more features (owner, weeks)

- [ ] **Name.** The ministry co-runs national planting days with the
  association "Algérie Verte", and a corporate consortium runs a Sahara
  project called "Green Algeria". Either partner openly with Algérie Verte
  (offer to be the counting and survival tool for its next campaign) or
  rename before any pitch. Do not drift in between.
- [ ] **Tashdjir.** Email UNDP Algeria: is it live, does it accept citizen
  input, what format does it import?
- [ ] **Data protection (Law 18-07 as amended by Law 25-11, July 2025):**
  collect less (reporter phone optional or dropped), publish a privacy
  notice, file the ANPDP declaration, name a DPO, short check with an
  Algerian lawyer. Current hosting abroad is a gap today.
- [ ] **Legal entity:** register a company and apply for the Startup label
  (required for any public contract, including the Art. 41 direct route).

## Phase 1: quick wins (code, no schema, weeks)

- [x] **Never-name-suspects rule** for fire reports, written into the
  moderation guide and the fire form copy (2021 lynching; Oct 2026
  death-penalty bill for arson).
- [x] **MapLibre upgrade to 6.9+ (6.16):** Arabic renders natively, so drop the
  self-hosted RTL plugin and the `'wasm-unsafe-eval'` CSP exception.
- [x] **Low-bandwidth mode:** Realtime closes on hidden tabs (catch-up on
  return); Data Saver / 2G pauses live updates and the hotspot refresh,
  with a note. Still open: deferring the map until after first paint,
  thumbnails in data-saver mode, `updateData` for inserts.
- [x] **Time, age and source** on fire items (layers already carry
  their source in the legend and detail panels).
- [x] **Planting-season status** (now / prepare / too dry) on Where to
  plant and the planting form.

## Phase 2: survival layer (3 months; items marked schema need owner approval)

- [~] **Survival check-ins (2a): code deployed, migration waiting for the
  owner to run it (`docs/pending-migrations/README.md`).** At 3, 12 and 36 months: status (alive,
  stressed, dead, burned, grazed), repeat photo, reminders, overdue sites
  highlighted on the map; public survival rate per wilaya with sample size
  and method. (schema)
- [ ] **Campaign / site entity** owned by a group (school, association,
  company, wilaya conservation) with a portfolio view. (schema)
- [ ] **Quality grades** on every record (unverified, community-confirmed,
  moderator-verified) with a downgrade path; server-picked random audit
  samples for big campaigns. (schema)
- [ ] **Open exports** (CSV, GeoJSON, KML) of verified records, in formats
  FAO Open Foris tools and QGIS load.
- [ ] **Fire model v2:** burned-area labels (NEALGEBA 30 m for the north-east,
  MODIS MCD64A1 nationally), fire-weather climatology (CEMS FWI via EWDS),
  ESA WorldCover fuel fraction, Copernicus DEM, road distance; spatially
  blocked test against the 0.886 AUC baseline. No Google Earth Engine in
  production (its 2026 terms forbid paid or recurring government use).
- [ ] **Planting suitability v2:** SoilGrids, CHIRPS3 rainfall, slope.
- [ ] **Realtime via Broadcast from a trigger** (scales past the 200/500
  connection cap, and keeps PII out of payloads). (schema)

## Phase 3: government-ready (12 months)

- [ ] Arabic-first admin and moderation (Law 91-05), immutable audit log,
  documented backup/restore.
- [ ] **Sovereign deployment kit:** the same codebase on self-hosted
  Supabase inside Algeria (no hyperscaler region exists there; in-country
  hosting is the default for state systems since the 2026 data-centre
  order). Remove Vercel-only dependencies.
- [ ] Area-of-interest alerts and a "confirm this hotspot" loop.
- [ ] Offline wilaya map download, outbox with idempotency keys (schema),
  Play Store app as a Trusted Web Activity (keep Expo only if field tests
  demand it).
- [ ] Site greening trend from Sentinel-2 (Copernicus Data Space free
  credits), labelled as a trend, not survival.
- [ ] **First paid pilot:** a subcontract inside a donor project (UNDP,
  World Bank PROGREEN, FAO/GCF FP310) or one wilaya conservation under the
  procurement threshold. Revenue is deployment, Arabic admin, integration,
  training and support (AGPL means no licence sales).

## Every January (owner or agent, 30 minutes)

NASA publishes the previous year's fire file. In `ml/fire-risk/`: run
`fetch_firms.py` and `run_national.py`, bump `TARGET_YEAR` (pipeline config)
and `RISK_TARGET_YEAR` (`src/lib/risk.ts`), commit the regenerated
`public/data/*.json` and `results/national/`. Publish before spring, then
grade last year's map against what burned.

## Standing owner actions

- Supabase support ticket for the PostGIS-owned `spatial_ref_sys`
  (`docs/SECURITY.md` #1).
- Pro plans + firewall rules on public POST endpoints, leaked-password
  protection, a load test before any national planting day (Realtime
  connection cap is what breaks first).
- Native-speaker read of the Arabic and French copy.
- Show the 2027 priority map to one forest office and ask if they would
  plan clearing with it.

## Not doing (with reasons in the research)

Blockchain verification (a Postgres append-only log gives the same proof),
global individual leaderboards (evidence says they demotivate; if any,
reward survival and care, compare like with like), our own species
identifier (link Pl@ntNet), anything depending on Earth Engine once money
is involved, publishing our own national "hectares burned" headline
(official figures are disputed; show satellite data per fire with source
and method).

## Explicitly deferred

- Fire spread prediction; live daily forecasts (a yearly priority map is
  v1); burn-severity layer and NDVI tree-health job beyond Phase 3.
- Atomic rate limiting (Postgres function, schema), submission_meta
  retention, vendored UI prune (40 of 46 unused), client-side scale wall
  (`/api/map-data` at ~10k rows).

## Mobile app

The companion Expo app: `laidanimounir/dz-green-mobile` (Expo SDK 57,
MapLibre native, sqlite outbox, same Supabase), submitting through
`POST /api/mobile/submissions`. Research recommendation: a Trusted Web
Activity of the PWA reaches the Play Store in about a day and keeps Chrome's
offline features; decide whether Expo is still needed after field tests.
