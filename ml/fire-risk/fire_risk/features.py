"""Model inputs. Everything here is knowable before the fire season starts."""
import numpy as np
import pandas as pd

from . import config as C


def fire_history(lon, lat, years, events: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    """For each point, using ONLY fires from years before its own year:

    - hist_km: distance to the nearest earlier fire (km), NaN if none yet
    - hist_density: recency-weighted count of earlier fires nearby
      (Gaussian falloff over HISTORY_RADIUS_KM, older years count less)
    """
    lon, lat, years = np.asarray(lon, float), np.asarray(lat, float), np.asarray(years)
    out_km = np.full(len(lon), np.nan)
    out_density = np.zeros(len(lon))
    for year in np.unique(years):
        past = events[events.year < year]
        if past.empty:
            continue
        idx = np.where(years == year)[0]
        dx = (lon[idx, None] - past.lon.values[None]) * C.KM_PER_DEG_LON
        dy = (lat[idx, None] - past.lat.values[None]) * C.KM_PER_DEG_LAT
        dist = np.hypot(dx, dy)
        weight = C.HISTORY_YEARLY_DECAY ** (year - 1 - past.year.values)[None]
        out_km[idx] = dist.min(axis=1)
        out_density[idx] = (np.exp(-((dist / C.HISTORY_RADIUS_KM) ** 2)) * weight).sum(axis=1)
    return out_km, out_density


def add_features(df: pd.DataFrame, events: pd.DataFrame, years=None) -> pd.DataFrame:
    """Return a copy with the model inputs added. `years` overrides df.year
    (used to view the whole land sample "as of" one test or target year)."""
    out = df.copy()
    yrs = out.year.values if years is None else np.full(len(out), years)
    out["hist_km"], out["hist_density"] = fire_history(out.lon, out.lat, yrs, events)
    for col in C.FEATURES:
        out[col] = pd.to_numeric(out[col], errors="coerce")
    return out


def training_table(events: pd.DataFrame, land: pd.DataFrame, before_year: int) -> pd.DataFrame:
    """Fire events (label 1) and random land (label 0) from FIRST_TRAIN_YEAR
    up to, not including, `before_year`, with history computed per row year."""
    keep = lambda d: d[(d.year >= C.FIRST_TRAIN_YEAR) & (d.year < before_year)]
    table = pd.concat([keep(events).assign(label=1), keep(land).assign(label=0)], ignore_index=True)
    return add_features(table, events)
