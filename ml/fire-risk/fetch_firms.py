"""Download NASA FIRMS MODIS yearly fire detections for Algeria (public, no key).

    python fetch_firms.py            # 2001..2026 into data/raw/firms_modis/
Source: https://firms.modaps.eosdis.nasa.gov/data/country/ (MODIS C6.1, 1 km).
Files are cached; rerun only fetches missing years.
"""
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent / "data" / "raw" / "firms_modis"
URL = "https://firms.modaps.eosdis.nasa.gov/data/country/modis/{y}/modis_{y}_Algeria.csv"


def main(first: int = 2001, last: int = 2026) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for year in range(first, last + 1):
        dest = OUT / f"modis_{year}_Algeria.csv"
        if dest.exists() and dest.stat().st_size > 0:
            continue
        try:
            req = urllib.request.Request(URL.format(y=year), headers={"User-Agent": "green-algeria-fire-risk"})
            with urllib.request.urlopen(req, timeout=120) as r:
                dest.write_bytes(r.read())
            print(f"{year}: {dest.stat().st_size // 1024} KB")
        except Exception as e:  # a missing year (e.g. the current one) is not fatal
            print(f"{year}: not available ({e})")


if __name__ == "__main__":
    main(*map(int, sys.argv[1:3]))
