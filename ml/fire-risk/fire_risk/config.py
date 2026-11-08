"""Every tunable number in one place. Change a value here, rerun `python run.py`."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RESULTS = ROOT / "results"
APP_GRID = ROOT.parent.parent / "src" / "data" / "risk-grid.ts"

POINTS_CSV = DATA / "v7_master_everything_2016_2026.csv"
GRID_CSV = DATA / "kabylie_grid_climo_fixed_v3.csv"

MODEL_VERSION = "kabylie-v8"
TARGET_YEAR = 2027

# A "cell" is a ~1 km square (0.009 degrees). One fire per cell per year counts once.
CELL_DEG = 0.009
KM_PER_DEG_LON = 89.2  # at ~36.7 N
KM_PER_DEG_LAT = 111.2

# Label cleaning. A real wildfire cannot burn the same 1 km square on many
# separate days or in many separate years; a factory or dump can. Cells over
# either limit are permanent heat sources, not wildfires, and are dropped.
PERSISTENT_MIN_DATES = 8
PERSISTENT_MIN_YEARS = 4

# ESA WorldCover classes.
LC_BUILT_UP = 50
LC_WATER = 80
NOT_BURNABLE = (LC_BUILT_UP, LC_WATER)

# Fire history input: recency-weighted density of earlier fires.
HISTORY_RADIUS_KM = 3.0
HISTORY_YEARLY_DECAY = 0.8
FIRST_TRAIN_YEAR = 2017  # 2016 has no earlier fires to build history from

FEATURES = ["hist_km", "hist_density", "landcover", "dist_to_cropland", "elevation"]

MODEL_PARAMS = dict(
    n_estimators=300,
    max_depth=2,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=5,
    eval_metric="logloss",
    random_state=0,
)

TEST_YEARS = list(range(2020, 2027))
CAPTURE_SHARES = (0.1, 0.2, 0.3)

# Map bands on the exported relative rank (share of mapped land that is less risky).
BAND_HIGH = 0.9  # top 10% of land
BAND_MEDIUM = 0.7  # top 30% of land
