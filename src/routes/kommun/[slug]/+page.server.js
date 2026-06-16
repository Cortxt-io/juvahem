import { error } from '@sveltejs/kit';
import {
  communes,
  communeBySlug,
  allSlugs,
  kommunkodToSlug
} from '$lib/data/communes.js';
import { rankCommunes } from '$lib/score.js';

export const prerender = true;

// Prerender one static page per commune (programmatic SEO).
export function entries() {
  return allSlugs.map((slug) => ({ slug }));
}

// A neutral baseline ranking (no job profile) so each page can show a default
// "rank by tax + growth" position. Jobs need a couple profile, so they're shown
// as raw data rather than scored here.
const baseline = rankCommunes(communes, { weights: { tax: 50, growth: 50 } });
const rankByKod = new Map(baseline.map((r) => [r.kommunkod, r.rank]));

export function load({ params }) {
  const c = communeBySlug(params.slug);
  if (!c) throw error(404, 'Okänd kommun');

  const topJobs = Object.entries(c.jobs ?? {})
    .map(([id, j]) => ({ id, label: j.label, value: j.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // A few neighbours by baseline rank for internal linking.
  const myRank = rankByKod.get(c.kommunkod);
  const neighbours = baseline
    .filter((r) => Math.abs(r.rank - myRank) <= 3 && r.kommunkod !== c.kommunkod)
    .slice(0, 6)
    .map((r) => ({ name: r.name, slug: kommunkodToSlug.get(r.kommunkod), rank: r.rank }));

  return {
    slug: params.slug,
    commune: {
      kommunkod: c.kommunkod,
      name: c.name,
      tax: c.economy?.municipal_tax_pct?.value ?? null,
      totalTax: c.economy?.total_tax_pct?.value ?? null,
      population: c.population?.total?.value ?? null,
      growth5y: c.population?.forecast_change_5y_pct?.value ?? null
    },
    baselineRank: myRank,
    total: baseline.length,
    topJobs,
    neighbours
  };
}
