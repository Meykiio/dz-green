# Fire-risk pipeline (model kabylie-v8)

Builds the "fire-risk priority" layer on the Green Algeria map: which land
in Bejaia and Jijel is most likely to burn next summer, so prevention work
(brush clearing, firebreaks, patrols, water points) can go there first.

It ranks land. It does **not** forecast a fire on a given day, and its
numbers are not probabilities.

## Run it

Python 3.11. From this folder:

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m unittest discover -s tests
.venv/Scripts/python run.py
```

`run.py` cleans the labels, runs the honest test, trains the final model,
scores the 2027 grid, and rewrites `src/data/risk-grid.ts` in the app.
Use `--no-app` to skip the last step. Results land in `results/`:
`report.md` (read this), `metrics.json`, `grid_2027_scored.csv`.

## Files

| File | Job |
|---|---|
| `fire_risk/config.py` | Every tunable number, with the reason for it |
| `fire_risk/labels.py` | Satellite detections in, clean fire events out |
| `fire_risk/features.py` | Model inputs, incl. fire history built only from earlier years |
| `fire_risk/model.py` | The model (XGBoost, depth-2 trees) |
| `fire_risk/evaluate.py` | Year-by-year honest test |
| `fire_risk/score.py` | Scores the grid, converts to relative rank |
| `fire_risk/export.py` | Writes the app's `risk-grid.ts` |
| `tests/test_pipeline.py` | Guards against the two silent failures below |

## Data (`data/`)

- `v7_master_everything_2016_2026.csv`: Google Earth Engine sample made
  2026-09 (OpenCode session). 1,676 fire detections (satellite active-fire
  points, July-August 2016-2026), 2,208 random land points, 1,591
  near-fire points. The Earth Engine script that made it is lost.
- `kabylie_grid_climo_fixed_v3.csv`: the 3,882-cell 1 km grid over Bejaia +
  Jijel that gets scored.

## Decisions and why

1. **Labels are cleaned.** About a third of the "fires" in the export were
   one spot near El Milia (Jijel) detected on 100+ separate days across
   7 years: a permanent industrial heat source, not wildfire. Any 1 km cell
   detected on 8+ days or in 4+ years is dropped, and so are detections on
   built-up land. Without this, the model learns to find the factory and
   scores *higher* on tests (0.76) because the factory "burns" every year.
2. **One fire per 1 km cell per year.** A single fire seen by many satellite
   passes counted many times before.
3. **Only inputs known before summer.** Weather on the day of a fire
   cannot be known a year ahead, so it is not used. Inputs: fire history
   nearby (distance and recency-weighted density, earlier years only),
   land cover, distance to cropland, elevation. The earlier v7 model used
   day-of-fire weather; with cleaned labels it did worse and was unstable
   (worst year: top 20% of land held 4% of fires).
4. **Trained against random land only.** The near-fire points were placed
   next to fires on purpose, so they do not represent the land a forest
   office has to choose from.
5. **Graded the way it will be used.** Each year 2020-2026 is predicted by a
   model trained only on earlier years, and graded by "the riskiest X% of
   land held what share of that year's fires".
6. **Published as a rank, not a percentage.** Each cell shows the share of
   mapped land that is less risky. High = top 10%, Medium = next 20%.
   Water and built-up cells are not published.

## Results

See `results/report.md` for the current numbers. At the time of writing:
AUC 0.70 on average; the riskiest 20% of land held 50% of the next year's
fires (random: 20%), worst year 35%, best year (2026) 67%.

## Known limits

- Two wilayas only. Coastal/national coverage needs a new Earth Engine
  export (the script must be rewritten; the original is lost).
- Labels are satellite detections, not mapped burned areas. A burned-area
  product (e.g. MODIS MCD64A1 or EFFIS) would be a better label.
- Year-to-year skill varies a lot (2023 was weak).
- Inputs EVI, aspect and pre-season rainfall were not in the scoring grid;
  a new export could add them, then rerun and keep them only if the honest
  test improves.
