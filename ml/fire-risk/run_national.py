"""National fire-risk map: NASA FIRMS 2001-2025 -> honest test -> 2027 priority map.

    python fetch_firms.py && python fetch_elevation.py   # once (cached)
    python run_national.py                               # writes public/data/*.json
    python run_national.py --no-app                      # results only
"""
import json
import sys

import numpy as np
import pandas as pd

from fire_risk.national import config as C
from fire_risk.national.evaluate import forward_test, summarize, training_rows
from fire_risk.national.export import write_map, write_wilayas
from fire_risk.national.features import FEATURES, static_rasters, year_table
from fire_risk.national.grid import shape
from fire_risk.national.labels import build_labels, load_firms
from fire_risk.national.model import fit, importance
from fire_risk.national.report import report_md


def main() -> None:
    grid = pd.read_csv(C.GRID_CSV, dtype={"wilaya": str})
    E, D, excluded, years, labels = build_labels(load_firms())
    grid = grid[~excluded[grid.iy.values, grid.ix.values]].reset_index(drop=True)
    static = static_rasters(grid, *shape())
    print(f"grid {len(grid)} cells, years {years[0]}-{years[-1]}")

    per_year = forward_test(grid, static, E, D, years)
    summary = summarize(per_year)
    print(per_year.round(3).to_string(index=False))
    print("mean:", summary["mean"])

    final = fit(training_rows(grid, static, E, D, years, years[-1]))
    target = year_table(grid, static, E, years, C.TARGET_YEAR)
    cells = grid[["ix", "iy", "lon", "lat", "wilaya"]].copy()
    cells["score"] = final.predict_proba(target[FEATURES])[:, 1]
    cells["rank"] = cells["score"].rank(pct=True)

    last10 = [i for i, y in enumerate(years) if y >= years[-1] - 9]
    cells["burned10y"] = E[last10][:, grid.iy.values, grid.ix.values].max(axis=0)

    metrics = {
        "model_version": C.MODEL_VERSION, "target_year": C.TARGET_YEAR, "gap_years": C.GAP,
        "features": FEATURES, "params": C.MODEL_PARAMS, "labels": labels,
        "grid_cells": len(grid), "test": summary, "importance": importance(final),
    }
    C.RESULTS.mkdir(parents=True, exist_ok=True)
    (C.RESULTS / "metrics.json").write_text(json.dumps(metrics, indent=2, default=int), encoding="utf-8")
    (C.RESULTS / "report.md").write_text(report_md(metrics), encoding="utf-8")
    cells.round(5).to_csv(C.RESULTS / f"grid_{C.TARGET_YEAR}_scored.csv", index=False)
    if "--no-app" not in sys.argv:  # cells: ix, iy, lon, lat, wilaya, score, rank, burned10y
        n = write_map(cells, summary)
        w = write_wilayas(cells)
        print(f"app: {n} published cells, {w} wilayas -> {C.APP_PUBLIC}")


if __name__ == "__main__":
    np.seterr(all="ignore")
    main()
