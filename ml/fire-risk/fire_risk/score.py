"""Score the 2027 grid and turn scores into an honest relative rank.

The raw model output is NOT a probability of fire (the training mix of fires
and land is artificial). What it does support is ordering: which land is
riskier than which. So each cell gets its rank: the share of the mapped
land that scores lower. 0.9 means "riskier than 90% of the land" (top 10%).
"""
import json

import pandas as pd

from . import config as C
from .features import add_features


def load_grid(path=C.GRID_CSV) -> pd.DataFrame:
    grid = pd.read_csv(path)
    coords = grid[".geo"].map(lambda s: json.loads(s)["coordinates"])
    grid["lon"], grid["lat"] = coords.str[0], coords.str[1]
    return grid


def score_grid(model, grid: pd.DataFrame, events: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    burnable = ~grid.landcover.isin(C.NOT_BURNABLE)
    cells = add_features(grid[burnable], events, years=C.TARGET_YEAR)
    cells["score"] = model.predict_proba(cells[C.FEATURES])[:, 1]
    cells["rank"] = cells["score"].rank(method="average", pct=True)
    report = {
        "grid_cells": int(len(grid)),
        "dropped_not_burnable": int((~burnable).sum()),
        "scored_cells": int(len(cells)),
    }
    return cells[["lon", "lat", "landcover", "score", "rank"]], report
