"""Build data/grid_north_2km.csv: the national grid plus elevation per cell.

    python fetch_elevation.py
Elevation: OpenTopoData public API (SRTM 90 m), free, no key: 100 points per
request, 1 request per second, 1000 requests per day (the grid needs ~640).
Progress is cached in data/raw/elevation_cache.csv so a stopped run resumes.
(Open-Meteo's elevation API was tried first: it counts every point as a call,
so the grid exceeds its free daily quota.)
"""
import json
import time
import urllib.request

import pandas as pd

from fire_risk.national import config as C
from fire_risk.national.grid import build_grid

API = "https://api.opentopodata.org/v1/srtm90m?locations="
CACHE = C.RAW / "elevation_cache.csv"


def fetch(batch: pd.DataFrame) -> list[float | None]:
    locs = "|".join(f"{a:.4f},{b:.4f}" for a, b in zip(batch.lat, batch.lon))
    for attempt in range(6):
        try:
            req = urllib.request.Request(API + locs, headers={"User-Agent": "green-algeria-fire-risk"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return [res["elevation"] for res in json.loads(r.read())["results"]]
        except Exception as e:  # rate limit or network blip: back off and retry
            wait = 3 * (attempt + 1)
            print(f"  retry in {wait}s ({e})", flush=True)
            time.sleep(wait)
    raise RuntimeError("elevation API kept failing")


def main() -> None:
    grid = build_grid()
    C.RAW.mkdir(parents=True, exist_ok=True)
    if CACHE.exists():
        done = pd.read_csv(CACHE).dropna(subset=["elevation"])
    else:
        done = pd.DataFrame(columns=["ix", "iy", "elevation"])
    have = set(zip(done.ix, done.iy))
    todo = grid[[(a, b) not in have for a, b in zip(grid.ix, grid.iy)]]
    print(f"{len(grid)} cells, {len(todo)} to fetch", flush=True)
    for start in range(0, len(todo), 100):
        batch = todo.iloc[start:start + 100]
        rows = pd.DataFrame({"ix": batch.ix.values, "iy": batch.iy.values, "elevation": fetch(batch)})
        rows.to_csv(CACHE, mode="a", header=not CACHE.exists(), index=False)
        if start // 100 % 50 == 0:
            print(f"  {start + len(batch)}/{len(todo)}", flush=True)
        time.sleep(1.05)
    elev = pd.read_csv(CACHE).dropna(subset=["elevation"]).drop_duplicates(["ix", "iy"])
    out = grid.merge(elev, on=["ix", "iy"], how="left")
    out.to_csv(C.GRID_CSV, index=False)
    print(f"wrote {C.GRID_CSV.name}: {len(out)} cells, {out.elevation.isna().sum()} missing", flush=True)


if __name__ == "__main__":
    main()
