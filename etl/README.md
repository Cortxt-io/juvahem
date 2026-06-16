# ETL — commune data pipeline

Builds canonical municipality artifacts from open Swedish data and commits them to
`data/` (GitHub = source of truth). Read-API / scoring consume the committed JSON.

## Run

```bash
pip install -r etl/requirements.txt
python etl/build_communes.py
```

Writes `data/communes/<kommunkod>.json` (one per kommun) + `data/index.json`.

## Sources (status)

| Source | Block | Cost | Status |
|--------|-------|------|--------|
| **Kolada** v3 | economy, population | free, no agreement | ✅ step 1 (done) |
| SCB PxWeb v2 | population/employment | free | ⏳ next |
| JobTech | jobs per occupation × kommun | free | ⏳ next |
| Skolverket | schools | free | ⏳ next |

## Model

`models.py` defines the canonical `Commune` schema (Pydantic). Every value carries
`provenance` (source + data period + fetch date) so freshness is visible in the UI.
Keep this schema stable — `api/rank` and the frontend depend on it.

## Kolada KPIs used (step 1)

- `N00901` Skattesats till kommun (%)
- `N00900` Skattesats, totalt (%)
- `N01951` Invånare totalt
- `N02915` Befolkningsframskrivning, förändring 5 år (%)
- `N02838` Befolkningsframskrivning, förändring 10 år (%)
