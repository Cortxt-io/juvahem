// Deterministic commune scoring engine (the core — no LLM, per plan §4/§5).
//
// Weighted Sum Model (WSM) over min-max-normalized dimensions. Transparent and
// explainable: every commune gets a 0–100 score, a rank, and a per-dimension
// breakdown showing each factor's weighted contribution.
//
// Dual-career is the differentiator: the jobs dimension combines both persons via
// HARMONIC MEAN, which punishes communes that work for only one of them. A commune
// great for person A but useless for person B scores low — by design.
//
// Framework-agnostic: imported by routes/api/rank and usable from a node test.

/**
 * @typedef {Object} Dimension
 * @property {string} key
 * @property {string} label
 * @property {'higher'|'lower'} direction  // is a higher raw value better or worse?
 * @property {(commune:object, profile:object) => (number|null)} extract
 */

/** Harmonic mean — used so BOTH persons must be satisfied (low if either is low). */
export function harmonicMean(values) {
  const v = values.filter((x) => typeof x === "number" && x > 0);
  if (v.length === 0) return null;
  return v.length / v.reduce((s, x) => s + 1 / x, 0);
}

/**
 * The scoring dimensions. Each extracts a raw value from a commune (+ the profile,
 * for things like commute or job-fit). Dimensions whose data isn't loaded yet simply
 * return null and are skipped — weights renormalize over what's available.
 *
 * Order here is the display order of the breakdown bars.
 */
export const DIMENSIONS = [
  {
    key: "jobs",
    label: "Jobb (båda)",
    category: "Jobb",
    unit: "index",
    direction: "higher",
    // Dual-career: harmonic mean of each person's job-fit for this commune.
    // job-fit is filled in once JobTech data lands; null until then.
    extract: (c, profile) => {
      const persons = profile?.persons ?? [];
      const fits = persons.map((p) => c.jobs?.[p?.occupationCode]?.value ?? null);
      return harmonicMean(fits);
    },
  },
  {
    key: "tax",
    label: "Skatt (kommun + region)",
    category: "Ekonomi",
    unit: "pct",
    direction: "lower",
    // Total local tax = what residents actually pay (municipal + regional). Falls
    // back to municipal-only if total is missing. Wide spread → high signal.
    extract: (c) =>
      c.economy?.total_tax_pct?.value ?? c.economy?.municipal_tax_pct?.value ?? null,
  },
  {
    key: "growth",
    label: "Befolkningstrend",
    category: "Tillväxt",
    unit: "pct_signed",
    direction: "higher",
    extract: (c) => c.population?.forecast_change_5y_pct?.value ?? null,
  },
  {
    key: "energy",
    label: "Elkostnad",
    category: "Miljö & energi",
    unit: "orekwh",
    direction: "lower", // lower öre/kWh (electricity area SE1–SE4) is better
    extract: (c) => c.energy?.price_level?.value ?? null,
  },
  {
    key: "schools",
    label: "Skola (behörighet)",
    category: "Familj & service",
    unit: "pct",
    direction: "higher", // % of year-9 pupils eligible for upper secondary
    extract: (c) => c.schools?.eligibility_pct?.value ?? null,
  },
  {
    key: "safety",
    label: "Trygghet (få brott)",
    category: "Trygghet",
    unit: "per100k",
    direction: "lower", // reported crimes per 100k — fewer is better
    extract: (c) => c.safety?.reported_crime_per_100k?.value ?? null,
  },
  {
    key: "transit",
    label: "Kollektivtrafik",
    category: "Pendling",
    unit: "stops",
    direction: "higher", // public-transport stops near the kommun centre
    extract: (c) => c.transit?.stop_count?.value ?? null,
  },
  {
    key: "price",
    label: "Bostadspris (köpkraft)",
    category: "Ekonomi",
    unit: "tkr",
    direction: "lower", // lower mean köpeskilling = more affordable = better score
    // Coarse per-kommun affordability proxy: mean köpeskilling for småhus from SCB
    // (housing.price_level_tkr, see etl/scb.py). NOT an object-level valuation.
    extract: (c) => c.housing?.price_level_tkr?.value ?? c.housing?.price_proxy?.value ?? null,
  },
  {
    key: "commute",
    label: "Pendling",
    category: "Pendling",
    unit: "min",
    direction: "lower",
    // On-demand (ResRobot); filled per request. null until computed.
    extract: (c, profile) => c.commute?.[profile?.commuteKey]?.value ?? null,
  },
];

/**
 * "Investera här"-läget — the SAME engine, a different lens. Macro-screening on
 * free kommun-level open data (verified deep-research wf_02886d5d, 2026-06-17):
 * price level + trend (SCB FastprisSHRegionAr), demand (population forecast), and
 * sales activity. Object-level return KPIs (cap rate, NOI, cash-on-cash) need
 * per-property + licensed data → a separate phase-4 pro layer, not modelled here.
 *
 * Pass this as the `dimensions` arg to rankCommunes() to rank for investing instead
 * of living. price_trend and price_entry intentionally pull opposite ways (a hot
 * market has high growth AND high price) — the investor's weights resolve the tension.
 */
export const INVEST_DIMENSIONS = [
  {
    key: "price_trend",
    label: "Prisutveckling 5 år",
    category: "Investering",
    unit: "pct_signed",
    direction: "higher", // rising prices = capital growth
    extract: (c) => c.housing?.price_change_5y_pct?.value ?? null,
  },
  {
    key: "price_entry",
    label: "Insteg (lågt pris)",
    category: "Investering",
    unit: "tkr",
    direction: "lower", // cheaper entry = lower capital needed
    extract: (c) => c.housing?.price_level_tkr?.value ?? null,
  },
  {
    key: "demand",
    label: "Efterfrågan (befolkning)",
    category: "Investering",
    unit: "pct_signed",
    direction: "higher", // population growth = rising demand
    extract: (c) => c.population?.forecast_change_5y_pct?.value ?? null,
  },
  {
    key: "activity",
    label: "Marknadsaktivitet (antal köp)",
    category: "Investering",
    unit: "sales",
    direction: "higher", // more sales = a liquid, active market
    extract: (c) => c.housing?.num_sales?.value ?? null,
  },
];

/**
 * Plain-text verdict tags for a commune in invest mode — the research's "risk-flaggor
 * i klartext" (wf_02886d5d). Turns the raw signals into layman reads a non-pro
 * investor understands. tone: 'good' | 'warn' | 'neutral'. Returns [] if no data.
 */
export function investVerdict(commune) {
  const tags = [];
  const trend = commune?.housing?.price_change_5y_pct?.value;
  const demand = commune?.population?.forecast_change_5y_pct?.value;
  const level = commune?.housing?.price_level_tkr?.value;
  const sales = commune?.housing?.num_sales?.value;

  if (typeof trend === "number") {
    if (trend >= 30) tags.push({ label: `Het köpmarknad (+${trend}% 5 år)`, tone: "good" });
    else if (trend >= 5) tags.push({ label: `Stigande priser (+${trend}% 5 år)`, tone: "good" });
    else if (trend > -5) tags.push({ label: "Stabila priser", tone: "neutral" });
    else tags.push({ label: `Fallande priser (${trend}% 5 år)`, tone: "warn" });
  }
  if (typeof demand === "number") {
    if (demand > 0) tags.push({ label: `Växande befolkning (+${round(demand)}%)`, tone: "good" });
    else tags.push({ label: `Krympande befolkning (${round(demand)}%) — stagnationsrisk`, tone: "warn" });
  }
  if (typeof level === "number") {
    if (level < 2000) tags.push({ label: `Lågt insteg (${Math.round(level)} tkr)`, tone: "good" });
    else if (level > 6000) tags.push({ label: `Högt insteg (${Math.round(level)} tkr)`, tone: "neutral" });
  }
  if (typeof sales === "number" && sales < 30)
    tags.push({ label: `Tunn marknad — ${Math.round(sales)} köp/år`, tone: "warn" });

  return tags;
}

/** Normalize weights (any positive numbers) to sum to 1 over the given keys. */
function normalizeWeights(weights, keys) {
  const picked = keys.map((k) => [k, Math.max(0, Number(weights?.[k] ?? 0))]);
  const total = picked.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) {
    // No weights given → equal weighting.
    return Object.fromEntries(keys.map((k) => [k, 1 / keys.length]));
  }
  return Object.fromEntries(picked.map(([k, w]) => [k, w / total]));
}

/** Min-max normalize a raw value to 0–1, flipping when lower is better. */
function normValue(raw, min, max, direction) {
  if (max === min) return 0.5; // no spread → neutral
  const t = (raw - min) / (max - min);
  return direction === "lower" ? 1 - t : t;
}

/**
 * Rank communes against a couple profile.
 *
 * @param {object[]} communes  canonical Commune objects (from data/communes)
 * @param {object} profile     { persons:[{occupationCode}], weights:{jobs,tax,...}, ... }
 * @param {Dimension[]} dimensions
 * @returns {{ kommunkod, name, score, rank, breakdown:[{key,label,factor,contribution,raw}] }[]}
 */
export function rankCommunes(communes, profile, dimensions = DIMENSIONS) {
  // 1. Extract raw values per dimension and find each dimension's min/max spread.
  const raw = new Map(); // key -> Map(kommunkod -> rawValue)
  const bounds = {}; // key -> {min,max}
  for (const dim of dimensions) {
    const m = new Map();
    for (const c of communes) {
      const v = dim.extract(c, profile);
      if (typeof v === "number" && Number.isFinite(v)) m.set(c.kommunkod, v);
    }
    raw.set(dim.key, m);
    const vals = [...m.values()];
    if (vals.length) bounds[dim.key] = { min: Math.min(...vals), max: Math.max(...vals) };
  }

  // 2. Score each commune over the dimensions it actually has data for,
  //    renormalizing weights across those present dimensions.
  const scored = communes.map((c) => {
    const present = dimensions.filter((d) => raw.get(d.key)?.has(c.kommunkod));
    const weights = normalizeWeights(profile?.weights, present.map((d) => d.key));
    const breakdown = [];
    let total = 0;
    for (const dim of present) {
      const rv = raw.get(dim.key).get(c.kommunkod);
      const { min, max } = bounds[dim.key];
      const factor = normValue(rv, min, max, dim.direction); // 0–1
      const contribution = factor * weights[dim.key]; // 0–1, weighted
      total += contribution;
      breakdown.push({
        key: dim.key,
        label: dim.label,
        category: dim.category ?? null,
        unit: dim.unit ?? null,
        factor: round(factor * 100), // 0–100 per factor
        contribution: round(contribution * 100), // points added to total
        raw: rv, // the REAL value (e.g. 31.8 % tax) — surfaced in the UI, not just the match
      });
    }
    return {
      kommunkod: c.kommunkod,
      name: c.name,
      score: round(total * 100), // 0–100
      breakdown,
      coverage: present.length / dimensions.length, // how complete the data is
    };
  });

  // 3. Sort by score desc and assign ranks.
  scored.sort((a, b) => b.score - a.score);
  scored.forEach((s, i) => (s.rank = i + 1));
  return scored;
}

function round(x) {
  return Math.round(x * 10) / 10;
}
