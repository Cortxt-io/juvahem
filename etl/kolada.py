"""Kolada v3 API client.

Kolada is the free, no-agreement source for ~6000 municipal key figures (tax,
economy, service, population). Docs: https://www.kolada.se/om-oss/api/

v3 endpoints used:
  GET /v3/municipality                          -> list of municipalities/regions
  GET /v3/data/kpi/{kpi}/year/{year}            -> one KPI, all municipalities, one year

The data response nests a per-gender list; we take the total ("T") value.
"""

from __future__ import annotations

import httpx

BASE = "https://api.kolada.se/v3"

# Years tried newest-first; first year with a value per municipality wins.
YEARS = [2025, 2024, 2023, 2022]


def fetch_municipalities(client: httpx.Client) -> list[dict]:
    """Return only kommuner (type 'K') — the 290 we care about, not regions ('L')."""
    r = client.get(f"{BASE}/municipality", params={"page_size": 500})
    r.raise_for_status()
    return [m for m in r.json()["values"] if m.get("type") == "K"]


def fetch_kpi_latest(client: httpx.Client, kpi: str) -> dict[str, tuple[float, int]]:
    """Latest available value per municipality for one KPI.

    Returns { kommunkod: (value, period) }. Walks YEARS newest-first and keeps the
    first non-null total value found for each municipality.
    """
    out: dict[str, tuple[float, int]] = {}
    for year in YEARS:
        r = client.get(
            f"{BASE}/data/kpi/{kpi}/year/{year}", params={"page_size": 2000}
        )
        r.raise_for_status()
        for row in r.json().get("values", []):
            muni = row["municipality"]
            if muni in out:
                continue
            total = next(
                (v for v in row.get("values", []) if v.get("gender") == "T"), None
            )
            if total is not None and total.get("value") is not None:
                out[muni] = (float(total["value"]), row["period"])
    return out
