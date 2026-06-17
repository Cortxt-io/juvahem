#!/usr/bin/env python3
"""Enrich commune files with the electricity-area (elområde) cost dimension.

The north-south electricity-price split (SE1/SE2 cheap, SE3/SE4 expensive) is a
large, real cost-of-living and solar-payback signal. This:
  1. Assigns each kommun to its bidding zone SE1–SE4 by point-in-polygon: the
     kommun centroid (from data/commune_boundaries.geojson) against the official
     zone polygons (etl/raw/se_zones.geojson, sourced from electricitymaps-contrib
     which mirrors the ENTSO-E/Svenska Kraftnät boundaries). Exact, not a län guess.
  2. Fetches a trailing price window per zone from elprisetjustnu.se (free, no auth)
     and averages to a representative öre/kWh level per zone.
  3. Writes commune.energy = { price_area, price_level{value,provenance} } into each
     data/communes/<kommunkod>.json, additively (other blocks untouched).

Run:  python etl/build_energy.py [trailing_days]
"""
from __future__ import annotations

import json
import sys
import urllib.request
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMMUNES = ROOT / "data" / "communes"
BOUNDARIES = ROOT / "static" / "commune_boundaries.geojson"
ZONES = Path(__file__).resolve().parent / "raw" / "se_zones.geojson"
PRICES = "https://www.elprisetjustnu.se/api/v1/prices/{y}/{md}_{zone}.json"


# ---- geometry: point-in-polygon (ray casting), handles holes + MultiPolygon ----

def _ring_contains(pt, ring):
    x, y = pt
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def _polygon_contains(pt, polygon):
    # polygon = [exterior, hole1, ...]
    if not polygon or not _ring_contains(pt, polygon[0]):
        return False
    return not any(_ring_contains(pt, hole) for hole in polygon[1:])


def geom_contains(pt, geom):
    t = geom["type"]
    if t == "Polygon":
        return _polygon_contains(pt, geom["coordinates"])
    if t == "MultiPolygon":
        return any(_polygon_contains(pt, poly) for poly in geom["coordinates"])
    return False


def _largest_ring(geom):
    """Exterior ring with the most points — a decent representative-point basis."""
    if geom["type"] == "Polygon":
        return geom["coordinates"][0]
    best = []
    for poly in geom["coordinates"]:
        if len(poly[0]) > len(best):
            best = poly[0]
    return best


def centroid(geom):
    ring = _largest_ring(geom)
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


# ---- electricity prices ----

def zone_price_ore(zone: str, days: int) -> float | None:
    """Trailing-window average spot price (öre/kWh) for one zone."""
    vals = []
    d = date.today() - timedelta(days=1)  # yesterday is the last full day
    for _ in range(days):
        url = PRICES.format(y=d.year, md=d.strftime("%m-%d"), zone=zone)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "juvahem-etl/1.0"})
            data = json.loads(urllib.request.urlopen(req, timeout=30).read())
            day_avg = sum(p["SEK_per_kWh"] for p in data) / len(data)
            vals.append(day_avg)
        except Exception:  # noqa: BLE001 — missing day, skip
            pass
        d -= timedelta(days=1)
    if not vals:
        return None
    return round(sum(vals) / len(vals) * 100, 2)  # SEK/kWh -> öre/kWh


def main() -> int:
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    zones_gj = json.loads(ZONES.read_text(encoding="utf-8"))
    zone_geoms = {f["properties"]["zone"]: f["geometry"] for f in zones_gj["features"]}
    bounds = json.loads(BOUNDARIES.read_text(encoding="utf-8"))

    # 1. zone per kommun via centroid point-in-polygon
    zone_of: dict[str, str] = {}
    for f in bounds["features"]:
        kod = f["properties"]["kommunkod"]
        c = centroid(f["geometry"])
        z = next((name for name, g in zone_geoms.items() if geom_contains(c, g)), None)
        if not z:  # centroid just outside (coast/island) → nearest zone vertex
            z = min(
                zone_geoms,
                key=lambda name: _min_vertex_dist(c, zone_geoms[name]),
            )
        zone_of[kod] = z
    dist = {z: sum(1 for v in zone_of.values() if v == z) for z in zone_geoms}
    print("kommuner per zon:", dist)

    # 2. price level per zone
    today = date.today().isoformat()
    price = {z: zone_price_ore(z, days) for z in zone_geoms}
    print("öre/kWh per zon (trailing %dd):" % days, price)

    # 3. write energy block into each commune file
    written = 0
    for path in COMMUNES.glob("*.json"):
        c = json.loads(path.read_text(encoding="utf-8"))
        z = zone_of.get(c["kommunkod"])
        if not z:
            continue
        c["energy"] = {
            "price_area": z,
            "price_level": {
                "value": price.get(z),
                "provenance": {
                    "source": "elprisetjustnu:spot;zones:electricitymaps/entsoe",
                    "period": f"trailing-{days}d",
                    "fetched": today,
                },
            },
        }
        path.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
        written += 1
    print(f"Wrote energy block into {written} commune files")
    return 0


def _min_vertex_dist(pt, geom):
    ring = _largest_ring(geom)
    return min((pt[0] - x) ** 2 + (pt[1] - y) ** 2 for x, y in ring)


if __name__ == "__main__":
    raise SystemExit(main())
