// Load all 290 commune JSON files at build time via import.meta.glob.
// The files live at the repo root data/communes/ (the Python ETL writes there,
// and test/rank.test.mjs reads there — single source, not duplicated into src/).

import { slugify } from '$lib/util/slug.js';

const files = import.meta.glob('../../../data/communes/*.json', { eager: true });

/** @type {object[]} canonical Commune objects */
export const communes = Object.values(files).map((m) => m.default ?? m);

/** kommunkod -> Commune */
export const byKommunkod = new Map(communes.map((c) => [c.kommunkod, c]));

/** slug -> kommunkod (collision-checked at module load) */
export const slugToKommunkod = new Map();
for (const c of communes) {
  const s = slugify(c.name);
  if (slugToKommunkod.has(s)) {
    // Two communes slugified to the same string — disambiguate with kommunkod.
    slugToKommunkod.set(`${s}-${c.kommunkod}`, c.kommunkod);
  } else {
    slugToKommunkod.set(s, c.kommunkod);
  }
}

/** kommunkod -> slug (inverse, for building links) */
export const kommunkodToSlug = new Map(
  [...slugToKommunkod.entries()].map(([slug, kod]) => [kod, slug])
);

/** All slugs — used by /kommun/[slug] entries() for prerendering. */
export const allSlugs = [...slugToKommunkod.keys()];

export function communeBySlug(slug) {
  const kod = slugToKommunkod.get(slug);
  return kod ? byKommunkod.get(kod) : undefined;
}
