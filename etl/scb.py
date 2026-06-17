"""SCB PxWeb client — house-price signals per kommun for the "investera här" mode.

Source: SCB "Fastighetspriser och lagfarter", table FastprisSHRegionAr (BO0501B):
"Försålda småhus efter region, fastighetstyp, tabellinnehåll och år" — mean köpeskilling
(tkr) and number of sales per kommun, 1981–latest, CC0. Verified live 2026-06-17.

We use the raw mean köpeskilling per kommun (NOT the price index FastpiPSRegKv, which is
only 12 regions — see deep-research wf_02886d5d). Trend = % change of the mean vs 5/10y ago.

Endpoint (PxWebApi v1, stable):
  POST .../ssd/BO/BO0501/BO0501B/FastprisSHRegionAr
Variables: Region (4-digit = kommun), Fastighetstyp (220 = permanentbostad ej tomträtt),
ContentsCode (BO0501C1 = Antal köp, BO0501C2 = Köpeskilling medelvärde tkr), Tid (year).
"""

from __future__ import annotations

import re

import httpx

TABLE = "https://api.scb.se/OV0104/v1/doris/sv/ssd/BO/BO0501/BO0501B/FastprisSHRegionAr"

PERMANENT = "220"        # permanentbostad (ej tomträtt) — the relevant småhus type
C_SALES = "BO0501C1"     # Antal köp
C_PRICE = "BO0501C2"     # Köpeskilling, medelvärde i tkr

_KOMMUN_RE = re.compile(r"^\d{4}$")


def _metadata_years_and_kommuner(client: httpx.Client) -> tuple[list[str], list[str]]:
    """Return (sorted available years, 4-digit kommun region codes) from table metadata."""
    r = client.get(TABLE)
    r.raise_for_status()
    meta = r.json()
    years, kommuner = [], []
    for var in meta["variables"]:
        if var["code"] == "Tid":
            years = sorted(var["values"])
        elif var["code"] == "Region":
            kommuner = [v for v in var["values"] if _KOMMUN_RE.match(v)]
    return years, kommuner


def _pick_year(years: list[str], target: int) -> str | None:
    """Closest available year ≤ target (years is ascending strings)."""
    candidates = [y for y in years if int(y) <= target]
    return candidates[-1] if candidates else None


def fetch_housing(client: httpx.Client) -> dict[str, dict]:
    """House-price signals per kommun: latest price level + 5/10-yr % change + sales.

    Returns { kommunkod: {price_level_tkr, num_sales, change_5y_pct, change_10y_pct,
    period} }. Missing cells (".") are tolerated — a kommun with no latest price is
    omitted; a kommun with a latest but no 5/10y baseline gets None for that change.
    """
    years, kommuner = _metadata_years_and_kommuner(client)
    if not years or not kommuner:
        return {}
    latest = years[-1]
    y5 = _pick_year(years, int(latest) - 5)
    y10 = _pick_year(years, int(latest) - 10)
    wanted_years = sorted({latest, y5, y10} - {None})

    query = {
        "query": [
            {"code": "Region", "selection": {"filter": "item", "values": kommuner}},
            {"code": "Fastighetstyp", "selection": {"filter": "item", "values": [PERMANENT]}},
            {"code": "ContentsCode", "selection": {"filter": "item", "values": [C_SALES, C_PRICE]}},
            {"code": "Tid", "selection": {"filter": "item", "values": wanted_years}},
        ],
        "response": {"format": "json"},
    }
    r = client.post(TABLE, json=query)
    r.raise_for_status()
    payload = r.json()

    # data rows: key = [Region, Fastighetstyp, Tid], values = [Antal, Köpeskilling].
    # Index price + sales per (kommun, year).
    price: dict[str, dict[str, float]] = {}
    sales: dict[str, dict[str, float]] = {}
    for row in payload["data"]:
        code, _typ, year = row["key"]
        sale_v, price_v = row["values"]  # order matches ContentsCode request
        if _num(sale_v) is not None:
            sales.setdefault(code, {})[year] = _num(sale_v)
        if _num(price_v) is not None:
            price.setdefault(code, {})[year] = _num(price_v)

    out: dict[str, dict] = {}
    for code, by_year in price.items():
        latest_price = by_year.get(latest)
        if latest_price is None:
            continue  # no current price → skip; renormalizes away in scoring
        out[code] = {
            "price_level_tkr": latest_price,
            "num_sales": sales.get(code, {}).get(latest),
            "change_5y_pct": _pct_change(by_year.get(y5), latest_price),
            "change_10y_pct": _pct_change(by_year.get(y10), latest_price),
            "period": int(latest),
        }
    return out


def _num(v) -> float | None:
    """PxWeb uses '.', '..' or '' for missing cells."""
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _pct_change(old: float | None, new: float | None) -> float | None:
    if old is None or new is None or old == 0:
        return None
    return round((new - old) / old * 100, 1)
