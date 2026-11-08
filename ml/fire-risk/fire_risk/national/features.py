"""Inputs for predicting year Y using only fire data up to year Y - GAP."""
import numpy as np
import pandas as pd
from scipy.ndimage import gaussian_filter

from . import config as C

HISTORY = ["own_recent", "own_years", "years_since", "near_s1", "near_s3", "near_s8"]
FEATURES = HISTORY + ["lat", "lon"] + (["elevation", "slope"] if C.USE_TERRAIN else [])


def static_rasters(grid: pd.DataFrame, ny: int, nx: int) -> dict[str, np.ndarray]:
    elev = np.full((ny, nx), np.nan, np.float32)
    elev[grid.iy.values, grid.ix.values] = grid.elevation.values
    filled = np.where(np.isnan(elev), 0, elev)
    gy, gx = np.gradient(filled, 2000.0)  # metres per metre over 2 km cells
    slope = np.degrees(np.arctan(np.hypot(gx, gy))).astype(np.float32)
    return {"elevation": elev, "slope": slope}


def history_rasters(E: np.ndarray, years: list[int], target_year: int) -> dict[str, np.ndarray]:
    """Fire-history rasters as known at the start of `target_year` (data up to target - GAP)."""
    last = target_year - C.GAP
    idx = [i for i, y in enumerate(years) if y <= last]
    if not idx:
        z = np.zeros(E.shape[1:], np.float32)
        return {k: z for k in ("own_recent", "own_years", "near_s1", "near_s3", "near_s8")} | {
            "years_since": z + 30}
    past = E[idx]
    ages = np.array([last - years[i] for i in idx], np.float32)
    weights = (C.HISTORY_DECAY ** ages)[:, None, None]
    recent = (past * weights).sum(axis=0)
    burned_any = past.any(axis=0)
    last_burn = np.where(burned_any, np.argmax(past[::-1], axis=0), 30).astype(np.float32)
    out = {
        "own_recent": recent,
        "own_years": past.sum(axis=0),
        "years_since": np.where(burned_any, last_burn + C.GAP, 30).astype(np.float32),
    }
    for s, name in zip(C.HISTORY_SIGMAS, ("near_s1", "near_s3", "near_s8")):
        out[name] = gaussian_filter(recent, sigma=s, mode="constant").astype(np.float32)
    return out


def year_table(grid: pd.DataFrame, static: dict, E: np.ndarray, years: list[int],
               target_year: int, D: np.ndarray | None = None) -> pd.DataFrame:
    """One row per grid cell with the inputs for `target_year`."""
    hist = history_rasters(E, years, target_year)
    iy, ix = grid.iy.values, grid.ix.values
    t = {k: v[iy, ix] for k, v in (hist | static).items()}
    t["lat"], t["lon"] = grid.lat.values, grid.lon.values
    df = pd.DataFrame(t)
    df["year"] = target_year
    if target_year in years:
        yi = years.index(target_year)
        df["label"] = E[yi, iy, ix]
        if D is not None:
            df["detections"] = D[yi, iy, ix]
    return df[FEATURES + [c for c in ("year", "label", "detections") if c in df]]
