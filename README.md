<h1 align="center">juvahem</h1>
<p align="center"><em>Sweden's 290 municipalities, ranked against your priorities.</em></p>
<p align="center">
  <a href="https://juvahem.se"><strong>juvahem.se</strong></a> ·
  a decision-support vertical in the <a href="https://github.com/Cortxt-io">Cortxt</a> portfolio
</p>

---

**juvahem** is a neutral, data-driven tool for one of life's heavier decisions:
*where should I live?* It ranks all 290 Swedish municipalities against your own
priorities — weights plus hard must-haves — and shows the real underlying data
behind every factor, not just a score.

It runs two modes on one engine: a **living mode** (where to settle, with an
optional dual-career sub-mode) and an **invest mode**. The raw value is always
primary; the match percentage is a secondary lens (in the spirit of the OECD
Better Life Index).

## How it works
- **Deterministic scoring engine** (`src/lib/score.js`) — weighted-sum model with
  min-max normalization, and a harmonic mean for the dual-career case. Each factor
  exposes its raw value, a 0–100 match, and its weighted contribution, so a ranking
  is always explainable.
- **Real data per factor** — a Python ETL pipeline (`etl/`) pulls from Kolada, SCB,
  JobTech, electricity prices and ResRobot into per-municipality JSON the app reads
  at build time.
- **Map + list, synced** — a choropleth normalized over the current score range,
  hover-synced with the ranked list.

## Stack
SvelteKit (Svelte 5 runes) · Tailwind · Vercel (serverless + auto-deploy) ·
Python ETL. Live on [juvahem.se](https://juvahem.se) — pushing to `main`
deploys via Vercel.

## Development
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # ranking engine tests — keep green before touching score.js
```
> On Windows, `npm run build` can fail on adapter-vercel's symlink step (EPERM);
> that's harmless — Vercel's Linux build succeeds. Verify locally with `npm test`,
> `svelte-check`, and the dev preview.

## License
[MIT](./LICENSE) © 2026 Rikard Andersson
