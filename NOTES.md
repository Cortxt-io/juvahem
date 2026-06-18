# juvahem — anteckningar

Domänen **juvahem.se** = ett **neutralt, datadrivet beslutsverktyg** som rankar Sveriges 290 kommuner mot användarens prioriteringar (vikter + måsten) och visar den riktiga datan per faktor. Egen Venture i Cortxt-portföljen (`domain: juvahem`), eget repo + egen drift. Koncept i `CONCEPT.md`, faktorkatalog i `FACTORS.md`, faser/plan i `.claude/plans/`.

> **Positionering (2026-06-18):** par-framingen är borttagen. Dual-career är *ett läge* bland flera; produkten tjänar alla som väljer var de ska bo, plus ett invest-läge. "Sveriges 290 kommuner, rankade mot dina prioriteringar."

## Stack & arkitektur
**SvelteKit (Svelte 5 runes) + adapter-vercel.** Live på juvahem.se via GitHub auto-deploy (push `main` → Vercel-build). Deploya ALDRIG via `vercel --prod` lokalt — push till main är deploy-vägen.

- **`src/lib/score.js`** — deterministisk scoring-motor (WSM + min-max + harmoniskt medel för dual-career). Två lägen, en motor: `DIMENSIONS` (bo) / `INVEST_DIMENSIONS` (invest) skickas som arg till `rankCommunes()`. Varje dimension har `category` + `unit` (för gruppering + råvärdes-rendering) och `direction`. `breakdown` bär `raw` (riktiga värdet), `factor` (0–100 träff), `contribution` (viktat bidrag), `unit`, `category`. **Hjärtat — rör inte utan att `npm test` (`test/rank.test.mjs`) är grönt.**
- **`src/lib/format.js`** — råvärdes-formattering per `unit` (svensk formatering: "31,8 %", "5 396 tkr", "11 331/100k").
- **`src/lib/presets.js`** — livssituations-snabbval (balanced/single/couple/family/retiree/remote) som sätter vikter + personantal. `DEFAULT_PRESET = null` (neutral default).
- **Data i root `data/`** — `communes/<kommunkod>.json` (290), `index.json`, `occupation_fields.json`. Python-ETL (`etl/`, Kolada+SCB+JobTech+elpris+ResRobot) skriver dit; appen läser via `import.meta.glob`.
- **Kartdata** — `static/commune_boundaries.geojson` (290 gränser, kommunkod-nycklade, format `"0138"` = matchar datan). Choropleth i `src/lib/components/Map.svelte`.

## Design (atlas-identitet, 2026-06-18)
"Statistisk atlas, levande" — `src/app.css`: svalt kart-papper + EN sekventiell score-ramp (teal→salvia→guld). Typografi: **Familjen Grotesk** (display/kommunnamn) · **Inter** (brödtext) · **Space Mono** (datalager) — laddas via `src/app.html` Google Fonts. Signatur: choropleth normaliserad över aktuellt score-spann → ledaren glöder guld + **index↔karta-hover-synk** (mörk fill + ljus halo på highlightad kommun; flytande chip surfar kommuner utanför top-20).

## Data-presentation (research-backad)
**Modell B (rankad lista med inline-råtal + expand) default + Modell C (tabell-läge) som tredje växel.** Princip: **råvärdet primärt, match-% sekundär lins** (jfr OECD Better Life Index; Numbeo = anti-mönster). `ScoreBreakdown` visar råvärde + träff + bidrag per faktor.

## Foundation (pågående — se planen)
Bygger mot ett **Profile-kontrakt** (`{ context, identity, filters, weights, meta }`) som alla ytor är vyer av: profil-först vänsterpanel, dealbreaker-filter (`applyFilters()` före rankning), rika kommun-sidor, persistens (URL/localStorage), fler kontexter, framtidsytor.

## Rutter
`/` (landning, prerendered) · `/jamfor` (verktyget, CSR `ssr=false` — profil → live-rankning, index/karta) · `/kommun/[slug]` (290 prerendrade SEO-sidor) · `/sitemap.xml` + `/robots.txt` · `/api/{subscribe,list,rank}` (serverless; subscribe/list = Upstash KV-väntelista).

## Env & gotchas
- **Env (Vercel):** `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash väntelista), `ADMIN_TOKEN` (skyddar `/api/list`), `RESROBOT_KEY` (ETL, ej i klartext).
- **Windows:** lokal `npm run build` faller på adapter-vercels symlänk-steg (EPERM) — ofarligt, Vercels Linux-build går igenom. Verifiera lokalt via `npm test` + `svelte-check` + dev-preview.
- **Dev-server på 8 GB-maskin:** kör inte tre dev-servrar samtidigt (OOM → Vite-wedge ger 500 på alla rutter). Fix: döda processen på 5173, rensa `node_modules/.vite`, starta om.
