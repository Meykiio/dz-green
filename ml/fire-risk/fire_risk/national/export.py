"""Publish the national map and per-wilaya summary as static files for the app.

public/data/fire-risk-<year>.json - top 30% of land only (High + Medium),
    flat [ix, iy, rank%, ...] so it stays small; loaded on demand by the map.
public/data/fire-risk-wilayas-<year>.json - per-wilaya figures for the
    prevention and restoration views.
"""
import json

import numpy as np
import pandas as pd

from . import config as C

PUBLISH_FROM_RANK = 0.7  # top 30% of land
KM_PER_DEG = 111.32


def cell_km2(lat: np.ndarray) -> np.ndarray:
    """Area of a CELL_DEG x CELL_DEG square at this latitude (~3.2 km2 in the north)."""
    side = C.CELL_DEG * KM_PER_DEG
    return side * side * np.cos(np.radians(lat))


def write_map(cells: pd.DataFrame, summary: dict) -> int:
    top = cells[cells["rank"] >= PUBLISH_FROM_RANK].sort_values(["iy", "ix"])
    flat = np.column_stack([top.ix, top.iy, np.floor(top["rank"] * 100).clip(0, 99)]).astype(int)
    payload = {
        "version": C.MODEL_VERSION,
        "targetYear": C.TARGET_YEAR,
        "cellDeg": C.CELL_DEG,
        "lon0": C.LON_MIN,
        "lat0": C.LAT_MIN,
        "publishedFromRank": PUBLISH_FROM_RANK,
        "test": {k: summary["mean"][k] for k in ("auc", "top10", "top20")},
        "cells": flat.ravel().tolist(),
    }
    C.APP_PUBLIC.mkdir(parents=True, exist_ok=True)
    path = C.APP_PUBLIC / f"fire-risk-{C.TARGET_YEAR}.json"
    path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    return len(top)


def write_wilayas(cells: pd.DataFrame) -> int:
    """Per wilaya: land, High and Medium area, and land burned at least once
    in the last 10 seasons (`burned10y`, a 0/1 column on `cells`)."""
    c = cells.assign(km2=cell_km2(cells.lat.values))
    c["high"] = c.km2 * (c["rank"] >= 0.9)
    c["medium"] = c.km2 * ((c["rank"] >= 0.7) & (c["rank"] < 0.9))
    c["burned"] = c.km2 * c.burned10y
    out = c.groupby("wilaya")[["km2", "high", "medium", "burned"]].sum().rename(
        columns={"km2": "landKm2", "high": "highKm2", "medium": "mediumKm2", "burned": "burnedKm2"})
    rows = [
        {
            "code": str(code),
            "landKm2": int(r.landKm2),
            "highKm2": int(r.highKm2),
            "mediumKm2": int(r.mediumKm2),
            "burnedKm2": int(r.burnedKm2),
            "highShare": round(float(r.highKm2 / r.landKm2), 3) if r.landKm2 else 0.0,
        }
        for code, r in out.sort_values("highKm2", ascending=False).iterrows()
    ]
    payload = {
        "version": C.MODEL_VERSION,
        "targetYear": C.TARGET_YEAR,
        "burnedYears": "2016-2025",
        "wilayas": rows,
    }
    path = C.APP_PUBLIC / f"fire-risk-wilayas-{C.TARGET_YEAR}.json"
    path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    return len(rows)
