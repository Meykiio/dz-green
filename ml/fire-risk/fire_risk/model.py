"""The model: small gradient-boosted trees (XGBoost), shallow on purpose.

~800 fire events is a small dataset; depth-2 trees cannot memorise single
places, which kept year-to-year results the most stable in testing.
"""
import pandas as pd
from xgboost import XGBClassifier

from . import config as C


def fit(table: pd.DataFrame) -> XGBClassifier:
    model = XGBClassifier(**C.MODEL_PARAMS)
    model.fit(table[C.FEATURES], table["label"])
    return model


def importance(model: XGBClassifier) -> dict:
    gain = model.get_booster().get_score(importance_type="gain")
    total = sum(gain.values()) or 1.0
    return {k: round(gain.get(k, 0.0) / total, 3) for k in C.FEATURES}
