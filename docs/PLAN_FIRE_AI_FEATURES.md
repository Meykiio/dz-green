# Plan: Fire AI + Reforestation Features for Green DZ

Status: proposed. Owner: Sifeddine. Date: 2026-09-05.
Basis: full codebase scan (2026-09-05) + deep research (Restor platform,
EFFIS/WeatherOptics risk-layer conventions, fire-prediction corpus, the
0.826 Kabylie model built this session).

## 0. The integration pattern (the key insight)

The codebase already has the exact template for every new layer: the
**FIRMS hotspots layer**. The pattern is:

```
server route (edge-cached GeoJSON)  ->  query in data.ts  ->  map layer
with distinct visual signature  ->  detail panel
```

Every new feature follows this same pattern. No new architecture needed.

## 1. Feature set (in build order)

### Phase A: Fire risk layer (the model goes live)

What: the 0.826 Kabylie model's risk scores as a map layer, refreshed
daily. Green-to-red zones over the map, distinct from the pulsing red
community fires and the amber hotspot rings.

Data: the coastal-master Earth Engine export (all coastal wilayas, one
export, ~4-6h) scored by the champion model. Static-ish: refresh weekly
or daily, not hourly.

Integration:
- `src/lib/risk.server.ts` — loads the scored grid (from a Supabase table
  or a bundled asset), serves GeoJSON polygons/points with risk values
- `src/routes/api/public/risk.ts` — the route (copy of hotspots.ts)
- `src/lib/data.ts` — `riskQuery` (copy of hotspotsQuery)
- `src/components/map/risk-layer.ts` — the map layer (copy of
  hotspots-layer.ts, but a fill/heatmap style, not circles)
- `src/components/map/detail-bodies.tsx` — risk detail panel

UX rules (from EFFIS/WeatherOptics conventions + DESIGN.md):
- Sequential color ramp, color-blind safe: light yellow -> orange -> dark
  red. Never use the semantic fire red for the whole ramp; reserve pure
  red for the extreme class.
- Legend always visible when the layer is on (the existing legend chips
  pattern).
- Honest copy on the panel: "Model estimate for typical summer
  conditions, not a live forecast. Not ground-verified."
- Layer toggle in the existing chip row (Trees/Care/Fires/Hotspots/Risk).
- Default OFF on first load (risk is a power-user layer; fires are the
  default). Remember the toggle per visitor.

### Phase B: Burn-damage layer (plant here first)

What: dNBR burn severity from this summer's fires, as a map layer with
"replant priority" ranking. The dNBR script already exists.

Data: one Earth Engine export of the 2026 burn severity raster, clipped
to Algeria. Static for the season; refresh yearly.

Integration: same pattern as Phase A. Distinct visual: dark brown/black
scars with severity classes (low/moderate/high), not the risk ramp.

UX: when a user opens the plant form, if their wilaya has burn damage,
show a gentle nudge: "This wilaya has X ha of burned forest. Plant here
first." Links to the map layer.

### Phase C: Planting-suitability map (where to plant)

What: every 1km square scored for planting suitability (soil, rainfall,
elevation, land cover, species fit). Extends the existing "what to plant
where" feature (11q) from per-wilaya species chips to a spatial map.

Data: one Earth Engine export (soil + climate + terrain + land cover),
same stack as the fire model. Static; refresh yearly.

UX: a "Planting guide" map layer. Click a zone -> species suggestions
for that zone (reusing the existing wilaya-species matrix + climate
class). The plant form's wilaya dropdown already exists; this adds the
spatial layer on top.

### Phase D: Tree health monitoring (survival tracking)

What: NDVI-based health per planted site. The "needs water" flag (11j)
already exists; this adds satellite greenness as a second signal.

Data: MODIS NDVI, free, refreshed weekly via a scheduled job (the
hotspots pattern, but on a cron).

UX: on the site detail panel, a small health line: "Vegetation health:
good / stressed / declining" with a satellite-derived trend. The care
form gets a "report a problem" action that pre-fills from the health
signal.

### Phase E: Community confirmations (the trust layer)

What: the spec already written (docs/FEATURE_community_confirmations.md).
Confirm/deny on fire reports, distance-weighted, trust-scored.

### Phase F: AI consent (the honest data layer)

What: one consent screen, honest and plain: "We use your data to train
AI that predicts fires and finds the best places to plant. You can opt
out anytime." Required by Algeria's Loi 25-11 anyway.

UX: a small banner on first visit, not a blocking modal. One tap to
accept, one to decline, both respected. The consent state stored in
localStorage (no account needed). The privacy page (already exists)
gets the AI-training line.

## 2. Data needs summary

| Feature | New data needed | Cost | Refresh |
|---|---|---|---|
| Fire risk layer | Coastal-master EE export (4-6h) | Free | Daily/weekly |
| Burn damage | 2026 dNBR raster export | Free | Yearly |
| Planting suitability | Soil+climate+terrain export | Free | Yearly |
| Tree health | MODIS NDVI (already used) | Free | Weekly (cron) |
| Confirmations | None (new table) | Free | Real-time |
| AI consent | None | Free | Static |

All free. The only costs are the already-planned Supabase Pro + Vercel
Pro ($25/mo each) at launch.

## 3. Automatic updates

Everything refreshes itself through the existing server-route pattern:
- Risk layer: daily refresh (cron or on-demand with cache)
- Burn damage: yearly (static asset)
- Suitability: yearly (static asset)
- Tree health: weekly (cron)
- Hotspots: already every 10 min

No manual updates anywhere. The Earth Engine exports are one-time pulls;
the live layers refresh themselves.

## 4. Build order and effort

1. Phase A (fire risk layer): 2-3 days. Highest value, model exists.
2. Phase B (burn damage): 1-2 days. dNBR script exists.
3. Phase F (AI consent): half a day. Legal + trust.
4. Phase E (confirmations): 2-3 days. Spec exists.
5. Phase C (suitability): 3-4 days. Needs the export.
6. Phase D (tree health): 2-3 days. Needs the cron.

Total: ~2 weeks of focused work, all free, all following the existing
hotspots pattern.

## 5. UX principles (from the research)

- Risk layers are OFF by default; fires are ON. Power users opt in.
- Every layer has a distinct visual signature (fires pulse red, hotspots
  amber rings, risk is a fill ramp, burn is dark scars). Never two layers
  that read the same.
- Every AI-derived layer carries honest copy: "model estimate, not
  ground-verified, not a live forecast."
- The Protection Civile disclaimer stays on every fire surface.
- Color-blind-safe ramps, legend always visible, reduced-motion
  respected (all existing DESIGN.md rules).
- The consent screen is a banner, not a modal. Honest, one tap, both
  choices respected.

## 6. What NOT to build (yet)

- Spread prediction (the 95% task): separate project, after the layers
  ship.
- WeatherNext 3 live forecasts: waiting on the allowlist; the risk layer
  is the v1, WN3 is the v2 upgrade.
- National 58/69-wilaya model: after the coastal master validates.
