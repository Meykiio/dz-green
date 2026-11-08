"""Settings for the national model. Change a value, rerun `python run_national.py`."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
RAW = DATA / "raw"
RESULTS = ROOT / "results" / "national"
FIRMS_DIR = RAW / "firms_modis"
WILAYAS_GEOJSON = DATA / "wilayas.geojson"
GRID_CSV = DATA / "grid_north_2km.csv"  # cells + wilaya + elevation (committed)
APP_PUBLIC = ROOT.parent.parent / "public" / "data"

MODEL_VERSION = "national-v1"
TARGET_YEAR = 2027

# 2 km squares (0.018 deg) over the northern fire belt. 99% of the
# country's vegetation fires in June-October sit north of 34.5 N.
CELL_DEG = 0.018
LAT_MIN, LAT_MAX = 34.5, 37.2
LON_MIN, LON_MAX = -2.3, 8.7

# Labels: MODIS vegetation fires (type 0) in the fire season, confidence >= 30.
SEASON_MONTHS = (6, 7, 8, 9, 10)
MIN_CONFIDENCE = 30
# A cell "burning" on this many separate days in one season is a permanent
# heat source the type flag missed (a real wildfire burns a 2 km cell for a
# few days). Cells with any MODIS static-source detection are excluded too.
PERSISTENT_DAYS_PER_SEASON = 8

FIRST_YEAR = 2001
# History must exist before a year is usable as a training row.
FIRST_TRAIN_YEAR = 2006
# The 2026 file is not published yet, so the 2027 map can only use data up
# to 2025. Every test mirrors that: predict year Y from data up to Y - GAP.
GAP = 2
TEST_YEARS = list(range(2014, 2026))

# Neighbourhood fire history: Gaussian smoothing radii (in cells, 1 cell = 2 km).
HISTORY_SIGMAS = (1.0, 3.0, 8.0)
HISTORY_DECAY = 0.85  # weight per year of age

MODEL_PARAMS = dict(
    n_estimators=400, max_depth=3, learning_rate=0.05, subsample=0.8,
    colsample_bytree=0.8, min_child_weight=20, eval_metric="logloss",
    random_state=0, tree_method="hist",
)

CAPTURE_SHARES = (0.05, 0.1, 0.2)

# Terrain (elevation, slope) needs data/grid_north_2km.csv with elevation
# filled by fetch_elevation.py. Off by default: the free elevation services
# were not reachable at build time (2026-11-08), and the honest test without
# terrain is already strong. Turn on, rerun, keep it only if the test improves.
USE_TERRAIN = False
