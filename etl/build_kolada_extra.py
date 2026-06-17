#!/usr/bin/env python3
"""Enrich commune files with extra Kolada KPIs: safety (crime) and schools.

Reuses the existing Kolada v3 client (free, no agreement). Adds two dimensions the
ranking was missing, additively into each data/communes/<kommunkod>.json:

  safety.reported_crime_per_100k  <- Kolada N07540 "Anmälda brott totalt, /100 000 inv"
  schools.eligibility_pct         <- Kolada N15424 "Elever i åk 9 behöriga till
                                      yrkesprogram, lägeskommun, andel (%)"

score.js reads c.safety.reported_crime_per_100k.value (lower=better) and
c.schools.eligibility_pct.value (higher=better).

Run:  python etl/build_kolada_extra.py
"""
from __future__ import annotations

import json
from pathlib import Path

import httpx

from kolada import fetch_kpi_latest

ROOT = Path(__file__).resolve().parent.parent
COMMUNES = ROOT / "data" / "communes"

KPIS = {
    "crime": "N07540",   # anmälda brott totalt, antal/100 000 inv
    "school": "N15424",  # åk 9 behöriga till yrkesprogram, andel (%)
}


def main() -> int:
    with httpx.Client(timeout=60) as client:
        crime = fetch_kpi_latest(client, KPIS["crime"])
        school = fetch_kpi_latest(client, KPIS["school"])
    print(f"crime values: {len(crime)} · school values: {len(school)}")

    written = 0
    for path in COMMUNES.glob("*.json"):
        c = json.loads(path.read_text(encoding="utf-8"))
        kod = c["kommunkod"]
        if kod in crime:
            val, period = crime[kod]
            c["safety"] = {
                "reported_crime_per_100k": {
                    "value": val,
                    "provenance": {"source": f"kolada:{KPIS['crime']}", "period": period},
                }
            }
        if kod in school:
            val, period = school[kod]
            c["schools"] = {
                "eligibility_pct": {
                    "value": val,
                    "provenance": {"source": f"kolada:{KPIS['school']}", "period": period},
                }
            }
        path.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
        written += 1
    print(f"Enriched {written} commune files (safety + schools)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
