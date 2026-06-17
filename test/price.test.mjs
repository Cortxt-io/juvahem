// Price/affordability dimension test (Fas C). Run: node test/price.test.mjs
//
// The price dimension reads housing.price_level_tkr (mean köpeskilling småhus, SCB
// FastprisSHRegionAr) as a coarse per-kommun affordability proxy — lower = better.
// Verifies coverage, direction, graceful absence, and that presets weight it. Prints
// the 10 cheapest + 10 most expensive kommuner as a data sanity check.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rankCommunes, DIMENSIONS } from '../src/lib/score.js';
import { getPreset } from '../src/lib/presets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, '..', 'data', 'communes');
const communes = readdirSync(DIR).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf-8')));

let failed = 0;
const assert = (cond, msg) => { if (!cond) { console.error('✗ FAIL:', msg); failed++; } };

// 1. Coverage — the majority of kommuner must carry a price level.
const withPrice = communes.filter((c) => c.housing?.price_level_tkr?.value != null);
assert(withPrice.length >= communes.length * 0.8,
  `majority of kommuner have a price (${withPrice.length}/${communes.length})`);

// 2. The price dimension exists in the engine and points at the SCB field.
const priceDim = DIMENSIONS.find((d) => d.key === 'price');
assert(priceDim && priceDim.direction === 'lower', 'price dimension exists, lower = better');
assert(priceDim.extract({ housing: { price_level_tkr: { value: 1234 } } }) === 1234,
  'price dimension reads housing.price_level_tkr');

// 3. Direction — cheaper commune outranks pricier when weighting price only.
const synthetic = [
  { kommunkod: '9001', name: 'Billig', housing: { price_level_tkr: { value: 900 } } },
  { kommunkod: '9002', name: 'Dyr', housing: { price_level_tkr: { value: 8000 } } },
  { kommunkod: '9003', name: 'UtanPris' } // no housing → must not crash
];
const ranked = rankCommunes(synthetic, { weights: { price: 100 } });
const rank = (n) => ranked.find((r) => r.name === n);
assert(rank('Billig').score > rank('Dyr').score, 'cheaper commune scores higher on price');
assert(Number.isFinite(rank('UtanPris').score), 'commune without price data still scores (no crash)');
assert(!rank('UtanPris').breakdown.some((b) => b.key === 'price'),
  'missing price renormalizes away rather than zero-filling');

// 4. Presets weight the price dimension where the spec requires it.
for (const slug of ['couple', 'family', 'retiree', 'remote', 'single']) {
  assert((getPreset(slug).weights.price ?? 0) > 0, `${slug} preset weights price > 0`);
}
assert(getPreset('family').weights.price >= 15, 'family weights price highly');
assert(getPreset('retiree').weights.price >= 10, 'retiree weights price');

// --- sanity print: 10 cheapest + 10 most expensive ---
const priced = withPrice
  .map((c) => ({ name: c.name, tkr: c.housing.price_level_tkr.value }))
  .sort((a, b) => a.tkr - b.tkr);
console.log('\n10 billigaste (medel-köpeskilling småhus, tkr):');
for (const c of priced.slice(0, 10)) console.log(`  ${c.name.padEnd(18)} ${c.tkr}`);
console.log('\n10 dyraste:');
for (const c of priced.slice(-10).reverse()) console.log(`  ${c.name.padEnd(18)} ${c.tkr}`);

console.log(failed === 0 ? '\n✓ all price invariants passed' : `\n✗ ${failed} invariant(s) failed`);
process.exit(failed === 0 ? 0 : 1);
