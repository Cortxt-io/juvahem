#!/usr/bin/env python3
"""Enrich commune files with a public-transport access score (ResRobot v2.1).

Transit access = how many public-transport stops sit near the kommun centre. Urban
kommuner have many; rural few — a high-signal "can you get around without a car"
factor. We count stops within a radius of the kommun centroid via ResRobot's
Nearby Stops endpoint (free, key-gated).

The API key is read from the RESROBOT_KEY environment variable — NEVER hard-coded or
committed. Run:
    RESROBOT_KEY=xxxx python etl/build_transit.py

Writes commune.transit.stop_count {value, provenance} into each commune file.
score.js reads c.transit.stop_count.value (higher = better access).
"""
from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from build_energy import centroid  # reuse the centroid helper

ROOT = Path(__file__).resolve().parent.parent
COMMUNES = ROOT / "data" / "communes"
BOUNDARIES = ROOT / "static" / "commune_boundaries.geojson"
NEARBY = "https://api.resrobot.se/v2.1/location.nearbystops"

KEY = os.environ.get("RESROBOT_KEY")
RADIUS_M = 4000   # stops within 4 km of the kommun centroid
MAX_NO = 200      # API cap; urban centres saturate, which is fine (capped signal)


def stop_count(lat: float, lng: float) -> int | None:
    params = {
        "originCoordLat": f"{lat:.5f}",
        "originCoordLong": f"{lng:.5f}",
        "r": RADIUS_M,
        "maxNo": MAX_NO,
        "format": "json",
        "accessId": KEY,
    }
    url = f"{NEARBY}?{urllib.parse.urlencode(params)}"
    try:
        data = json.loads(urllib.request.urlopen(url, timeout=30).read())
        stops = data.get("stopLocationOrCoordLocation") or data.get("StopLocation") or []
        return len(stops)
    except Exception as e:  # noqa: BLE001
        print(f"  ! {lat},{lng}: {e}")
        return None


def main() -> int:
    if not KEY:
        print("RESROBOT_KEY not set — aborting (export it, do not commit it).")
        return 1
    bounds = json.loads(BOUNDARIES.read_text(encoding="utf-8"))
    centroids = {
        f["properties"]["kommunkod"]: centroid(f["geometry"]) for f in bounds["features"]
    }

    today = date.today().isoformat()
    written = skipped = 0
    for i, (kod, (lng, lat)) in enumerate(sorted(centroids.items()), 1):
        path = COMMUNES / f"{kod}.json"
        if not path.exists():
            continue
        c = json.loads(path.read_text(encoding="utf-8"))
        if c.get("transit", {}).get("stop_count", {}).get("value") is not None:
            skipped += 1  # resume: already done
            continue
        n = stop_count(lat, lng)  # GeoJSON is [lng,lat]
        if n is None:
            continue
        c["transit"] = {
            "stop_count": {
                "value": n,
                "provenance": {"source": "resrobot:nearbystops", "period": today, "radius_m": RADIUS_M},
            }
        }
        path.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
        written += 1
        if i % 30 == 0:
            print(f"  resrobot: {i}/{len(centroids)} (written {written}, skipped {skipped})", flush=True)
        time.sleep(1.4)  # ~43/min, under the Bronze 45/min cap
    print(f"Done: wrote {written}, skipped {skipped} already-done", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
