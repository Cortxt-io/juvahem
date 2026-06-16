# Juvahem — web dashboard UI spec

How the juvahem web product is laid out. Based on sourced UX research (4 tracks:
layout, profile input, score presentation, SvelteKit/SEO architecture). Own standalone
SvelteKit UI in this repo — **not** the cortxt dashboard, not the TUI.

## Core decisions (TL;DR)

| Question | Decision |
|----------|----------|
| Primary results view | Ranked list/table primary; map as a synced **toggle**, not split-screen |
| Profile input | **Wizard** (4–5 themed steps), not one long form, not chat |
| Two-person input | Side-by-side columns (one row per attribute) + "copy from Person 1" |
| Weight input | **Sliders normalized to 100%** (constant-sum behaviour, slider simplicity); AHP rejected |
| Total score | **0–100 number + rank ("Plats 7 av 290")**, not letter grades |
| Breakdown | **Horizontal contribution bars** per factor — never radar/spider charts |
| Explainability | Auto sentence "Strong on X and Y, weaker on Z" (relative to commune mean) |
| Sensitivity | Weight sliders re-rank **live**; animate rank movement (feature, not hidden) |
| Freshness | Show **reference period + source name** per datapoint (tooltip), not "fetched at" |
| Rendering | Prerender 290 `/kommun/[slug]` pages (SSG); CSR dashboard; serverless `/api/rank` |
| Map | MapLibre GL + **OpenFreeMap** tiles (free, no key, browser-only); no Google Maps |
| Data load | `import` at build time (`import.meta.glob`), data under `src/lib/data/` |

## 1. Results page layout

Hybrid: faceted filter sidebar + ranked table, map as toggle, separate compare view.
Rationale: the decision is a composite *score* (match vs profile), not "where on the map" —
so a Zillow-style map-dominant layout hides the dimensions that actually decide. Nomad List
is the closest analogue but assumes the user already knows what matters → start with a guided
profile wizard, not a naked spreadsheet.

```
DESKTOP
+----------------+---------------------------------------------+
| FILTER SIDEBAR | [Sort: Match score v]    [List | Map]       |
| (faceted)      |  Active: (Price<X)(Commute<30min) x         |
| Price/housing^ +---------------------------------------------+
|  [==slider]    | # Kommun       Match  Price Comm. Tax  Jobs |  <- sticky header
| Commute      ^ | 1 Kommun A      92    B+   A-    B    A     |     numbers right-aligned
|  [==slider]    | 2 Kommun B      88    A    B     B+   A-    |     score badge per cell
| Tax          ^ | 3 Kommun C      85    B    A-    A    B     |
| Jobs         v |   [ ] compare   rows selectable            |
| + Advanced     |  (default sort = match score descending)   |
+----------------+---------------------------------------------+
                 | [Compare selected (3)] -> side-by-side, max 5|
```

```
MOBILE
+-----------------------------+
| Juvahem      [List | Map]   |  <- toggle, never split
| (Price<X)(Commute<30) ...x  |  <- active filter chips
+-----------------------------+
| 1  Kommun A          92  >  |  <- score first + 2 key metrics
| 2  Kommun B          88  >  |
+-----------------------------+
| [ Filter ]      [ Sort ]    |  <- sticky bottom -> bottom sheet
+-----------------------------+
```

Principles: match score = default sort + first column; numbers right-aligned; sticky header;
progressive disclosure (4 primary facets expanded, rest under "Advanced"); map is a toggle;
compare mode capped at 5 communes.

## 2. Profile input wizard

Multi-step converts ~3x better than one long form for 10–15 fields (Zuko/Formstack). Chat
handles paired two-person input + live results poorly. Steps:

0. **Intro / expectation** — "Find your best commune in ~2 min. You'll need: your jobs,
   rough salaries, max commute." (NN/g transparency principle.)
1. **Household** (shared) — budget/housing cost, household type/children. Smart defaults.
2. **The two people** — Person A | Person B columns, one row per attribute (job, ~salary,
   max commute). "Copy from Person 1" button between columns. Mobile: stacked.
3. **What matters** — 4 sliders (Jobs, Tax, Price, Commute), default 25/25/25/25,
   internally normalized to 100%. "Advanced": exact point split, per-person weights.
4. **Results + live tuning** — ranked list shown; the weight sliders persist in a side
   panel so the list re-ranks live as you drag. Async recompute, slider never freezes.

Weight mechanism: normalized sliders as primary (comprehensible + forces trade-off via
internal constant-sum, weights ≈ AHP without the friction). Constant-sum point field as
advanced option. AHP/pairwise **not** exposed to laypeople.

## 3. Score presentation & explainability

- **Total:** big 0–100 number + "Plats N av 290" + short verbal label. 0–100 reads
  universally and preserves differences between near-tied communes; letter grades (Niche
  A–F) compress and hide ranking gaps — derived from a 0–100 base anyway.
- **Breakdown:** 5 horizontal bars (one per factor) showing factor score + its *weighted
  contribution* to the total. Click expands source + reference date. **Avoid radar charts**
  — arbitrary axis order changes the shape, area distortion, can't compare two communes
  exactly (Observable, Gorelik).
- **Explanation:** auto sentence "Strong on jobs and service, weaker on price", derived
  from deviation vs the commune's mean score (not fixed thresholds — stay consistent as
  data changes, à la Niche z-scores).
- **Sensitivity:** OECD Better Life Index pattern — sliders re-rank live; animate the
  commune's rank shift so sensitivity is a feature ("value commute more → X overtakes Y").
  Note: small weight changes can cause large rank jumps in composite indices — surface it,
  don't hide it.
- **Freshness:** show the *reference period of the data* + named source (SCB, Skatteverket,
  Arbetsförmedlingen) per factor in a tooltip — not the build/fetch time, and not a global
  banner.

## 4. SvelteKit architecture

```
src/
  lib/
    data/communes/*.json     # committed data, imported at BUILD
    data/communes.js         # loader: import.meta.glob over *.json
    components/
      Map.svelte             # MapLibre, browser-only (onMount / ssr=false)
      CompareTable.svelte
  routes/
    +page.svelte             # landing — prerender = true
    kommun/[slug]/
      +page.server.js        # prerender = true + entries() -> 290 slugs
      +page.svelte           # SEO detail page (unique data + canonical)
    jamfor/
      +page.js               # ssr = false (client-heavy dashboard)
      +page.svelte           # interactive compare + <Map>
    api/rank/+server.js      # serverless function (no prerender)
    sitemap.xml/+server.js   # prerender = true
    robots.txt/+server.js    # prerender = true
svelte.config.js             # @sveltejs/adapter-vercel
```

| Page type | Strategy | Why |
|-----------|----------|-----|
| `/` | Prerender (SSG) | static, fast, SEO |
| `/kommun/[slug]` ×290 | Prerender via `entries()` | best SEO, zero runtime cost |
| `/jamfor` dashboard | CSR (`ssr=false`) static shell | client-heavy interactivity + map |
| `/api/rank` | Serverless (adapter-vercel) | on-demand ranking |
| `/sitemap.xml`, `/robots.txt` | Prerender | static SEO artifacts |

**Programmatic SEO (290 commune pages):** no real "duplicate content penalty", but
too-similar pages get filtered out of the index. Each page must carry genuinely unique
per-commune data (tax, jobs, population trend, map position, ranking) — not just the name
swapped into a template. Internal-link neighbouring communes/region; generate `sitemap.xml`;
use canonical tags.

**Map:** MapLibre GL JS + OpenFreeMap (`style: tiles.openfreemap.org/styles/liberty`) — free,
no API key. WebGL/`window` → load only in `onMount` or set `ssr=false`. Evaluate a fallback
tile host before commercial launch (OpenFreeMap is community-funded, no SLA).

## Open items / to verify before build

- `import.meta.glob` build-time impact for 290 files (measure build duration).
- `svelte-maplibre` SSR safety — or write a thin own `<Map>` (safer).
- OpenFreeMap production reliability → fallback plan (MapTiler/Protomaps/self-host).
- Deep-dive Hemnet/Booli live UI and exact Niche/AreaVibes weights (sources gave methodology,
  not the live layouts; Niche returned HTTP 403).
- No Swedish reference examples reviewed; all evidence is US/UK — validate with own testing.
