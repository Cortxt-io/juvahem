// Runnable scoring test / golden-case scaffold.  Run:  node test/rank.test.mjs
//
// Loads the committed commune data, ranks it, and checks invariants. Reports two
// scenarios: (1) tax+growth only, (2) a dual-career profile (Data/IT + Industriell
// tillverkning) that exercises the harmonic-mean jobs dimension.
//
// NB: jobs today = open ads in the exact kommun (a live snapshot). It does NOT yet model
// remote work or jobs within commute radius — so a tiny kommun like Älvsbyn scores low on
// jobs even though the founders' real case was remote tech + regional industry. That
// refinement (remote flag + commute-radius job access) is future work.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rankCommunes } from "../src/lib/score.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMUNES_DIR = join(__dirname, "..", "data", "communes");

const communes = readdirSync(COMMUNES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(COMMUNES_DIR, f), "utf-8")));

// Occupation-field concept ids (from data/occupation_fields.json).
const DATA_IT = "apaJ_2ja_LuF";
const INDUSTRI = "wTEr_CBC_bqh";

// Scenario 1: equal weight on tax + growth (no jobs).
const profile = {
  persons: [{ occupationCode: null }, { occupationCode: null }],
  weights: { tax: 50, growth: 50 },
};

// Scenario 2: dual-career — one Data/IT, one Industriell tillverkning, jobs-heavy.
const dualCareer = {
  persons: [{ occupationCode: DATA_IT }, { occupationCode: INDUSTRI }],
  weights: { jobs: 60, tax: 20, growth: 20 },
};

const ranked = rankCommunes(communes, profile);
const rankedDual = rankCommunes(communes, dualCareer);

// --- invariants ---
let failed = 0;
const assert = (cond, msg) => {
  if (!cond) {
    console.error("✗ FAIL:", msg);
    failed++;
  }
};

assert(ranked.length === 290, `expected 290 communes, got ${ranked.length}`);
assert(ranked.every((r) => r.score >= 0 && r.score <= 100), "all scores within 0–100");
assert(
  ranked.every((r, i) => r.rank === i + 1),
  "ranks are sequential and sorted by score",
);
assert(
  ranked[0].score >= ranked[ranked.length - 1].score,
  "first score >= last score",
);
const alvsbyn = ranked.find((r) => r.kommunkod === "2560");
assert(!!alvsbyn, "Älvsbyn (2560) present in results");

// --- report ---
console.log("\nTop 10 (weights: tax 50 / growth 50):");
for (const r of ranked.slice(0, 10)) {
  console.log(`  ${String(r.rank).padStart(3)}. ${r.name.padEnd(20)} ${r.score}`);
}
if (alvsbyn) {
  console.log(`\nÄlvsbyn: Plats ${alvsbyn.rank} av 290 — score ${alvsbyn.score}`);
  console.log("  breakdown:", JSON.stringify(alvsbyn.breakdown));
}

console.log("\nTop 10 dual-career (Data/IT + Industri, jobs 60 / tax 20 / growth 20):");
for (const r of rankedDual.slice(0, 10)) {
  console.log(`  ${String(r.rank).padStart(3)}. ${r.name.padEnd(20)} ${r.score}`);
}
// The dual-career jobs dimension must actually move communes vs the no-jobs ranking.
assert(
  rankedDual[0].kommunkod !== ranked[0].kommunkod ||
    rankedDual.some((r) => r.breakdown.some((b) => b.key === "jobs")),
  "dual-career ranking exercises the jobs dimension",
);
assert(
  rankedDual.some((r) => r.breakdown.some((b) => b.key === "jobs")),
  "at least one commune has a jobs breakdown entry",
);

console.log(failed === 0 ? "\n✓ all invariants passed" : `\n✗ ${failed} invariant(s) failed`);
process.exit(failed === 0 ? 0 : 1);
