# juvahem — anteckningar (flyttade ur CNS-minnet 2026-06-15)

Domänen **juvahem.se** köpt 2026-06-15 för en produktidé: hjälpa **par som vill hitta en ny plats att bo på** — välja VAR (ort) utifrån parets parametrar (jobb, kompetens, budget, hushållsstorlek) + hitta boende.

**Why:** Rikard & Amelies egen Norrbotten-flytt (deep-research: ort vald på skatt/jobb/huspriser mot deras profil; anpassningsbar struktur per boende/storlek/kompetens) är **prototypen/proof**. Skifte från privat verktyg → produkt-venture.

**Hållning:** Skilj på privata `rikard-och-amelie` (deras egna data) vs **juvahem** (produkt för par generellt). Egen Venture i CNS-portföljen (`domain: juvahem`), eget repo, egen drift.

## Stack & arkitektur (2026-06-16)
**SvelteKit (Svelte 5 runes) + adapter-vercel.** Live på juvahem.se via GitHub auto-deploy (push `main` → Vercel-build). Deploya ALDRIG via `vercel --prod` från lokal mapp — push till main är deploy-vägen.

- **`src/lib/score.js`** — deterministisk scoring-motor (WSM + min-max + harmoniskt medel för dual-career). Ramverksoberoende, testad (`npm test` → `test/rank.test.mjs`). Hjärtat — rör inte utan att testet är grönt.
- **Data i root `data/`** — `communes/<kommunkod>.json` (290), `index.json`, `occupation_fields.json`. Python-ETL (`etl/build_communes.py`, Kolada+JobTech) skriver dit; testet läser därifrån. Laddas i appen via `import.meta.glob` i `src/lib/data/communes.js`.
- **Kartdata** — `static/commune_boundaries.geojson` (290 kommungränser, ~0.8MB, kommunkod-nycklad). Byggs av `etl/build_boundaries.py` (publik källa). Choropleth-fyllning per score i `src/lib/components/Map.svelte` (MapLibre + OpenFreeMap, ingen nyckel).
- **Rutter:** `/` (landning, prerendered) · `/jamfor` (verktyget, CSR `ssr=false` — wizard → live-rankning + lista/karta-toggle) · `/kommun/[slug]` (290 prerendrade SEO-sidor, namn-slug) · `/sitemap.xml` + `/robots.txt` · `/api/{subscribe,list,rank}` (serverless; subscribe/list = Upstash KV-väntelista, portad från gamla root-`api/`).
- **Ranking:** klient-sida i `/jamfor` (instant vikt-tuning), `/api/rank` finns som tunt HTTP-endpoint för delning/mobil.
- **Vilande dimensioner:** `price`/`commute` saknar data → motorn renormaliserar bort dem; UI visar "Kommer snart". Aktiveras när ETL för bostadspris/pendling finns.
- **Env (Vercel):** `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash, väntelista), `ADMIN_TOKEN` (skyddar `/api/list`).
- **Windows-gotcha:** lokal `npm run build` faller på adapter-vercels symlänk-steg (EPERM) — Windows-only; Vercels Linux-build går igenom. Verifiera lokalt via `npm test` + att `.svelte-kit/output/prerendered/` fylls, deploya via preview.

Koncept + research: `CONCEPT.md`, `RESEARCH.md`, `UI-SPEC.md`.
