"""Build canonical commune artifacts from open data.

Step 1 of the ETL (per plan §10): Kolada → economy + population for all 290 kommuner.
Writes one `data/communes/<kommunkod>.json` per municipality plus a `data/index.json`
summary. Run locally or via GitHub Actions cron; commit the output (GitHub = truth).

Usage:  python etl/build_communes.py
"""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import httpx

from kolada import fetch_kpi_latest, fetch_municipalities
from models import Commune, Economy, Metric, Population, Provenance

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
COMMUNES_DIR = DATA_DIR / "communes"

# Kolada KPI ids used in step 1 (verified against the live API).
KPI = {
    "municipal_tax_pct": "N00901",  # Skattesats till kommun (%)
    "total_tax_pct": "N00900",      # Skattesats, totalt (%)
    "population_total": "N01951",   # Invånare totalt, antal
    "forecast_5y_pct": "N02915",    # Framskrivning, förändring kommande 5 år (%)
    "forecast_10y_pct": "N02838",   # Framskrivning, förändring om 10 år (%)
}


def _metric(table: dict[str, tuple[float, int]], kommunkod: str, source_kpi: str,
            today: str) -> Metric | None:
    hit = table.get(kommunkod)
    if hit is None:
        return None
    value, period = hit
    return Metric(
        value=value,
        provenance=Provenance(source=f"kolada:{source_kpi}", period=period, fetched=today),
    )


def main() -> None:
    today = dt.date.today().isoformat()
    COMMUNES_DIR.mkdir(parents=True, exist_ok=True)

    with httpx.Client(timeout=60) as client:
        municipalities = fetch_municipalities(client)
        print(f"Municipalities (type K): {len(municipalities)}")

        tables = {key: fetch_kpi_latest(client, kpi) for key, kpi in KPI.items()}
        for key, table in tables.items():
            print(f"  {key} ({KPI[key]}): {len(table)} municipalities with data")

    index = []
    for m in municipalities:
        code, name = m["id"], m["title"]
        commune = Commune(
            kommunkod=code,
            name=name,
            economy=Economy(
                municipal_tax_pct=_metric(tables["municipal_tax_pct"], code, KPI["municipal_tax_pct"], today),
                total_tax_pct=_metric(tables["total_tax_pct"], code, KPI["total_tax_pct"], today),
            ),
            population=Population(
                total=_metric(tables["population_total"], code, KPI["population_total"], today),
                forecast_change_5y_pct=_metric(tables["forecast_5y_pct"], code, KPI["forecast_5y_pct"], today),
                forecast_change_10y_pct=_metric(tables["forecast_10y_pct"], code, KPI["forecast_10y_pct"], today),
            ),
        )
        (COMMUNES_DIR / f"{code}.json").write_text(
            commune.model_dump_json(indent=2, exclude_none=True), encoding="utf-8"
        )
        index.append({
            "kommunkod": code,
            "name": name,
            "municipal_tax_pct": commune.economy.municipal_tax_pct.value if commune.economy.municipal_tax_pct else None,
            "population_total": commune.population.total.value if commune.population.total else None,
        })

    index.sort(key=lambda x: x["name"])
    (DATA_DIR / "index.json").write_text(
        json.dumps({"generated": today, "count": len(index), "communes": index},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(index)} communes to {COMMUNES_DIR} + index.json")


if __name__ == "__main__":
    main()
