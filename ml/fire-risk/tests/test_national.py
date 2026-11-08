"""Guards for the national pipeline: no future data leaks into a year's inputs,
and factory/flare cells never count as wildfire."""
import unittest

import numpy as np
import pandas as pd

from fire_risk.national import config as C
from fire_risk.national.features import history_rasters
from fire_risk.national.grid import points_in_polygon, shape
from fire_risk.national.labels import build_labels


def detections(rows):
    d = pd.DataFrame(rows, columns=["iy", "ix", "acq_date", "type", "confidence"])
    d["year"] = d.acq_date.str[:4].astype(int)
    d["month"] = d.acq_date.str[5:7].astype(int)
    return d


class HistoryRespectsTheGap(unittest.TestCase):
    def test_fires_after_target_minus_gap_are_invisible(self):
        years = [2020, 2021, 2022, 2023]
        E = np.zeros((4, 5, 5), np.float32)
        E[3, 2, 2] = 1  # 2023 fire
        h = history_rasters(E, years, target_year=2024)  # GAP=2 -> data up to 2022
        self.assertEqual(h["own_recent"][2, 2], 0.0)
        self.assertEqual(h["own_years"][2, 2], 0.0)

    def test_fire_at_cutoff_is_seen_and_decayed(self):
        years = [2020, 2021, 2022]
        E = np.zeros((3, 5, 5), np.float32)
        E[0, 1, 1] = 1  # 2020 fire, target 2024 -> cutoff 2022, age 2
        h = history_rasters(E, years, target_year=2024)
        self.assertAlmostEqual(float(h["own_recent"][1, 1]), C.HISTORY_DECAY ** 2, places=5)
        self.assertEqual(float(h["years_since"][1, 1]), 2 + C.GAP)


class LabelsExcludeHeatSources(unittest.TestCase):
    def test_static_and_persistent_cells_are_excluded(self):
        rows = [(0, 0, "2020-08-01", 2, 80),                       # factory flag
                (0, 0, "2020-08-02", 0, 80)]                       # same cell, veg flag
        rows += [(1, 1, f"2020-08-{d:02d}", 0, 80) for d in range(1, 12)]  # 11 days
        rows += [(2, 2, "2020-07-15", 0, 80), (2, 2, "2020-07-16", 0, 80)]  # real fire
        rows += [(3, 3, "2020-02-10", 0, 80)]                      # out of season
        E, D, excluded, years, _ = build_labels(detections(rows))
        y = years.index(2020)
        self.assertTrue(excluded[0, 0] and excluded[1, 1])
        self.assertEqual(E[y, 0, 0] + E[y, 1, 1], 0)
        self.assertEqual(E[y, 2, 2], 1)
        self.assertEqual(D[y, 2, 2], 2)
        self.assertEqual(E[y, 3, 3], 0)


class Geometry(unittest.TestCase):
    def test_point_in_square(self):
        ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
        got = points_in_polygon(np.array([0.5, 1.5]), np.array([0.5, 0.5]), ring)
        self.assertEqual(got.tolist(), [True, False])

    def test_raster_shape_matches_bbox(self):
        ny, nx = shape()
        self.assertEqual(ny, int(round((C.LAT_MAX - C.LAT_MIN) / C.CELL_DEG)))
        self.assertEqual(nx, int(round((C.LON_MAX - C.LON_MIN) / C.CELL_DEG)))


if __name__ == "__main__":
    unittest.main()
