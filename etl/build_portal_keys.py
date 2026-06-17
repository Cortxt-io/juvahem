#!/usr/bin/env python3
"""Build data/portal_keys.json — per-kommun keys for deep-linking to real listings.

The ranking tool shows abstract scores; this lets each commune deep-link to REAL
listings on the portals that host them (legal under EU Svensson — linking to a
public search page is allowed; scraping/showing their data is not). We never fetch
or store listing content — only generate stable search URLs.

Per kommun we produce:
  - hemnet_slug:  "<official-name>-kommun" for https://www.hemnet.se/till-salu/<type>/<slug>
                  The official name carries the genitive -s for consonant-ending
                  names (Helsingborg -> Helsingborgs) but not vowel-ending ones
                  (Ale -> Ale). Verified empirically against Hemnet (404 = wrong slug;
                  200/403 = valid). See genitive() below.
  - qasa_area:    "<official-name> kommun" -> Qasa searchAreas=<name>_kommun~~se (rentals)
  - jobtech_municipality_id: JobTech taxonomy concept id, for Platsbanken job deep-links.

Run:  python etl/build_portal_keys.py
Outputs: data/portal_keys.json (290 rows).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import httpx

from jobtech import fetch_municipality_map

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "data" / "index.json"
OUT = ROOT / "data" / "portal_keys.json"

VOWELS = "aeiouyåäö"

# Genitive exceptions (official name differs from the vowel/consonant rule).
# Empirically none found in the 290 so far; add "<name>": "<genitive>" if a Hemnet
# 404 surfaces one.
GENITIVE_EXCEPTIONS: dict[str, str] = {}


def genitive(name: str) -> str:
    """Official Swedish 'X kommun' genitive form of a municipality name.

    Consonant-ending names take -s (Helsingborg->Helsingborgs, Lund->Lunds);
    vowel-ending or already-s/x/z names are unchanged (Ale, Umeå, Borås).
    """
    if name in GENITIVE_EXCEPTIONS:
        return GENITIVE_EXCEPTIONS[name]
    last = name[-1].lower()
    if last in "sxz" or last in VOWELS:
        return name
    return name + "s"


def slugify(s: str) -> str:
    s = s.lower().replace("å", "a").replace("ä", "a").replace("ö", "o").replace("é", "e")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def main() -> int:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    communes = index["communes"]

    # JobTech municipality concept ids (best-effort; omitted if the API is down).
    muni_ids: dict[str, str] = {}
    try:
        with httpx.Client(timeout=30) as client:
            muni_ids = {k: v["id"] for k, v in fetch_municipality_map(client).items()}
        print(f"JobTech municipality ids: {len(muni_ids)}")
    except Exception as e:  # noqa: BLE001
        print(f"! JobTech taxonomy unavailable, omitting job ids: {e}")

    out: dict[str, dict] = {}
    for c in communes:
        kod = c["kommunkod"]
        name = c["name"]
        gen = genitive(name)
        out[kod] = {
            "name": name,
            "hemnet_slug": f"{slugify(gen)}-kommun",
            "qasa_area": f"{gen} kommun",
            "jobtech_municipality_id": muni_ids.get(kod),
        }

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    missing_jobs = sum(1 for v in out.values() if not v["jobtech_municipality_id"])
    print(f"Wrote {OUT} — {len(out)} kommuner ({missing_jobs} without jobtech id)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
