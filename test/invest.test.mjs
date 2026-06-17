// Invest-mode scoring test. Run:  node test/invest.test.mjs
//
// "Investera här" reuses the SAME engine (rankCommunes) with a DIFFERENT dimension
// set (INVEST_DIMENSIONS) — the "two modes, one engine" design. This test uses
// synthetic communes (no committed housing data yet — that lands with the SCB ETL)
// to pin the engine behaviour: trend rewards capital growth, entry rewards cheap
// price, and missing housing data renormalizes away instead of crashing.

import { rankCommunes, INVEST_DIMENSIONS, investVerdict } from "../src/lib/score.js";

let failed = 0;
const assert = (cond, msg) => {
  if (!cond) {
    console.error("✗ FAIL:", msg);
    failed++;
  }
};

const housing = (level, change5) => ({
  price_level_tkr: { value: level, provenance: { source: "test", fetched: "t" } },
  price_change_5y_pct: { value: change5, provenance: { source: "test", fetched: "t" } },
  num_sales: { value: 100, provenance: { source: "test", fetched: "t" } },
});

// Three communes: hot (high trend, pricey), cheap-flat, and one missing housing.
const communes = [
  { kommunkod: "0001", name: "HotTown", housing: housing(4000, 40),
    population: { forecast_change_5y_pct: { value: 5 } } },
  { kommunkod: "0002", name: "CheapFlat", housing: housing(1500, 2),
    population: { forecast_change_5y_pct: { value: -1 } } },
  { kommunkod: "0003", name: "NoData",
    population: { forecast_change_5y_pct: { value: 1 } } },
];

// Weight entirely on price trend → HotTown must win.
const byTrend = rankCommunes(communes, { weights: { price_trend: 100 } }, INVEST_DIMENSIONS);
assert(byTrend[0].name === "HotTown", "trend-weighted ranking favours capital growth");

// Weight entirely on entry price (lower better) → CheapFlat must beat HotTown.
const byEntry = rankCommunes(communes, { weights: { price_entry: 100 } }, INVEST_DIMENSIONS);
const entryRank = (name) => byEntry.find((r) => r.name === name).rank;
assert(entryRank("CheapFlat") < entryRank("HotTown"), "entry-price weighting favours cheaper communes");

// Missing-housing commune still scores (on demand only) and never produces NaN.
const noData = byTrend.find((r) => r.name === "NoData");
assert(Number.isFinite(noData.score), "commune with no housing data still gets a finite score");
assert(!noData.breakdown.some((b) => b.key === "price_trend"),
  "missing housing dim is renormalized away, not zero-filled");

console.log("Invest leaderboard (trend-weighted):");
for (const r of byTrend) {
  console.log(`  ${r.rank}. ${r.name.padEnd(10)} ${r.score}  [${r.breakdown.map((b) => b.key).join(",")}]`);
}

// --- investVerdict: plain-text reads ---
const hotTags = investVerdict(communes[0]); // HotTown: +40% trend, +5% demand, 4000 tkr
assert(hotTags.some((t) => t.tone === "good" && /köpmarknad/i.test(t.label)),
  "hot commune flagged as a strong buyer's market");
const flatTags = investVerdict(communes[1]); // CheapFlat: +2% trend, -1% demand, 1500 tkr
assert(flatTags.some((t) => t.tone === "warn" && /stagnation/i.test(t.label)),
  "shrinking commune carries a stagnation-risk flag");
assert(flatTags.some((t) => t.tone === "good" && /lågt insteg/i.test(t.label)),
  "cheap commune flagged as low entry cost");
assert(investVerdict(communes[2]).length === 1, "no-housing commune yields only the demand read");

console.log("\nVerdicts:");
console.log("  HotTown:", hotTags.map((t) => t.label).join(" · "));
console.log("  CheapFlat:", flatTags.map((t) => t.label).join(" · "));

console.log(failed === 0 ? "\n✓ all invest invariants passed" : `\n✗ ${failed} invariant(s) failed`);
process.exit(failed === 0 ? 0 : 1);
