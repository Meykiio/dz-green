"""NASA FIRMS MODIS detections -> yearly burned-cell rasters.

E[y, iy, ix] = 1 when the 2 km cell had a vegetation-fire detection in the
fire season of that year. D holds the detection count (a size proxy).
Cells with a static-source detection, or detected on too many separate days
in one season, are excluded: those are factories and gas flares, not forest.
"""
import glob

import numpy as np
import pandas as pd

from . import config as C
from .grid import cell_index, shape


def load_firms() -> pd.DataFrame:
    files = sorted(glob.glob(str(C.FIRMS_DIR / "modis_*_Algeria.csv")))
    if not files:
        raise SystemExit("No FIRMS files. Run: python fetch_firms.py")
    d = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)
    d = d[(d.latitude >= C.LAT_MIN) & (d.latitude < C.LAT_MAX) &
          (d.longitude >= C.LON_MIN) & (d.longitude < C.LON_MAX)].copy()
    d["year"] = d.acq_date.str[:4].astype(int)
    d["month"] = d.acq_date.str[5:7].astype(int)
    d["ix"], d["iy"] = cell_index(d.longitude.values, d.latitude.values)
    return d


def build_labels(d: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[int], dict]:
    """Returns (E, D, excluded_mask, years, report)."""
    ny, nx = shape()
    years = list(range(C.FIRST_YEAR, int(d.year.max()) + 1))
    excluded = np.zeros((ny, nx), bool)
    static = d[d["type"] == 2]
    excluded[static.iy.values, static.ix.values] = True

    veg = d[(d["type"] == 0) & (d.confidence >= C.MIN_CONFIDENCE) & d.month.isin(C.SEASON_MONTHS)]
    days = veg.groupby(["year", "iy", "ix"]).acq_date.nunique().reset_index(name="days")
    persistent = days[days.days >= C.PERSISTENT_DAYS_PER_SEASON]
    excluded[persistent.iy.values, persistent.ix.values] = True

    keep = veg[~excluded[veg.iy.values, veg.ix.values]]
    E = np.zeros((len(years), ny, nx), np.float32)
    D = np.zeros((len(years), ny, nx), np.float32)
    yi = keep.year.values - C.FIRST_YEAR
    np.add.at(D, (yi, keep.iy.values, keep.ix.values), 1)
    E[D > 0] = 1
    report = {
        "detections_in_box": int(len(d)),
        "static_source_detections": int(len(static)),
        "season_vegetation_detections": int(len(veg)),
        "excluded_cells_static": int(np.unique(static.iy.values * nx + static.ix.values).size),
        "excluded_cells_persistent": int(np.unique(persistent.iy.values * nx + persistent.ix.values).size),
        "burned_cells_per_year": {y: int(E[i].sum()) for i, y in enumerate(years)},
    }
    return E, D, excluded, years, report
