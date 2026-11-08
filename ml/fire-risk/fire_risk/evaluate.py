"""Honest test: predict each year using only earlier years, graded against random land.

The question it answers is the one a forest office asks: "if we treat the
riskiest X% of the land, what share of next year's fires does that cover?"
"""
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score

from . import config as C
from .features import add_features, training_table
from .model import fit


def capture(fire_scores: np.ndarray, land_scores: np.ndarray, share: float) -> float:
    """Share of fires scoring inside the riskiest `share` of the land."""
    return float((fire_scores >= np.quantile(land_scores, 1 - share)).mean())


def forward_test(events: pd.DataFrame, land: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for year in C.TEST_YEARS:
        model = fit(training_table(events, land, before_year=year))
        test_fires = add_features(events[events.year == year], events)
        land_now = add_features(land, events, years=year)
        pf = model.predict_proba(test_fires[C.FEATURES])[:, 1]
        pl = model.predict_proba(land_now[C.FEATURES])[:, 1]
        y = np.r_[np.ones(len(pf)), np.zeros(len(pl))]
        row = {"year": year, "fires": len(pf), "auc": roc_auc_score(y, np.r_[pf, pl])}
        for share in C.CAPTURE_SHARES:
            row[f"top{int(share * 100)}"] = capture(pf, pl, share)
        rows.append(row)
    return pd.DataFrame(rows)


def summarize(per_year: pd.DataFrame) -> dict:
    cols = ["auc"] + [f"top{int(s * 100)}" for s in C.CAPTURE_SHARES]
    return {
        "mean": {c: round(float(per_year[c].mean()), 3) for c in cols},
        "worst_year": {c: round(float(per_year[c].min()), 3) for c in cols},
        "per_year": per_year.round(3).to_dict(orient="records"),
    }
