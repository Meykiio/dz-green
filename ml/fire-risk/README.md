# Fire-risk models

Builds the "fire-risk priority" layer on the Green Algeria map: which land in
northern Algeria is most likely to burn next summer, so prevention work
(brush clearing, firebreaks, patrols, water points) and replanting
protection can go there first.

It ranks land. It does **not** forecast a fire on a given day, and its
numbers are not probabilities.

Two models live here:

| | National (`national-v1`) - **feeds the app** | Kabylie (`kabylie-v8`) - research record |
|---|---|---|
| Area | 49 northern wilayas, 63,460 squares of 2 x 2 km | Bejaia + Jijel, 1 km grid |
| Fire data | NASA FIRMS MODIS, 2001-2025, public | Earth Engine export from the OpenCode session |
| Run | `python run_national.py` | `python run.py` |
| Honest result | AUC 0.886; riskiest 10% of land held 63% of the next season's burned squares | AUC 0.70; riskiest 20% held 50% |

## Run the national model

Python 3.11. From this folder:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m unittest discover -s tests
.venv/Scripts/python fetch_firms.py      # NASA FIRMS yearly files -> data/raw (cached)
.venv/Scripts/python run_national.py     # about 8 minutes
```

`run_national.py` writes two files the app serves as static assets:

- `public/data/fire-risk-2027.json`: the riskiest 30% of land, loaded only when
  a visitor turns the risk layer on (about 32 KB compressed).
- `public/data/fire-risk-wilayas-2027.json`: per-wilaya High/Medium area and
  land where fires were detected in the last 10 seasons.

Results: `results/national/report.md` (read this) and `metrics.json`.

**Every January:** NASA publishes the previous year's file. Rerun
`fetch_firms.py` and `run_national.py` (and bump `TARGET_YEAR` in
`fire_risk/national/config.py` and `RISK_TARGET_YEAR` in `src/lib/risk.ts`)
to roll the map forward a year.

## Decisions and why (national)

1. **Labels from NASA's own fire type.** MODIS tags each detection as
   vegetation fire or "static land source" (factories, gas flares). Only
   vegetation fires from June to October count. Any square with a static
   source, or "burning" on 8+ separate days in one season, is excluded: that
   is a heat source, not a forest. (The earlier Kabylie data had a third of
   its "fires" at one industrial site near El Milia for exactly this reason.)
2. **Every land square, every year.** No sampling: 63,460 squares x 20 years,
   so the model sees the real proportion of burned to unburned land and
   "the riskiest 10% of land" is exact.
3. **A two-year gap in every test.** The 2026 file is not published yet, so
   the 2027 map uses data up to 2025. The test mirrors that: year Y is
   predicted from data up to Y-2, for every year 2014-2025.
4. **Compared against a no-model rule.** "Recent fires nearby" alone scores
   almost the same (AUC 0.886). The model is kept because it is better where
   it matters, at the very top (riskiest 5-10% of land), and the report
   shows both side by side so nobody oversells it.
5. **Published as a rank, top 30% only.** High = riskiest 10% of northern
   land, Medium = next 20%. The rest is not drawn.
6. **No terrain yet.** The free elevation services were unreachable or too
   rate-limited at build time. `fetch_elevation.py` + `USE_TERRAIN` in the
   config add elevation and slope; keep them only if the honest test improves.

## Kabylie model (`run.py`, research record)

Kept because it documents the label contamination finding and the honest
re-test of the old v7 model. It no longer writes anything into the app. See
`results/report.md` and `docs/HANDOFF_FIRE_AI_CONTEXT.md` sections 11-12.

## Known limits

- MODIS sees fires of roughly 1,000 m2 and up; small fires are missed.
- Labels are satellite detections in 2 km squares, which overstates burned
  area. A mapped burned-area product (MODIS MCD64A1, EFFIS) would be better.
- History dominates: land that has never burned ranks low even if it is
  dense, dry forest. Land cover and terrain inputs are the next improvement.
- The map ranks where fires return; it says nothing about which day.
