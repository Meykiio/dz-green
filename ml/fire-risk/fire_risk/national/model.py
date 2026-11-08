"""Gradient-boosted trees over every land cell-year (true fire prevalence, no sampling)."""
import pandas as pd
from xgboost import XGBClassifier

from . import config as C
from .features import FEATURES


def fit(table: pd.DataFrame) -> XGBClassifier:
    model = XGBClassifier(**C.MODEL_PARAMS)
    model.fit(table[FEATURES], table["label"])
    return model


def importance(model: XGBClassifier) -> dict:
    gain = model.get_booster().get_score(importance_type="gain")
    total = sum(gain.values()) or 1.0
    return {k: round(gain.get(k, 0.0) / total, 3) for k in FEATURES}
