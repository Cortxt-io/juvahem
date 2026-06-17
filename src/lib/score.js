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
    direction: "lower",
    // Total local tax = what residents actually pay (municipal + regional). Falls
    // back to municipal-only if total is missing. Wide spread → high signal.
    extract: (c) =>
      c.economy?.total_tax_pct?.value ?? c.economy?.municipal_tax_pct?.value ?? null,
  },
  {
    key: "growth",
    label: "Befolkningstrend",
    direction: "higher",
    extract: (c) => c.population?.forecast_change_5y_pct?.value ?? null,
  },
  {
    key: "energy",
    label: "Elkostnad",
    direction: "lower", // lower öre/kWh (electricity area SE1–SE4) is better
    extract: (c) => c.energy?.price_level?.value ?? null,
  },
  {
    key: "price",
    label: "Bostadspris",
    direction: "lower",
    extract: (c) => c.housing?.price_proxy?.value ?? null,
  },
  {
    key: "commute",
    label: "Pendling",
    direction: "lower",
    // On-demand (ResRobot); filled per request. null until computed.
    extract: (c, profile) => c.commute?.[profile?.commuteKey]?.value ?? null,
  },
];

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
        factor: round(factor * 100), // 0–100 per factor
        contribution: round(contribution * 100), // points added to total
        raw: rv,
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
