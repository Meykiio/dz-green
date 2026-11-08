"""The national 2 km grid: land cells of northern Algeria, tagged with their wilaya."""
import json

import numpy as np
import pandas as pd

from . import config as C


def points_in_polygon(x: np.ndarray, y: np.ndarray, ring: list) -> np.ndarray:
    """Vectorised even-odd ray casting for one ring."""
    poly = np.asarray(ring, float)
    inside = np.zeros(len(x), bool)
    xj, yj = poly[-1]
    for xi, yi in poly:
        crosses = ((yi > y) != (yj > y)) & (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi)
        inside ^= crosses
        xj, yj = xi, yi
    return inside


def build_grid() -> pd.DataFrame:
    """All cell centres in the bounding box that fall inside a wilaya."""
    lons = np.arange(C.LON_MIN + C.CELL_DEG / 2, C.LON_MAX, C.CELL_DEG)
    lats = np.arange(C.LAT_MIN + C.CELL_DEG / 2, C.LAT_MAX, C.CELL_DEG)
    gx, gy = np.meshgrid(lons, lats)
    ix, iy = np.meshgrid(np.arange(len(lons)), np.arange(len(lats)))
    x, y = gx.ravel(), gy.ravel()
    code = np.full(len(x), "", dtype=object)
    for f in json.loads(C.WILAYAS_GEOJSON.read_text(encoding="utf-8"))["features"]:
        geom = f["geometry"]
        polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        for poly in polys:
            ring = poly[0]
            xs, ys = np.asarray(ring)[:, 0], np.asarray(ring)[:, 1]
            box = (x >= xs.min()) & (x <= xs.max()) & (y >= ys.min()) & (y <= ys.max()) & (code == "")
            if not box.any():
                continue
            hit = np.zeros(len(x), bool)
            hit[box] = points_in_polygon(x[box], y[box], ring)
            for hole in poly[1:]:
                hit[box] &= ~points_in_polygon(x[box], y[box], hole)
            code[hit] = f["properties"]["code"]
    keep = code != ""
    return pd.DataFrame({
        "ix": ix.ravel()[keep], "iy": iy.ravel()[keep],
        "lon": np.round(x[keep], 4), "lat": np.round(y[keep], 4), "wilaya": code[keep],
    })


def cell_index(lon: np.ndarray, lat: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    return (np.floor((lon - C.LON_MIN) / C.CELL_DEG).astype(int),
            np.floor((lat - C.LAT_MIN) / C.CELL_DEG).astype(int))


def shape() -> tuple[int, int]:
    """(rows, cols) of the full bounding-box raster."""
    nx = len(np.arange(C.LON_MIN + C.CELL_DEG / 2, C.LON_MAX, C.CELL_DEG))
    ny = len(np.arange(C.LAT_MIN + C.CELL_DEG / 2, C.LAT_MAX, C.CELL_DEG))
    return ny, nx
