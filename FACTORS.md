# Juvahem — Factor Catalog

The catalog of factors that matter when choosing where to live in Sweden, and the
per-kommun data source for each. Drives the ETL and the scoring dimensions
(`src/lib/score.js`). Seeded by a verified deep-research pass (2026-06-17, 105-agent
harness, 3-vote adversarial verification — 24/25 claims confirmed).

**LIVE 2026-06-17 — 8 dimensions shipped (all free):** jobs (JobTech), total tax
(municipal+regional), energy SE1–SE4 (elprisetjustnu, point-in-polygon zone crosswalk),
schools (Kolada N15424), safety (Kolada N07540), transit (ResRobot nearby-stops),
population growth (Kolada). Plus life-situation presets (single/couple/family/retiree/
remote). Dormant: housing price + door-to-door commute time. **Update (recovered
2026-06-17):** a FREE coarse per-kommun price *index* exists via SCB "Fastighetspriser
och lagfarter" — the dormant `price` dim can be seeded without a licence (licensed
Lantmäteriet only needed for object-level transaction comps). See Tier 1.

**Principle:** build FREE/OPEN high-signal dimensions first; defer licensed; skip
no-source. Every factor is scored *against the household's profile* — the moat is
personalization, not a generic "best municipality" list. Factors apply per
life-situation: **S**=single · **DC**=dual-career couple · **F**=family w/ children ·
**R**=retiree · **RW**=remote worker.

The scoring engine already renormalizes weights over whichever dimensions have data,
so each factor below is **additive**: add the ETL block → add a `DIMENSIONS` entry →
expose a weight slider. No engine rewrite.

---

## TIER 1 — FREE/OPEN, high signal, build first (verified)

| Factor | Measures | Source (free) | Signal | Situations | Status |
|---|---|---|---|---|---|
| **Jobs (dual-career)** | open ads per occupation field × kommun | JobTech JobSearch + taxonomy | high | DC,S,RW | **LIVE** |
| **Municipal tax** | kommunalskatt % | SCB PxWeb `OE0101/Kommunalskatter2000` (also Kolada N00901) | high | all (esp DC,R) | **LIVE** |
| **Regional tax** | landstings/regionskatt % | same SCB table (county-council component) | medium | all | add |
| **Population trend** | 5/10-yr forecast change | Kolada (N02915) | high | all | **LIVE** |
| **Electricity area** | SE1–SE4 bidding zone price level | elprisetjustnu.se `/api/v1/prices/{Y}/{MM-DD}_{SEx}.json` (no auth) | **high** (≈14 vs ≈63 EUR/MWh N→S) | F,R,RW (energy cost, solar payback) | add — needs SE-zone→kommun crosswalk |
| **School results** | grades/behörighet, Skolinspektionen | Skolverket Planned Education API (CC0, daily) | high | F | add — aggregate school→kommun |
| **Safety / crime** | reported crime + NTU perceived safety | BRÅ per-kommun (crime 2017–; NTU SAE 2017–) | high | all (esp F,R) | add |
| **Transit / commute access** | nearby stops, journey time to hub | ResRobot v2.1 (Trafiklab, free key) | high (urban↔rural) | DC,F,RW | add — geo-crosswalk per kommun |
| **House price level + trend (per kommun)** | mean köpeskilling småhus + 1/5/10/20-yr change, per kommun | SCB "Fastighetspriser och lagfarter" — table **`FastprisSHRegionAr`** (kommun/län/riket) + SCB's ready "Medelpriser per kommun"-table, PxWebApi 2.0, CC0 | high | all (esp DC,R, *and* invest mode) | **LIVE (Fas C)** — `price` dim = affordability proxy (lower=better) reads `housing.price_level_tkr`, 290/290. ⚠ NOT the price *index* (`FastpiPSRegKv` is only 12 regions); trend built from raw köpeskilling. Lagfarter are län/riket only — "antal köp per kommun" used as activity signal |
| **Housing shortage** | behovsbaserad bostadsbrist per kommun | Boverket Bostadsmarknadsenkäten (BME), open data CC BY 4.0, `dataportal.se/datasets/101_3154` | high | F,S,RW (buy signal) | add — per-kommun shortage metric |

## TIER 2 — FREE/OPEN, verify endpoint then build

| Factor | Source (likely free) | Signal | Situations | Note |
|---|---|---|---|---|
| **Sun-hours / climate / temp** | SMHI STRÅNG `opendata.smhi.se/apidocs/strang` + met obs | high (N↔S) | R,F,RW | grid data → kommun centroid |
| **Broadband coverage** | PTS `statistik.pts.se` / bredbandskartan | medium-high | RW (decisive),F | source flagged "unreliable" page — find the open dataset |
| **Nature / protected-area access** | Naturvårdsverket öppna data `oppnadata.naturvardsverket.se` | medium | R,F,S | proximity/area share |
| **Healthcare / eldercare / childcare** | Kolada KKiK KPIs (service quality + availability) | medium | F,R | Kolada backbone, pick KPIs |
| **Income / education / age structure** | SCB PxWeb | medium | all | demographic context |
| **Grid fees (elnätsavgift)** | Energimarknadsinspektionen `ei.se/.../natavgifter---elnat` | medium | F,R,RW | pairs with electricity area |
| **Geoenergy / bergvärme feasibility** | SGU geoenergi data `sgu.se/.../sgus-data-for-geoenergi` | medium | F | feasibility, not a permit guarantee |

## TIER 3 — LICENSED / later

| Factor | Source | Cost | Note |
|---|---|---|---|
| **Housing transaction prices (object-level comps)** | Lantmäteriet Fastighetsprisregistret / Fastighetsprisavisering | licensed (~100–500k SEK/yr, re-verify) | object-level comps only; for a coarse **kommun-level price index** use the FREE SCB source in Tier 1 instead |
| **Real rental listings (cards)** | Qasa partner/API | TBD | for embedded cards; deep-links are free now |

## TIER 4 — NO clean per-kommun source (skip / proxy only)

- **Per-object housing listings (Hemnet/Booli)** — cannot scrape/redistribute (EU
  database right + Booli competitive clause). **Use legal deep-links only** (already
  shipped: `ListingLinks.svelte`). Price proxy: SCB/Mäklarstatistik coarse index, or
  taxeringsvärde (old, label honestly).
- **Bergvärme permits** — municipal miljöförvaltning, no uniform open per-kommun feed.
- **Per-roof solar potential** — depends on roof geometry; no clean per-kommun metric
  (electricity area + sun-hours are the kommun-level proxy).

---

## Legal constraints (standing)
- Deep-linking to a portal's public search page is lawful (EU *Svensson* C-466/12).
- Fetching/storing/showing listing data is not (EU Database Directive sui generis +
  Booli's competitive-use clause; Hemnet/Booli 403 bots). Lantmäteriet
  Fastighetsprisregistret is the licensed lawful price source.

## Verification caveats (from the research)
- Kolada **v3 only** (v2 shut down). SCB PxWebApi **v2** (CC0; 150k-cell / 30-calls-per-10s
  / ~2500-char-GET limits). Tax = quote **component** ranges, not a single total spread
  (a precise-total figure was refuted). elprisetjustnu + ResRobot are per-zone / per-stop
  → both need a **kommun geo-crosswalk**. SMHI/PTS/Naturvårdsverket/SGU/EI endpoints were
  not in the verified batch — confirm before building. Govt may reduce electricity-zone
  count in 2026 (SE1–SE4 axis risk).

## Build order (recommendation)
1. **Electricity area (SE1–SE4)** — biggest felt cost gap, free, high signal, Sweden-specific.
   One-time SE-zone→kommun crosswalk + a `cost_energy` dimension.
2. **Safety (BRÅ)** + **Schools (Skolverket)** — high signal, free, broaden to families.
3. **Regional tax**, **transit (ResRobot)**, **broadband (PTS)**, **climate (SMHI)**.
4. Life-situation presets (single/couple/family/retiree/remote) that set default weights
   over the now-rich dimension set — this is how juvahem serves "everyone", not just couples.
5. Licensed price data (Tier 3) when revenue/partnership justifies the spend.

---

## "Investera här"-läget (verified deep-research, wf_02886d5d, 2026-06-17, 23/25 claims)

A credible **invest mode** is buildable entirely on free kommun-level open data — as
**macro-screening**, not per-object return calc. Object-level KPIs (cap rate, NOI,
cash-on-cash, LTV, vacancy, GRM) need per-property data + licensed transaction prices →
**separate licensed phase-4 pro layer, NOT built here.** What works free per kommun:

| Signal | Free source | Coverage | Layman interpretation |
|---|---|---|---|
| **Price level + trend (1/5/10 yr)** | SCB `FastprisSHRegionAr` + "Medelpriser per kommun" (CC0) | all 290 | rising 5/10-yr + high activity = hot buyer's market (growth but pricey entry); flat/falling = stagnation or cheap entry |
| **Demand (pop. growth + net migration)** | Kolada (free API) / SCB PxWeb | all 290 | positive net migration + growth = rising demand; negative = stagnation risk |
| **Shortage (behovsbaserad bostadsbrist)** | Boverket "Bedömning av bostadsbrist" (DeSO→kommun) | all 290 | high shortage = strong rental demand / low vacancy risk, but regulatory risk. ⚠ verify exact licence on dataset 101_3582 before commercial publish |
| **Market state + construction** | Boverket BME `dataportal.se/101_3154` (CC BY 4.0) | all 290 | much building + deficit = upswing; much building + balance = oversupply/price-pressure risk |
| **Price/rent ratio** | rent from SCB HiB `BO0406Tab01` (kr/kvm) ÷ price/kvm | **only ≥75k-inhabitant kommuner** (sample survey ~16k flats) | high ratio = buy-expensive vs rent (good for landlords); low = buy-cheap. ⚠ flag "uncertain/unavailable" for small kommuner — don't hide |

**Ingest:** SCB part via one PxWebApi 2.0 (GET; 150k cells/call, 30 calls/10s/IP; DB
updates Mon–Fri 08:00; schedule yearly). Boverket + Kolada fetched separately.

**Build order:** Fas 1 — price trend + demography (full 290, simplest ETL, baseline
leaderboard). Fas 2 — Boverket BME + shortage. Fas 3 — price/rent ratio behind a
coverage gate (large kommuner only). Fas 4 (licensed) — object-level return KPIs.

**UX:** invest mode = separate mode on the additive engine — kommun-leaderboard on an
invest-score (weighted price-trend + migration + shortage + construction), per-kommun
scorecards with plain-text reads ("Köpmarknad: stark", "Hyresmarknad: hög efterfrågan"),
plain-text risk flags ("Hyresdata osäker — liten kommun", "Hög nyproduktion = utbudsrisk"),
and a 1/5/10-yr price chart. Full report: `.recovered-research/juvahem-invest-macro.md`.

### Open questions (carried from the research)
- Exact licence string for Boverket dataset 101_3582 (verify before commercial publish).
- How many of the 290 kommuner actually have publishable rent values in HiB BO0406Tab01.
- Invest-score weighting across signal families — fixed or user-adjustable like the main engine?
