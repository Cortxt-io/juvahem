// Unit test for life-situation presets (Fas B). Run: node test/presets.test.mjs
//
// Verifies the two behaviours the spec calls out: the couple preset locks the jobs
// dimension to harmonic mean (both must be satisfied), and the retiree preset zeroes
// out the jobs weight. score.js is untouched — presets compose on top of it.

import { PRESETS, getPreset, combineJobs, dimensionsForProfile } from '../src/lib/presets.js';

let failed = 0;
const assert = (cond, msg) => {
  if (!cond) { console.error('✗ FAIL:', msg); failed++; }
};

// --- all five presets exist with the required shape ---
const slugs = PRESETS.map((p) => p.slug);
for (const s of ['couple', 'single', 'family', 'retiree', 'remote']) {
  assert(slugs.includes(s), `preset "${s}" defined`);
}
for (const p of PRESETS) {
  assert(typeof p.label === 'string' && p.label, `${p.slug} has a label`);
  assert(typeof p.description === 'string' && p.description, `${p.slug} has a description`);
  assert(typeof p.lockDualCareer === 'boolean', `${p.slug} declares lockDualCareer`);
  assert(p.weights && typeof p.weights === 'object', `${p.slug} has weights`);
}

// --- couple locks dual-career (harmonic mean punishes an uneven pair) ---
assert(getPreset('couple').lockDualCareer === true, 'couple preset locks dual-career');
const uneven = [10, 2];
const locked = combineJobs(uneven, true);   // harmonic ≈ 3.33
const unlocked = combineJobs(uneven, false); // arithmetic = 6
assert(locked < unlocked, 'harmonic mean (locked) scores an uneven pair lower than arithmetic (unlocked)');
assert(Math.abs(locked - 3.333) < 0.01, 'harmonic mean computed correctly');

// dimensionsForProfile threads lockDualCareer into the jobs dimension's extract.
const commune = { jobs: { A: { value: 10 }, B: { value: 2 } } };
const persons = [{ occupationCode: 'A' }, { occupationCode: 'B' }];
const jobsDim = (lock) => dimensionsForProfile({ lockDualCareer: lock }).find((d) => d.key === 'jobs');
const lockedVal = jobsDim(true).extract(commune, { persons });
const looseVal = jobsDim(false).extract(commune, { persons });
assert(lockedVal < looseVal, 'couple dimension set yields a lower jobs value for an uneven pair');

// --- retiree zeroes the jobs weight ---
assert((getPreset('retiree').weights.jobs ?? 0) === 0, 'retiree gives jobs weight ≈ 0');
assert(getPreset('retiree').lockDualCareer === false, 'retiree does not lock dual-career');

// --- back-compat: undefined lock defaults to harmonic (engine's prior behaviour) ---
const dflt = dimensionsForProfile({}).find((d) => d.key === 'jobs');
assert(dflt.extract(commune, { persons }) === lockedVal, 'undefined lockDualCareer defaults to harmonic mean');

console.log('Presets:', slugs.join(', '));
console.log(`couple jobs(10,2) locked=${locked.toFixed(2)} vs unlocked=${unlocked}`);
console.log(`retiree jobs weight = ${getPreset('retiree').weights.jobs}`);

console.log(failed === 0 ? '\n✓ all preset invariants passed' : `\n✗ ${failed} invariant(s) failed`);
process.exit(failed === 0 ? 0 : 1);
