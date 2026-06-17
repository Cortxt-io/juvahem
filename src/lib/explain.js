// Interpretation layer (Fas 1.5) — turns the engine's numeric breakdown into
// human-readable verdicts, strengths/weaknesses and risk flags. It does NOT score:
// it reads the normalized 0–1 factors score.js already produced (rankCommunes →
// breakdown[].factor, 0–100) plus a few raw values for risk thresholds.
//
// Deterministic + threshold-based (no ML/generative). All thresholds live in config
// below so they're tunable in one place. Mode-agnostic: works for both "bo" and
// "invest" dimension sets, and is reusable from UI, dashboard and report/export.

/** Normalized-factor thresholds (the breakdown factor is 0–100; we compare /100). */
export const THRESHOLDS = { strong: 0.66, weak: 0.33 };

/**
 * Per-dimension phrasing. `strong`/`weak` are shown when a dimension's normalized
 * factor clears THRESHOLDS. Keyed by dimension key (both bo + invest modes).
 */
export const DIM_TEXT = {
  // --- "bo här" dimensions ---
  jobs: { strong: 'Goda jobbmöjligheter för er typ av jobb', weak: 'Begränsade jobbmöjligheter inom era områden' },
  tax: { strong: 'Låg kommunal-/regionskatt', weak: 'Hög skatt jämfört med andra kommuner' },
  growth: { strong: 'Växande befolkning', weak: 'Vikande befolkning' },
  energy: { strong: 'Låg elkostnad (elområde)', weak: 'Hög elkostnad (elområde)' },
  schools: { strong: 'Starka skolresultat', weak: 'Svaga skolresultat' },
  safety: { strong: 'Trygg kommun – få anmälda brott', weak: 'Mer brott än de flesta kommuner' },
  transit: { strong: 'Bra kollektivtrafik och pendling', weak: 'Svag kollektivtrafik – bilberoende vardag' },
  price: { strong: 'Lågt bostadspris', weak: 'Högt bostadspris' },
  commute: { strong: 'Kort pendling', weak: 'Lång pendling' },
  // --- "investera här" dimensions ---
  price_trend: { strong: 'Stark prisutveckling de senaste åren', weak: 'Svag prisutveckling' },
  price_entry: { strong: 'Lågt insteg (billigt att köpa)', weak: 'Högt insteg (dyrt att köpa)' },
  demand: { strong: 'Stigande efterfrågan (växande befolkning)', weak: 'Vikande efterfrågan' },
  activity: { strong: 'Aktiv, likvid marknad', weak: 'Tunn marknad – få köp' }
};

/**
 * Risk flags fire on RAW values (not the normalized factor), because a risk is about
 * an absolute condition, not a relative ranking. Each rule reads the commune directly.
 * type drives the UI icon; keep 0–3 most relevant.
 */
export const RISK_RULES = [
  {
    type: 'population',
    test: (c) => num(c.population?.forecast_change_5y_pct?.value) !== null
      && num(c.population?.forecast_change_5y_pct?.value) <= -3,
    label: 'Snabbt krympande befolkning',
    description: 'Befolkningen väntas minska tydligt – risk för försämrad service och svagare bostadsmarknad över tid.'
  },
  {
    type: 'safety',
    test: (c) => num(c.safety?.reported_crime_per_100k?.value) !== null
      && num(c.safety?.reported_crime_per_100k?.value) >= 13000,
    label: 'Hög brottsnivå',
    description: 'Fler anmälda brott per invånare än i de flesta kommuner.'
  },
  {
    type: 'price_fall',
    test: (c) => num(c.housing?.price_change_5y_pct?.value) !== null
      && num(c.housing?.price_change_5y_pct?.value) <= -5,
    label: 'Fallande bostadspriser',
    description: 'Bostadspriserna har sjunkit de senaste fem åren – kapitalrisk vid köp.'
  },
  {
    type: 'thin_market',
    test: (c) => num(c.housing?.num_sales?.value) !== null
      && num(c.housing?.num_sales?.value) < 30,
    label: 'Tunn bostadsmarknad',
    description: 'Få försäljningar per år – svårt att tajma köp och sälj, och osäkra prisuppgifter.'
  }
];

/**
 * Build an interpretation for one ranked commune.
 *
 * @param {{breakdown?: {key:string,label:string,factor:number}[]}} entry  a rankCommunes() result
 * @param {object} commune  the canonical commune (for raw-value risk flags)
 * @returns {{summary:string, highlights:string[], riskFlags:{type,label,description}[], beta:boolean}}
 */
export function explain(entry, commune = {}) {
  const breakdown = entry?.breakdown ?? [];
  const strengths = [];
  const weaknesses = [];

  for (const b of breakdown) {
    const text = DIM_TEXT[b.key];
    if (!text) continue;
    const f = (b.factor ?? 0) / 100;
    if (f >= THRESHOLDS.strong) strengths.push({ key: b.key, f, text: text.strong });
    else if (f <= THRESHOLDS.weak) weaknesses.push({ key: b.key, f, text: text.weak });
  }

  strengths.sort((a, b) => b.f - a.f); // best first
  weaknesses.sort((a, b) => a.f - b.f); // worst first

  const riskFlags = RISK_RULES.filter((r) => {
    try { return r.test(commune); } catch { return false; }
  }).slice(0, 3).map(({ type, label, description }) => ({ type, label, description }));

  // 2–4 highlights: lead with the strongest strengths, then the worst weakness.
  const highlights = [
    ...strengths.slice(0, 3).map((s) => s.text),
    ...weaknesses.slice(0, 1).map((w) => w.text)
  ].slice(0, 4);

  return {
    summary: buildSummary(strengths, weaknesses),
    highlights,
    riskFlags,
    beta: true
  };
}

/** One-line verdict from the top strength + top weakness. Empty if nothing crosses a threshold. */
function buildSummary(strengths, weaknesses) {
  const top = strengths[0]?.text;
  const low = weaknesses[0]?.text;
  if (top && low) return `Stark på ${lower(top)}, men ${lower(low)}.`;
  if (top) return `Stark på ${lower(top)}.`;
  if (low) return `Svag punkt: ${lower(low)}.`;
  return ''; // no clear signal → UI falls back to the numeric breakdown
}

function lower(s) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
