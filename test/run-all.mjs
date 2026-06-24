// Test runner — runs EVERY test/*.test.mjs and aggregates. Exit non-zero if any fail.
//
// Before this, package.json's "test" ran only rank.test.mjs, so explain/invest/presets/
// price tests existed but never ran in `npm test` — dormant, free to rot. This makes all
// of them (and any future *.test.mjs) actual guards. Each test file exits non-zero on
// failure (see their assert()/process.exit), which we propagate.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(__dirname)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort();

let failed = 0;
for (const f of files) {
  console.log(`\n──────── ${f} ────────`);
  const res = spawnSync(process.execPath, [join(__dirname, f)], { stdio: "inherit" });
  if (res.status !== 0) {
    failed++;
    console.error(`✗ ${f} FAILED (exit ${res.status})`);
  }
}

console.log(`\n${files.length - failed}/${files.length} test files passed`);
process.exit(failed === 0 ? 0 : 1);
