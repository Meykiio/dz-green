"""Load the Earth Engine sample and turn raw satellite detections into clean fire events."""
import json

import pandas as pd

from . import config as C


def load_points(path=C.POINTS_CSV) -> pd.DataFrame:
    df = pd.read_csv(path)
    coords = df[".geo"].map(lambda s: json.loads(s)["coordinates"])
    df["lon"], df["lat"] = coords.str[0], coords.str[1]
    df["cell"] = cell_ids(df.lon, df.lat)
    return df


def cell_ids(lon: pd.Series, lat: pd.Series) -> list:
    return list(zip((lon / C.CELL_DEG).round().astype(int), (lat / C.CELL_DEG).round().astype(int)))


def persistent_cells(fires: pd.DataFrame) -> set:
    """Cells detected on too many separate days or years to be wildfire."""
    stats = fires.groupby("cell").agg(dates=("date", "nunique"), years=("year", "nunique"))
    bad = (stats.dates >= C.PERSISTENT_MIN_DATES) | (stats.years >= C.PERSISTENT_MIN_YEARS)
    return set(stats[bad].index)


def build_labels(points: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, dict]:
    """Return (fire events, random land sample, cleaning report).

    A fire event is one ~1 km cell burning in one year. The random land sample
    stands for "the land in general" and is what the model learns to tell
    fires apart from. The near-fire negatives in the export are not used: they
    were drawn next to fires on purpose, so they do not represent the land.
    """
    fires = points[points.neg_type == "fire"]
    persistent = persistent_cells(fires)
    in_persistent = fires.cell.isin(persistent)
    on_built_up = fires.landcover == C.LC_BUILT_UP
    clean = fires[~in_persistent & ~on_built_up]
    events = clean.sort_values("date").groupby(["cell", "year"], as_index=False).first()

    land = points[(points.neg_type == "random") & ~points.cell.isin(persistent)].copy()

    report = {
        "raw_fire_detections": int(len(fires)),
        "dropped_persistent_heat_sources": int(in_persistent.sum()),
        "persistent_cells": len(persistent),
        "dropped_built_up_only": int((on_built_up & ~in_persistent).sum()),
        "clean_fire_events": int(len(events)),
        "events_per_year": {int(k): int(v) for k, v in events.groupby("year").size().items()},
        "random_land_points": int(len(land)),
    }
    return events, land, report
