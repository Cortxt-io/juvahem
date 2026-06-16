#!/usr/bin/env python3
"""Build static/commune_boundaries.geojson — municipality polygons for the choropleth map.

The commune data files (data/communes/*.json) carry no geometry, so the map needs a
separate boundary GeoJSON keyed by `kommunkod`. This downloads a public Swedish
municipality boundary set, normalizes each feature's properties to a 4-digit
`kommunkod` + `name`, and writes it where the SvelteKit Map component fetches it.

Usage:
    python etl/build_boundaries.py [SOURCE_URL_OR_PATH]

SOURCE can be a URL or a local file. If omitted, the candidates below are tried in
order. Any GeoJSON of Sweden's 290 kommuner works as long as each feature has a
municipality code property (we probe common names: kommunkod, kom_kod, ref:scb,
KnKod, id, code).

Keep it lean (stdlib only). If the chosen source is large, simplify it once with
mapshaper (`mapshaper in.geojson -simplify 15% -o out.geojson`) before committing.
"""
import json
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "static" / "commune_boundaries.geojson"

# Public candidates (first that resolves with 290-ish features wins). Swap freely.
CANDIDATES = [
    "https://raw.githubusercontent.com/okfse/sweden-geojson/master/swedish_municipalities.geojson",
    "https://raw.githubusercontent.com/perliedman/svenska-landskap/master/geojson/kommuner.geojson",
]

CODE_KEYS = ["kommunkod", "kom_kod", "KnKod", "ref:scb", "id", "code", "kommun_kod", "lan_kod"]
NAME_KEYS = ["name", "namn", "kom_namn", "KnNamn", "kommun", "NAME_2"]


def first_key(props, keys):
    for k in keys:
        if k in props and props[k] not in (None, ""):
            return props[k]
    return None


def fetch(src):
    if src.startswith("http"):
        with urllib.request.urlopen(src, timeout=60) as r:
            return json.load(r)
    return json.loads(Path(src).read_text(encoding="utf-8"))


def normalize(gj):
    feats = gj.get("features", [])
    out = []
    for f in feats:
        props = f.get("properties", {}) or {}
        code = first_key(props, CODE_KEYS)
        name = first_key(props, NAME_KEYS)
        if code is None:
            continue
        code = str(code).split(".")[0].zfill(4)  # 4-digit kommunkod
        out.append({
            "type": "Feature",
            "geometry": f.get("geometry"),
            "properties": {"kommunkod": code, "name": name or code},
        })
    return {"type": "FeatureCollection", "features": out}


def main():
    sources = [sys.argv[1]] if len(sys.argv) > 1 else CANDIDATES
    last_err = None
    for src in sources:
        try:
            print(f"Fetching {src} …")
            gj = fetch(src)
            norm = normalize(gj)
            n = len(norm["features"])
            if n < 200:
                print(f"  only {n} features with a code — skipping")
                continue
            OUT.parent.mkdir(parents=True, exist_ok=True)
            OUT.write_text(json.dumps(norm), encoding="utf-8")
            size_mb = OUT.stat().st_size / 1e6
            print(f"Wrote {OUT} — {n} kommuner, {size_mb:.1f} MB")
            if size_mb > 3:
                print("  NOTE: >3MB — simplify with mapshaper before committing (8GB-friendly first paint).")
            return 0
        except Exception as e:  # noqa: BLE001
            last_err = e
            print(f"  failed: {e}")
    print(f"No source worked. Last error: {last_err}", file=sys.stderr)
    print("Pass a URL or local file: python etl/build_boundaries.py <source>", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
