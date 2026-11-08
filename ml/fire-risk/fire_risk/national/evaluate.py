"""Honest test: predict each year from data up to Y - GAP, graded on all land cells."""
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from . import config as C
from .features import FEATURES, year_table
from .model import fit


def capture(scores: np.ndarray, weight: np.ndarray, share: float) -> float:
    """Share of `weight` (burned cells or detections) inside the top `share` of land."""
    top = scores >= np.quantile(scores, 1 - share)
    return float(weight[top].sum() / max(weight.sum(), 1e-9))


def training_rows(grid, static, E, D, years, last_label_year: int) -> pd.DataFrame:
    rows = [year_table(grid, static, E, years, y, D) for y in years
            if C.FIRST_TRAIN_YEAR <= y <= last_label_year]
    return pd.concat(rows, ignore_index=True)


def forward_test(grid, static, E, D, years) -> pd.DataFrame:
    out = []
    for test_year in C.TEST_YEARS:
        train = training_rows(grid, static, E, D, years, test_year - C.GAP)
        model = fit(train)
        test = year_table(grid, static, E, years, test_year, D)
        if test.label.sum() == 0:
            continue
        p = model.predict_proba(test[FEATURES])[:, 1]
        rule = test.near_s3.values  # simple baseline: recent fires nearby
        row = {"year": test_year, "burned_cells": int(test.label.sum()),
               "auc": roc_auc_score(test.label, p), "auc_rule": roc_auc_score(test.label, rule)}
        for s in C.CAPTURE_SHARES:
            k = int(s * 100)
            row[f"top{k}"] = capture(p, test.label.values, s)
            row[f"top{k}_rule"] = capture(rule, test.label.values, s)
            row[f"top{k}_detections"] = capture(p, test.detections.values, s)
        out.append(row)
    return pd.DataFrame(out)


def summarize(per_year: pd.DataFrame) -> dict:
    cols = [c for c in per_year.columns if c not in ("year", "burned_cells")]
    return {
        "mean": {c: round(float(per_year[c].mean()), 3) for c in cols},
        "worst_year": {c: round(float(per_year[c].min()), 3) for c in cols},
        "per_year": per_year.round(3).to_dict(orient="records"),
    }
