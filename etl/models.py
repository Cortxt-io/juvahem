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


class Commune(BaseModel):
    """One Swedish kommun. `kommunkod` is the SCB 4-digit code (string, leading zeros)."""

    kommunkod: str = Field(pattern=r"^\d{4}$")
    name: str
    economy: Economy = Field(default_factory=Economy)
    population: Population = Field(default_factory=Population)
    # jobs / housing / service / future blocks land in later ETL steps.
