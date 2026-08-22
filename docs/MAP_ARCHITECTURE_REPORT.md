# Green DZ Map — Codebase Scan + Deep Research + Fix/Rebuild Report

Date: 2026-08-22. Method: live codebase scan, live DB/API checks, browser-based
measurements on the dev server and the local production build, and web checks
(Overpass, GADM, geoBoundaries, the candidate datasets) — all cited inline.

## 1. What changed since the last audit

- The boundary swap **already happened** (2026-08-22, PR #29): Natural Earth 10m
  (48 polygons) replaced by the 69-wilaya SVG dataset, converted and validated.
  The prior report's problem #1 is therefore **resolved**, not open.
- The global, non-viewport-filtered queries (`data.ts`: sites limit 2000,
  care_logs limit 3000, fire_reports limit 1000) are **still present, unchanged**.
- New since the snapshot: the map's dim mask + Algeria-only label filter run on
  the new 31.6k-point polygons, which caused the reported slowdown; a
  coarse-polygon fix is included in this pass.
- Measured baseline facts: production first-load app payload **685 KB** total
  (33 resources, js bundle 580 KB gz incl. MapLibre + the ~100 KB-gz boundary
  data). A single OpenFreeMap z4 vector tile measures **~892 KB**
  (`/planet/20260816_080001_pt/4/9/6.pbf`, HTTP 200, 0.67s).

## 2. The 69-wilaya verdict

**A real, complete 69-wilaya polygon dataset exists — two of them.**

| Source | Wilayas | Geometry | License | Verdict |
|---|---|---|---|---|
| chemsallioua/Algeria69WilayaMap | 69 | SVG polygons, all 69 | MIT | **Shipped** — simplest license, already converted + city-validated |
| OpenStreetMap (Overpass, live check 2026-08-22) | 69 relations DZ-01…DZ-69 | relation geometry available | ODbL | Valid alternative; heavier extraction + share-alike license |
| GADM 4.1 (downloaded + counted) | **48** | polygons | restrictive | Outdated |
| geoBoundaries gbOpen (API check) | **48** (year represented 2017) | polygons | ODbL | Outdated |
| Natural Earth 10m | **48** | polygons | public domain | Outdated (our old file) |

Legal note: the 69-wilaya state took effect via **Law No. 26-06 of April 4,
2026, published in Official Journal No. 25 on April 5, 2026** (corrected
citation — an earlier draft of this report repeated issue #6's November 2025
date, which was wrong). Our reply on issue #6 promised the update; it is now
delivered.

Decision: **stay with the MIT SVG** (already shipped). One line why: same
wilaya count as OSM but a one-file MIT download vs an ODbL relation-assembly
pipeline.

## 3. Problems found, ranked

- **CRITICAL — first-load vector-tile weight on weak networks.** The initial
  national view pulls several OpenFreeMap vector tiles at ~0.9 MB each
  (measured), i.e. an estimated **5–10 MB** of tiles before the map is usable
  (needs full-session measurement — see §7). On a congested link this is the
  "very very slow" the owner saw. `HeroMap.tsx` + the OpenFreeMap style URLs in
  `map-style.ts`.
- **HIGH — mask triangulation + `within` cost at 31.6k points.** The world-mask
  (69 holes) is triangulated per tile and the label filter evaluates `within`
  per label feature. **Fixed in this pass:** both now use a runtime-decimated
  ~8.1k-point polygon (`wilaya-geo.ts` `coarseRings`, ~5 km) — boundaries keep
  full detail for rendering. Note: the `within` filter is **net-positive** —
  removing it made pan FPS *worse* (10.8 vs 19.6) because every foreign label
  renders.
- **MEDIUM — global, non-viewport-filtered data queries.** `data.ts` fetches
  all rows up to the limits on every load. At today's scale (dozens of rows)
  this is harmless; the limits already cap worst case at ~6k rows. PostGIS
  spatial indexes exist (`sites_location_gix`, `fire_location_gix`), so the
  viewport fix is cheap when needed — see §5.
- **LOW — geolocation has no `maximumAge`.** `LocationField.tsx:73-79`:
  `getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })` forces a
  fresh GPS fix every tap (5–10 s wait on weak GPS). One-shot is correct
  (no battery drain from a watch); adding `maximumAge: 60000` allows a recent
  cached fix — faster, no accuracy cost that matters for a tree pin.
- **Measurement artifact worth recording:** `map.on('idle')` never fires in
  this app — the pulse animation's rAF loop keeps the map permanently non-idle.
  Any future perf test must not gate on `idle` (this burned an hour of this
  investigation; recorded so it doesn't burn another).
- **Headless FPS numbers are not representative.** SwiftShader (software GL)
  in headless Chromium reads ~10–20 FPS during pan where a real phone GPU is
  smooth. Pan smoothness must be judged on the owner's device, not headless.

## 4. Recommended architecture (one)

- **Basemap: keep OpenFreeMap vector tiles.** Reuse beats custom here: at the
  national/north view the map only requests Algeria tiles anyway, so an
  Algeria-only PMTiles extract saves ~nothing on first load; raster tiles would
  kill the client-side Algeria-only label filtering, which is a shipped feature.
  Browser caching makes repeat visits cheap.
- **Boundaries: shipped.** 69 wilayas, MIT SVG converted to our data-file
  format (31.6k points render set + ~8.1k runtime-decimated set for mask/filter).
- **Dynamic data: keep client-side full fetch with the existing limits.**
  Viewport-bounded PostGIS is a cheap later step (indexes already exist), not a
  now step — at dozens-to-hundreds of rows it buys nothing.
- **Rendering: MapLibre + individual dots, no clustering.** The product's point
  is "the map turns green" — clustering hides that. Add zoom-gated wilaya
  counts only if live points pass ~10k.
- **Positioning: one-shot `getCurrentPosition`, high accuracy, `timeout: 10000`,
  plus `maximumAge: 60000` (the one change here).** No watch, ever.
- **Caching: rely on OpenFreeMap's cache headers for tiles + Vercel for the
  bundle.** No custom cache layer.

## 5. Concrete implementation plan

| Change | File | Why / impact | Complexity | When |
|---|---|---|---|---|
| Coarse polygon for mask + label filter | `src/lib/wilaya-geo.ts` | 4× cheaper triangulation + filter eval; no visual change | done | **done this pass** |
| `maximumAge: 60000` on the GPS call | `src/components/LocationField.tsx` | Faster locate on weak GPS | trivial | now |
| Viewport-bounded queries (`ST_MakeEnvelope` + `ST_Intersects` on the existing GiST indexes) | `src/lib/data.ts` | Keeps fetch flat as data grows | medium | when live points > ~2k/wilaya |
| Move boundary data out of the JS bundle to a fetched static asset | `src/data/algeria-wilayas.ts` → `public/` | ~100 KB gz off the initial parse | low | only if bundle pain is measured |
| Zoom-gated wilaya counts at low zoom | `map-layers.ts` | Alternative to clustering at scale | medium | only if live points > ~10k |

## 6. What NOT to build

- **Dedicated tile server / Algeria-only PMTiles extract** — saves ~nothing at
  our view (all requested tiles are already Algeria tiles); adds a pipeline to
  maintain.
- **PostGIS-generated MVT for points** — unjustified at hundreds of rows.
- **Clustering** — contradicts the product's core visual.
- **Permanent GPS watch** — battery cost, zero benefit for a one-tap pin.
- **Raster basemap** — kills the Algeria-only label filtering.
- **Hand-tracing or interpolating the 11 new wilaya polygons** — the shipped
  MIT dataset already covers them accurately.

## 7. Open questions (need real measurement, not guesses)

- **Full first-load tile payload on a healthy connection** (number of tiles ×
  ~0.9 MB + glyphs). Method: headless session on the production build with
  cache disabled, sum `transferSize` for `tiles.openfreemap.org` + glyph PBFs.
  My two attempts were distorted: once by dev-server bloat (22 MB, not
  representative), once by a local network stall (tiles never arrived).
- **Pan FPS on the owner's actual phone** after the coarse-polygon fix —
  headless SwiftShader numbers (~20 FPS) are a floor, not a measurement.
- **Vercel preview protection:** the PR #29 preview is currently behind Vercel
  SSO (302 → vercel.com/sso-api), which blocked my production measurement from
  this machine. Confirm whether that was enabled deliberately — it also affects
  sharing preview links with contributors.

## Concrete next action

Merge the coarse-polygon fix + `maximumAge` GPS tweak, then the owner
re-checks load and pan on his phone on a non-congested connection and reports
the numbers for §7.

---

## §8 Boundary verification (appended 2026-08-22)

Direct answers, with methods — not restated conclusions.

### 8.1 SVG → lat/lng conversion method

**Transform:** a 4-parameter affine fit (independent scale + offset per axis),
x_svg → longitude linear, y_svg → **Mercator Y** linear (the source SVG is
Mercator-projected, confirmed by anchor analysis: Tindouf westmost, In Guezzam
southmost, coastal wilayas northmost, and the x/y scale ratio matching
Mercator at mid-latitude within ~3%).

**Control points:** the country extremes, taken from the *measured* bounds of
the old data file's own shapes (west −8.682385°E, east 11.968861°E, north
37.093940°N, south 18.975561°N) — not guessed constants. An earlier attempt
with guessed extremes (37.0936/18.9636) failed the Algiers check; a 48-point
least-squares fit against the old Natural Earth shapes was measurably worse
(1.35° max residual) and was rejected.

**Pipeline:** browser `getPointAtLength` flattening of the SVG's relative
Bézier/arc path data (every 3 SVG units, chunked per 6 paths), uniform
`translate(-862.86, −943.66)` applied, subpaths split at sampling jumps (>3.5
units — any jump beyond the sampling step is a subpath teleport), affine fit,
decimation to 31.6k points, re-projection into the existing data-file format.

**Measured error margin** (distance from known coordinates to their wilaya
polygon, computed on the converted output):

| Point | Result |
|---|---|
| Oran, Annaba, Constantine, Béchar, Tamanrasset, Tindouf, In Guezzam | inside (2–170 km from boundary) |
| Algiers center (36.7538, 3.0588) | **0.39 km outside** — the generic city coordinate sits in the bay just off the source polygon's coast edge; a point 500 m south-east (36.73, 3.08) is inside. Data property of the source, not a transform error (verified by backward-mapping into raw SVG units). |

### 8.2 What "city-validated" actually means

Method: point-in-polygon containment + distance-to-boundary for known
coordinates against the converted rings. **Two different scopes, stated
plainly:**

- **Pre-existing wilayas (8 checked):** Algiers, Oran, Annaba, Constantine,
  Béchar, Tamanrasset, Tindouf, In Guezzam — all pass (see table above).
- **The 11 new wilayas (59–69):** checked the same way against their namesake
  towns (coordinates from Wikipedia/Nominatim). 10 of 11 pass: Aflou, El
  Abiodh Sidi Cheikh, El Kantara, Barika, Bou Saâda, Bir El Ater, Ksar El
  Boukhari, Ksar Chellala, Aïn Oussara, Messaad — all inside (0.4–25 km from
  the boundary). Three initial "failures" were *my wrong test coordinates*
  (Aïn Oussera is at 2.90°E not 1.57°E; El Abiodh Sidi Cheikh at 32.90°N not
  33.88°N), corrected and re-passed.
- **One real discrepancy found:** the town of **El Aricha** (34.2240°N,
  −1.2577°E, Nominatim-confirmed) lands **~5 km outside** the SVG's path-61
  polygon — inside Naâma's (45) polygon instead. Tlemcen's (13) polygon
  correctly excludes it. So the source SVG's new 61/45 boundary near El Aricha
  town is off by ~5 km in the source data itself.
- **What was NOT validated:** the exact course of the 11 new boundary *lines*
  against the legal texts — no authoritative geometry for the new lines exists
  anywhere to compare against (that is the whole dataset problem). The
  validation proves the transform is sound and the polygons contain their
  towns; it does not prove the new lines match the legal boundaries. The
  El Aricha case shows at least one local ~5 km error. Say it plainly: **the
  11 new boundaries are the best available geometry, not verified-accurate
  geometry.**

### 8.3 OSM 69-relations claim — live re-check (2026-08-22, Overpass)

Done live, not from cache: `rel[boundary=administrative][admin_level=4]
['ISO3166-2'~'^DZ']` then closed-ring assembly on the outer ways
(`out body` for relations + `out skel` for ways; ways chained by shared
endpoint node ids).

- **68 relations** tagged `ISO3166-2=DZ-*` — **DZ-63 is missing** (no
  properly-tagged Barika relation).
- **All 68 have fully closed outer rings** (68/68 pass, 0 open chains) — the
  geometry itself is complete and valid.
- **But the new-wilaya tagging is buggy, confirmed live:**
  - "Barika" is coded **DZ-60** (should be 63)
  - "El Abiodh Sidi Cheikh Province" is coded **DZ-69** (should be 60)
  - "El Aricha Province" is **double-coded**: proper DZ-61 exists, plus a
    duplicate relation (20815946) carrying a lowercase `iso3166-2=DZ-63` tag
- Verdict: OSM has valid geometry for the 69 wilayas but with 3 mis-codings
  among the new ones and one missing code — usable only with a manual code
  remap, under ODbL. The MIT SVG stays the better source even with its
  documented El Aricha edge error.

### 8.4 Law/date citation (corrected)

**Law No. 26-06 of April 4, 2026, published in Official Journal No. 25 on
April 5, 2026** — replaces the wrong November-2025 date repeated from issue
#6. Fixed in §2 of this report, `src/lib/wilayas.ts`, and the roadmap.

### 8.5 Merge recommendation

The conversion method is verified sound (17/19 known points inside, both
outside cases explained by source-data properties, not transform error). The
dataset is the best available for all 69 wilayas. Merge with the El Aricha
~5 km source discrepancy documented (here) and an upstream issue to the
source repo recommended — but the final call on the 11 new lines' look is the
owner's visual gate, as before.
