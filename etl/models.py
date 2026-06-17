"""Canonical data model for a Swedish municipality (kommun).

This is the single source of truth for the shape of `data/communes/<kommunkod>.json`.
The ETL produces these; the read-API / scoring consumes them. Keep fields stable —
the frontend and `api/rank` depend on this contract.

Per the plan: each value carries provenance (source + fetch date) so data freshness
is visible in the UI and nothing is silently stale.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class Provenance(BaseModel):
    """Where a value came from and when it was fetched."""

    source: str  # e.g. "kolada:N00901"
    period: str | int | None = None  # the data year the value refers to
    fetched: str  # ISO date the ETL pulled it


class Metric(BaseModel):
    """A single numeric value plus its provenance."""

    value: float | None = None
    provenance: Provenance


class Economy(BaseModel):
    municipal_tax_pct: Metric | None = None  # N00901 — skattesats till kommun
    total_tax_pct: Metric | None = None  # N00900 — skattesats totalt


class Population(BaseModel):
    total: Metric | None = None  # N01951 — invånare totalt
    forecast_change_5y_pct: Metric | None = None  # N02915
    forecast_change_10y_pct: Metric | None = None  # N02838


class JobField(BaseModel):
    """Open job ads in one occupation field, for one commune (a live snapshot).

    `value` is ads per 10 000 inhabitants (per-capita → comparable across communes);
    `count` is the raw ad count. Keyed in Commune.jobs by the JobTech occupation-field
    concept id, which is what a person's `occupationCode` in the profile points to.
    """

    label: str
    value: float | None = None  # ads per 10k inhabitants
    count: int = 0  # raw open-ad count
    provenance: Provenance


class Housing(BaseModel):
    """House-price signals for the "investera här" mode (SCB Fastighetspriser och
    lagfarter, table FastprisSHRegionAr — mean köpeskilling småhus per kommun, CC0).

    These feed INVEST_DIMENSIONS in score.js. NOTE the price *index* (FastpiPSRegKv)
    is only 12 regions, not per-kommun — trend MUST be derived from the raw mean
    köpeskilling here, not the index (verified deep-research wf_02886d5d, 2026-06-17).
    """

    price_level_tkr: Metric | None = None  # mean köpeskilling småhus, tkr (entry cost)
    price_change_5y_pct: Metric | None = None  # % change vs 5 years ago (capital growth)
    price_change_10y_pct: Metric | None = None  # % change vs 10 years ago
    num_sales: Metric | None = None  # antal köp this period (market activity/liquidity)
    # price_proxy is the legacy "bo här" cheap-is-better field score.js still reads.
    price_proxy: Metric | None = None


class Commune(BaseModel):
    """One Swedish kommun. `kommunkod` is the SCB 4-digit code (string, leading zeros)."""

    kommunkod: str = Field(pattern=r"^\d{4}$")
    name: str
    economy: Economy = Field(default_factory=Economy)
    population: Population = Field(default_factory=Population)
    housing: Housing = Field(default_factory=Housing)
    # jobs keyed by JobTech occupation-field concept id.
    jobs: dict[str, JobField] = Field(default_factory=dict)
    # service / future blocks land in later ETL steps.
