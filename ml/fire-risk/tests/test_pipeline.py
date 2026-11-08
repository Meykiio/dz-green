"""Guards for the two mistakes that break a fire model silently.

Run: python -m unittest discover -s tests
"""
import unittest

import numpy as np
import pandas as pd

from fire_risk import config as C
from fire_risk.features import fire_history
from fire_risk.labels import build_labels, cell_ids


def points(rows):
    df = pd.DataFrame(rows, columns=["lon", "lat", "year", "date", "neg_type", "landcover"])
    df["cell"] = cell_ids(df.lon, df.lat)
    return df


class HistoryUsesOnlyThePast(unittest.TestCase):
    def test_same_year_fire_is_invisible(self):
        events = points([(5.0, 36.5, 2024, "2024-07-01", "fire", 10)])
        km, density = fire_history([5.0], [36.5], [2024], events)
        self.assertTrue(np.isnan(km[0]))
        self.assertEqual(density[0], 0.0)

    def test_earlier_fire_is_seen(self):
        events = points([(5.0, 36.5, 2023, "2023-07-01", "fire", 10)])
        km, density = fire_history([5.0], [36.5], [2024], events)
        self.assertAlmostEqual(km[0], 0.0)
        self.assertAlmostEqual(density[0], 1.0)

    def test_older_fires_count_less(self):
        events = points([(5.0, 36.5, 2020, "2020-07-01", "fire", 10)])
        _, density = fire_history([5.0], [36.5], [2024], events)
        self.assertAlmostEqual(density[0], C.HISTORY_YEARLY_DECAY ** 3)


class PermanentHeatSourcesAreNotWildfires(unittest.TestCase):
    def test_spot_burning_every_year_is_dropped(self):
        rows = [(6.25, 36.74, y, f"{y}-07-0{d}", "fire", 30) for y in range(2016, 2021) for d in (1, 2)]
        rows += [(5.0, 36.5, 2019, "2019-08-01", "fire", 10), (5.5, 36.6, 2019, "2019-08-01", "random", 10)]
        events, land, report = build_labels(points(rows))
        self.assertEqual(len(events), 1)
        self.assertEqual(report["dropped_persistent_heat_sources"], 10)
        self.assertEqual(len(land), 1)

    def test_built_up_detection_is_dropped(self):
        rows = [(5.0, 36.5, 2019, "2019-08-01", "fire", C.LC_BUILT_UP)]
        events, _, _ = build_labels(points(rows))
        self.assertEqual(len(events), 0)

    def test_many_detections_of_one_fire_count_once(self):
        rows = [(5.0, 36.5, 2019, f"2019-08-0{d}", "fire", 10) for d in (1, 2, 3)]
        events, _, _ = build_labels(points(rows))
        self.assertEqual(len(events), 1)


if __name__ == "__main__":
    unittest.main()
