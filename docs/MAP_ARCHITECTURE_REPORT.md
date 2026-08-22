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

Legal note: the 69-wilaya state took effect via the November 2025 decrees
(council of ministers 16/11/2025, per the APS reference in issue #6). Our reply
on issue #6 promised the update; it is now delivered.

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
