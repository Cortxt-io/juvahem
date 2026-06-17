// Unit test for the interpretation layer (Fas 1.5). Run: node test/explain.test.mjs
//
// Feeds synthetic breakdowns (extreme good/bad per dimension) and asserts the right
// summary / highlights / risk flags come out. No scoring here — explain() only reads
// the normalized factors rankCommunes() already produced.

import { explain, THRESHOLDS } from '../src/lib/explain.js';

let failed = 0;
const assert = (cond, msg) => {
  if (!cond) { console.error('✗ FAIL:', msg); failed++; }
};

// helper: build a fake ranked entry from {key: factor0to100}
const entry = (factors) => ({
  breakdown: Object.entries(factors).map(([key, factor]) => ({ key, label: key, factor }))
});

// 1. Strong jobs + growth → both surface as strengths, summary leads with strongest.
const great = explain(entry({ jobs: 90, growth: 80, tax: 20 }));
assert(/jobbmöjligheter/i.test(great.summary), 'summary names the top strength (jobs)');
assert(great.highlights.some((h) => /Växande befolkning/i.test(h)), 'growth surfaces as a highlight');
assert(great.highlights.some((h) => /Hög skatt/i.test(h)), 'weak tax surfaces as the weakness highlight');

// 2. Everything mediocre (between weak and strong) → no clear verdict, empty summary.
const meh = explain(entry({ jobs: 50, tax: 50, growth: 50 }));
assert(meh.summary === '', 'mediocre commune yields an empty summary (UI falls back to numbers)');
assert(meh.highlights.length === 0, 'no highlights when nothing crosses a threshold');

// 3. Risk flags fire on RAW values, independent of breakdown.
const shrinking = explain(entry({ tax: 80 }), {
  population: { forecast_change_5y_pct: { value: -6 } },
  safety: { reported_crime_per_100k: { value: 15000 } }
});
assert(shrinking.riskFlags.some((r) => r.type === 'population'), 'shrinking population raises a flag');
assert(shrinking.riskFlags.some((r) => r.type === 'safety'), 'high crime raises a flag');
assert(shrinking.riskFlags.length <= 3, 'risk flags capped at 3');

// 4. Invest-mode dimensions are understood too.
const invest = explain(entry({ price_trend: 85, price_entry: 90, demand: 20 }), {
  housing: { num_sales: { value: 12 } }
});
assert(invest.highlights.some((h) => /prisutveckling/i.test(h)), 'invest: strong price trend reads as a strength');
assert(invest.riskFlags.some((r) => r.type === 'thin_market'), 'invest: thin market (12 sales) flagged');

// 5. Graceful fallback: no breakdown at all → no crash, empty everything.
const empty = explain({});
assert(empty.summary === '' && empty.highlights.length === 0, 'missing breakdown degrades gracefully');

console.log('THRESHOLDS:', JSON.stringify(THRESHOLDS));
console.log('Sample verdict:', great.summary);
console.log('  highlights:', great.highlights.join(' · '));
console.log('  risks:', shrinking.riskFlags.map((r) => r.label).join(' · '));

console.log(failed === 0 ? '\n✓ all explain invariants passed' : `\n✗ ${failed} invariant(s) failed`);
process.exit(failed === 0 ? 0 : 1);
