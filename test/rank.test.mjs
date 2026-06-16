// Runnable scoring test / golden-case scaffold.  Run:  node test/rank.test.mjs
//
// Loads the committed commune data, ranks it, and checks invariants. Also prints the
// top 10 and Älvsbyn's rank — the founders' golden case. Today only tax + population
// trend feed the score (no jobs yet); once JobTech lands, add a dual-career profile
// here and assert Älvsbyn ranks highly.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rankCommunes } from "../src/lib/score.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMUNES_DIR = join(__dirname, "..", "data", "communes");

const communes = readdirSync(COMMUNES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(COMMUNES_DIR, f), "utf-8")));

// Sample profile: equal weight on the dimensions that have data today.
const profile = {
  persons: [{ occupationCode: null }, { occupationCode: null }],
  weights: { tax: 50, growth: 50 },
};

const ranked = rankCommunes(communes, profile);

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

console.log(failed === 0 ? "\n✓ all invariants passed" : `\n✗ ${failed} invariant(s) failed`);
process.exit(failed === 0 ? 0 : 1);
