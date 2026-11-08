# Handoff: Fire AI prediction work (Green DZ)

Status as of 2026-11-08. Owner: Sifeddine Mebarki (Meykiio). Repo:
`Meykiio/dz-green`, working tree branch `main`, clean. Live app:
https://green-dz.vercel.app

Read this file first if you are a new agent picking up the fire AI work.
It records what was extracted, what was modeled, what is already in the
app, what is only data on disk, and what is still missing. Nothing here
is a plan for the future: the app state is verified, the folder state is
verified, the model history is what the repo recorded.

## 1. TL;DR

**Read section 13 first (2026-11-08): the national model now feeds the app.**
Then 12 and 11 for how we got there.

**Older note:** sections 12 then 11 (2026-11-08). Section 12: the model was
rebuilt as a reproducible pipeline in `ml/fire-risk/` (model kabylie-v8),
after finding that a third of the v7 "fire" labels were one industrial
heat source. Section 11: the v7 re-test that led there. Sections 1 to 10
describe the old v7 state and are kept as history.

- A fire-risk model exists and is documented as **v7 champion, AUC 0.826,
  validated against the unseen summer 2026**. It is real but it is a
  **climatological estimate for typical summer conditions, not a live
  forecast and not ground-verified**.
- It is **already integrated in the app** (Phase A), but only as a
  **bundled static grid**: 3,882 points at 1 km over Béjaïa + Jijel,
  `src/data/risk-grid.ts`. There is no server route and no refresh job.
- The data extraction artifacts (Earth Engine exports, v3fix to v7) live
  **outside the repo** in the two folders listed in section 3.
- Not built: live scoring/forecast pipeline, coastal/national grid,
  burn-damage layer, planting-suitability layer, tree-health layer.
- The training scripts/notebooks are **not** in these folders or the repo.
  The changelog names a `fire_prediction_project` workspace that is not
  present locally. Ask the owner where it is before claiming anything is
  reproducible.

## 2. Current status table

| Item | Status | Where |
|---|---|---|
| Risk model (v7, AUC 0.826) | Trained and validated, documented | Repo docs + data folders |
| Risk grid in app | Live, Phase A, default OFF | `src/data/risk-grid.ts`, `src/components/map/risk-layer.ts` |
| Live scoring / daily refresh | Not built | Would need EE export + scoring job + route |
| Coastal / national expansion | Not built (roadmap next-up) | Needs new EE export + scoring |
| Burn-damage layer (Phase B) | Data now exists, layer not built | `Data/algeria_burn_severity_2026.csv` |
| Planting suitability (Phase C) | Not built, no export yet | Needs soil+climate+terrain+land-cover export |
| Tree health (Phase D) | Not built | Needs MODIS NDVI weekly job |
| Community confirmations (Phase E) | Live, migration applied 2026-09-13 | `fire_confirmations`, `FireConfirmations.tsx` |
| AI-training consent (Phase F) | Live | `ai-consent.ts`, `ConsentBanner.tsx` |

The 2026-09-05 plan (`docs/PLAN_FIRE_AI_FEATURES.md`) was removed from the
working tree in commit `4415ee8`. Recover it with:

```
git show 3e4a113:docs/PLAN_FIRE_AI_FEATURES.md
```

## 3. Data folders (verified: files, row counts, columns)

### A. `C:\Users\DELL\Desktop\Sifeddine\new-folder-2026-09-04`

| File | Rows | What it is |
|---|---|---|
| `bejaia_jijel_fire_daily_v3fix_2016_2026.csv` | 3,884 | Earliest Kabylie (Béjaïa + Jijel) daily set. 13 cols: label, year, date, temp_max_7d, dryair_max_7d, wind_max_7d, soil_mean_7d, precip_7d, precip_30d, NDVI, elevation, slope, landcover. |
| `kabylie_grid_climo_2027.csv` | 1 | Broken/sample export (has `label` + `count`). Do not use. |
| `kabylie_grid_climo_2027_v2.csv` | 3,882 | Unlabeled scoring grid for future climatology. Same features as v5/v4 minus label, plus `constant`. |
| `v4_master_7wilayas_2016_2026.csv` | 5,630 | Seven-wilaya master. 21 cols. Label balance: 2,322 positive / 3,308 negative. |
| `v5_kabylie_dense_final_2016_2026.csv` | 3,884 | Kabylie dense final. 21 cols, same features as v4. Balance: 1,676 positive / 2,208 random negative. |

### B. `C:\Users\DELL\Desktop\Sifeddine\Data`

| File | Rows | What it is |
|---|---|---|
| `v6_final_everything_2016_2026.csv` | 5,466 | Adds hard negatives (`neg_type`) and `rain_prev_winter1/2` to v5. |
| `v7_master_everything_2016_2026.csv` | 5,475 | **Champion dataset.** 37 cols, 2016 to 2026. Balance: 1,676 positive, 2,208 random negative, 1,591 near negative. |
| `algeria_burn_severity_2026.csv` | 681 | **Phase B input.** dNBR point sample: `dnbr`, `severity` 1 to 4, `.geo`. Severity counts 1: 569, 2: 53, 3: 29, 4: 30. dNBR range 0.100 to 1.069. |
| `kabylie_grid_climo_2027_v2.csv` | 3,882 | Duplicate of the new-folder v2 scoring grid. |
| `kabylie_grid_climo_fixed_v3.csv` | 3,882 | Fixed version of the scoring grid (no label column). |
| `environment_dza.csv` | 5,181 | World Bank environment indicators. Context only, **not** model features and not a suitability export. |
| `azm-products.csv` | 36 | Unrelated Shopify product export from another project. Ignore. |

### v7 feature list (exact, from the header)

`EVI, NDVI, aspect, burned, burned_2y_ago, burned_3y_ago,
burned_last_year, cems_drought_code, cems_ffmc, cems_fwi, cems_ignition,
cems_isi, date, dist_to_builtup, dist_to_cropland, dryair_max_7d,
elevation, hot_days_7d, label, landcover, neg_type, precip_30d, precip_7d,
precip_90d, rain_spring_cur, rain_spring_prev, rand, rh_min_7d, slope,
soil_mean_7d, temp_max_7d, vpd_max_7d, wind_dir_7d, wind_max_7d, year`

Notes: label 1 means burned. `neg_type` is `fire`, `near`, or `random`.
`near` negatives were added to teach the model what almost burned. Units
are raw (temp in Kelvin, precip in meters, NDVI scaled by 10,000), not
normalized.

## 4. The model story (what the repo recorded, nothing more)

- Iterations: v3fix (Béjaïa + Jijel daily, 13 features), v4 (seven
  wilayas, 21 features), v5 (Kabylie dense, same features, cleaner
  balance), v6 (hard negatives + winter rain), v7 (CEMS FWI family,
  burned history 1 to 3 years, EVI, VPD, aspect, spring rain, hot days).
  This version progression is inferred from the CSV headers, which are
  verified.
- Champion: **v7, AUC 0.826**, validated against the **unseen summer 2026**.
  The algorithm itself is not recorded in the repo. Do not claim random
  forest, XGBoost, or anything else without asking the owner.
- Output: a 1 km grid over Béjaïa + Jijel, **3,882 scored points**, stored
  in the app as `src/data/risk-grid.ts` tuples `[lng, lat, risk 0-1]`.
  File is 88 KB.
- Repo evidence: `docs/CHANGELOG.md` line 160, `docs/FEATURES.md` line 19,
  header comment in `src/data/risk-grid.ts`, commits `69a25ac` (Phase A)
  and `3e4a113` (plan).

### Honest caveats to preserve

- The score is a typical-summer climatology, not a forecast for a given
  day, and it is not ground-verified.
- Positives come from burned-area labels. The dataset is roughly 30%
  positive in v7, which is a modeling balance, not real-world prevalence.
- AUC is the only metric recorded. No calibration, Brier score, or
  reliability curve is documented.
- The graph exists but the training code does not, locally. Any retrain
  or live scoring starts by recovering the original workspace.

## 5. What is integrated in the app today (Phase A, live)

- `src/data/risk-grid.ts`: generated asset, 3,882 tuples, header says
  "Generated from the Kabylie fire-risk model (v7 champion, AUC 0.826)".
- `src/lib/risk.ts`: `RiskPoint`, `RISK_POINTS`, `riskGeoJSON()`.
- `src/components/map/risk-layer.ts`: MapLibre circle layer, opacity 0.55,
  interpolated ramp green `#1a9850` to yellow `#fee08b` to orange
  `#f46d43` to dark red `#a50026`. No pulse, on purpose: the pulsing
  stays the community-fire signature.
- `src/components/map/useHeroMapMount.ts` and `map-layers.ts`: the layer
  is wired as the fifth layer (`"risk"`).
- Action card: fifth chip (TrendingUp icon, terracotta tone), **default
  OFF** because fires are the default view.
- Detail panel: clicking a risk dot opens `RiskBody` with the score,
  band, current fire weather (Open-Meteo, fail-soft), the honest
  disclaimer, and a directions link.
- i18n: full AR/EN/FR (`home.layers.risk`, `tooltip.layers.risk`,
  `detail.eyebrow.risk`, `detail.risk`).
- Verified at build time: tsc clean, 209/209 tests (8 in `risk.test.ts`),
  build green, live browser probe showed the correct gradient over the
  Kabylie fire belt and the chip toggling in Arabic.

Refresh model: static asset. Updating the published risk means replacing
the asset and redeploying. There is no server route and no cron.

## 6. What is not built, and what each needs

1. **Live scoring / forecast**: export current weather features from
   Earth Engine, score with the v7 model, serve as GeoJSON through a
   route following the hotspots pattern, cache and refresh daily. In the
   roadmap as "live forecast instead of climatological estimate".
2. **Coastal/national expansion**: new EE export across all coastal
   wilayas, score, swap the bundled asset. In the roadmap as the
   "coastal/national risk-grid expansion". The plan estimated a 4 to 6
   hour export for the coastal master.
3. **Burn-damage layer (Phase B)**: the CSV now exists (681 point
   samples, severity 1 to 4). Still missing: a decision on points versus
   the original raster, the severity-class styling (dark scars, not the
   risk ramp), a serving route, and the plant-form nudge ("this wilaya
   has burn damage, plant here first").
4. **Planting suitability (Phase C)**: no export exists. Needs an Earth
   Engine export of soil, climate, terrain, and land cover, then scoring
   and a "planting guide" layer that reuses the existing wilaya species
   matrix. `environment_dza.csv` is not this data.
5. **Tree health (Phase D)**: MODIS NDVI per planted site, weekly. The
   app has the "needs water" flag but no scheduled job infrastructure.
6. **Known follow-ups from the roadmap**: self-vote prevention on fire
   confirmations (submitter is currently only deduped by device hash),
   reputation weighting via `voter_trust`, and a `verified_labels` export
   for retraining the model on community-confirmed fires.

## 7. Rules that apply to any continuation

- **Owner approval before schema changes, deploys, or new dependencies.**
  The repo already broke this rule once in spirit; do not repeat it.
- Migrations are migration files, applied with explicit approval, then
  reflected in `docs/DATABASE.md`.
- Keep `docs` current in the same change: `CHANGELOG.md` (dated pass
  entries), `FEATURES.md`, `DATABASE.md`, `PROJECT_STRUCTURE.md`,
  `SYSTEM_INSTRUCTIONS.md`, `ROADMAP.md`.
- Max 250 lines per hand-written file. Commit after every phase, never
  end with uncommitted work.
- Product copy: AR/EN/FR with RTL, no hardcoded text, honest labels
  ("model estimate, not a live forecast, not ground-verified"), the
  Protection Civile disclaimer stays on every fire surface, risk layers
  default OFF, color-blind-safe ramps, legend visible when on.
- Verification standard: tsc, unit tests, build, and for UI a real browser
  probe. "Done" means executed and committed. Say "not verified" when
  you did not verify.
- Owner preferences: English only in prompts and reports, no em-dash
  character, verdict first, one concrete next step.

## 8. Open questions for the owner (answer before building)

1. Where is the `fire_prediction_project` training workspace? It is not
   in the repo or in either data folder.
2. Which scoring file produced the bundled grid: `kabylie_grid_climo_2027_v2.csv`,
   `kabylie_grid_climo_fixed_v3.csv`, or another export?
3. Is `algeria_burn_severity_2026.csv` a complete season sample or a
   subset? Where is the source raster?
4. For the next step, does the owner want the coastal/national risk
   expansion first, the burn-damage layer first, or the live forecast
   first?
5. Do we want calibration (Brier, reliability) before presenting scores
   as probabilities?

## 9. Commands

```
bun install
bun run dev          # http://localhost:5173
bun run test
bunx tsc --noEmit
bun run build
```

## 10. Evidence trail

- `3e4a113` docs: fire AI features plan + community confirmations spec.
- `69a25ac` feat: fire-risk model layer (Phase A), 18 files.
- `4e8379a` feat: community fire confirmations (Phase E), 12 files.
- `abb7b2c` chore(db): apply `fire_confirmations` migration live, fold
  into master schema (DATABASE.md records applied 2026-09-13).
- `d052e3f` current `main` head at the time of writing, tree clean.

## 11. Re-test of the saved v7 model (2026-11-08)

Workspace found: `C:\Users\DELL\Projects\fire_prediction_project` (not a
git repo). It holds the saved models (`fire_model_v3_final.joblib`,
`fire_model_v7_champion.joblib`), datasets v1 to v4, one early backtest,
and `risk_map_2027_all_spots.csv` + PNG. **No training or scoring code**:
it was lost with the OpenCode session. Re-test scripts now live in its
`scripts/` folder (`retest_v7.py`, `holdout_v7.py`; need xgboost,
scikit-learn, pandas, joblib).

**The saved v7 model:** XGBClassifier, 400 trees, depth 4, learning rate
0.05, 19 inputs: EVI, NDVI, aspect, dist_to_builtup, dist_to_cropland,
dryair_max_7d, elevation, hot_days_7d, landcover, precip_7d/30d/90d,
rh_min_7d, slope, soil_mean_7d, temp_max_7d, vpd_max_7d, wind_dir_7d,
wind_max_7d. No leaking columns (`neg_type`, `burned`, `rand`, `year`
are not inputs). The CEMS fire-weather and burn-history columns in the v7
CSV are not used.

**2026 was in its training data.** The saved model scores AUC 0.88 to 0.99
on every year including 2026 (0.932), so its own scores are not a test.

**Honest scores** (same settings retrained on all earlier years, tested on
the next year, `holdout_v7.py`):

| Test year | AUC | Fires vs near-misses | Top 20% of points holds |
|---|---|---|---|
| 2022 | 0.588 | 0.546 | 28% of fires |
| 2023 | 0.702 | 0.665 | 41% |
| 2024 | 0.828 | 0.809 | 59% |
| 2025 | 0.874 | 0.867 | 59% |
| 2026 | 0.742 | 0.725 | 37% |

Read: useful (2026 top 20% catches about 1.9x its share) but unstable year
to year. 0.826 matches the 2024 row; it is not the 2026 result.

**Calibration (saved model, in-sample 2026):** scores overstate risk in
the middle (0.4 to 0.6 predicted, 0.13 actual). Do not present scores as
probabilities.

**Strongest inputs (2016-2025 model):** elevation, dist_to_cropland,
landcover, EVI, aspect, slope. The model mostly learned *where* fires
happen, not *when*, which suits a yearly prevention map.

**The live map is not v7 output.** `src/data/risk-grid.ts` equals
`risk_map_2027_all_spots.csv` (3,882 points). That grid lacks 4 of v7's 19
inputs (EVI, aspect, hot_days_7d, vpd_max_7d), and scoring it with v7
(missing = empty) differs from the published values by up to 0.64
(correlation 0.89). It came from another, unsaved model. The map also
gives risk to water (58 points, up to 0.62) and built-up land (108 points,
up to 0.96).

**Answers to section 8:** Q1 found (above). Q2: the bundled grid is
`risk_map_2027_all_spots.csv`, origin model unknown. Q5: yes, calibration
is needed before any probability wording.

## 12. Rebuild: model kabylie-v8 (2026-11-08, branch `feat/fire-risk-pipeline`)

Owner delegated all modeling decisions. Everything is in `ml/fire-risk/`
(README explains each decision; `results/report.md` has the numbers).

- **Label contamination found:** 32% of v7's fire points lie within 3 km
  of one spot near El Milia (Jijel), detected on 100+ separate days over 7
  years, much of it on built-up land: a permanent industrial heat source.
  Every earlier model partly learned to find it. Cleaning drops cells seen
  on 8+ days or in 4+ years (633 detections, 33 cells) plus built-up points.
- **Design:** one event per 1 km cell per year; inputs knowable before
  summer only (fire history from earlier years, land cover, distance to
  cropland, elevation); trained against random land; depth-2 XGBoost.
- **Honest result** (each year 2020-2026 predicted from earlier years
  only): AUC 0.70 mean (0.57 worst, 0.83 in 2026); riskiest 20% of land
  held 50% of next-year fires (35% worst, 67% in 2026). v7's inputs on
  the same cleaned labels: AUC 0.62, worst year 4%.
- **App:** `src/data/risk-grid.ts` regenerated (3,716 cells, water and
  built-up removed), values are a relative rank. The detail panel shows
  "Top N% of mapped land"; bands High = top 10%, Medium = next 20%; copy
  updated in AR/EN/FR (AR/FR wording is machine-quality, worth a native
  read).
- **Not done:** coastal/national (needs a new Earth Engine export; the
  original script is lost), burned-area labels, device test of the layer.

## 13. National model national-v1 (2026-11-08, merged to local main)

Owner direction: the Bejaia/Jijel work was a test; the goal is next-year
fire prediction across far more wilayas. Built in `ml/fire-risk/`
(`run_national.py`, README has every decision).

- **Data:** NASA FIRMS MODIS yearly country files, 2001-2025, public, no key
  (`fetch_firms.py`). MODIS's own `type` field separates vegetation fires
  from static industrial sources, which fixes the El Milia problem at the
  source; persistent squares (8+ days in one season) are excluded too.
- **Grid:** 63,460 squares of 2 x 2 km over the 49 wilayas north of 34.5 N,
  from the app's own 69 wilaya polygons (`scripts/export-wilayas.ts`).
- **Design:** every square every year (no sampling); inputs are fire
  history (own square and Gaussian neighbourhoods at 2/6/16 km, recency
  decay 0.85) plus latitude/longitude; a two-year gap in every test because
  the 2026 file is not published yet.
- **Honest result (2014-2025):** AUC 0.886 (worst 0.831); the riskiest 10%
  of northern land held 63% of the next season's burned squares (worst
  44%), the riskiest 20% held 80%. A no-model rule ("recent fires nearby")
  scores almost the same AUC; the model is kept for its small edge at the
  very top. Both are reported side by side in `results/national/report.md`.
- **App:** `public/data/fire-risk-2027.json` (top 30% of land, 19,040
  squares, 32 KB gzipped, loaded only when the risk layer is turned on) and
  `public/data/fire-risk-wilayas-2027.json` (per-wilaya figures feeding the
  `/restore` page). The bundled Kabylie grid is gone.
- **Not done:** terrain (elevation APIs rate-limited or unreachable; the
  switch is `USE_TERRAIN`), land cover, burned-area labels, south of 34.5 N.
- **Yearly:** rerun after NASA publishes the previous year (ROADMAP,
  "Every January").
