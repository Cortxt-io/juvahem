// Life-situation presets (Fas B). Picking "who you are" sets the weights + whether the
// jobs dimension locks to dual-career (harmonic mean). The scoring engine (score.js) is
// untouched: presets only supply weights + a composed dimension set via
// dimensionsForProfile(). Weights are RELATIVE — the engine renormalizes them over the
// dimensions that actually have data, so unknown/not-yet-live keys are harmless no-ops.

import { DIMENSIONS, harmonicMean } from './score.js';

// ─────────────────────────────────────────────────────────────────────────────
//  TUNABLE CONFIG — edit weights here. Keys are dimension keys from score.js:
//  jobs · tax · growth · energy · schools · safety · transit · price.
//  Forward-looking keys (healthcare/climate/broadband/nature) are listed in each
//  preset's `future` note; add them as weight keys once the dimension goes live.
// ─────────────────────────────────────────────────────────────────────────────
export const PRESETS = [
  {
    slug: 'couple',
    label: 'Par / dual-career',
    icon: '👫',
    description: 'Optimerar för att BÅDA får jobb (harmoniskt medel), rimlig skatt och pendling.',
    persons: 2,
    lockDualCareer: true,
    weights: { jobs: 35, tax: 15, price: 15, transit: 10, growth: 10, energy: 10, safety: 5, schools: 5 }
  },
  {
    slug: 'single',
    label: 'Ensamstående',
    icon: '🧍',
    description: 'Jobb, låg skatt, bra pendling och trygghet — skola och elkostnad tonas ned.',
    persons: 1,
    lockDualCareer: false,
    weights: { jobs: 40, tax: 20, transit: 15, safety: 15, price: 10, growth: 10, schools: 0, energy: 0 }
  },
  {
    slug: 'family',
    label: 'Familj med barn',
    icon: '👨‍👩‍👧',
    description: 'Skolor och trygghet i topp, plus bostadspris, pendling och elkostnad.',
    persons: 2,
    lockDualCareer: false,
    weights: { schools: 28, safety: 18, price: 20, transit: 14, energy: 10, jobs: 5, tax: 5, growth: 0 }
  },
  {
    slug: 'retiree',
    label: 'Pensionär',
    icon: '🌅',
    // future: healthcare/service + climate/sun once those dimensions land.
    description: 'Låg skatt, trygghet, elkostnad och köpkraft väger tyngst — jobb spelar ingen roll.',
    persons: 2,
    lockDualCareer: false,
    weights: { tax: 22, safety: 22, price: 15, energy: 18, growth: 10, transit: 13, schools: 0, jobs: 0 }
  },
  {
    slug: 'remote',
    label: 'Remote worker',
    icon: '💻',
    // future: broadband + nature/sun once those dimensions land.
    description: 'Bostadspris, låg skatt och elkostnad — pendling och lokal jobbmarknad tonas ned.',
    persons: 1,
    lockDualCareer: false,
    weights: { price: 25, tax: 25, energy: 20, growth: 15, safety: 10, transit: 5, jobs: 0, schools: 0 }
  }
];

export const DEFAULT_PRESET = 'couple';

/** Look up a preset by slug (null if unknown). */
export function getPreset(slug) {
  return PRESETS.find((p) => p.slug === slug) ?? null;
}

/** Arithmetic mean of positive values — the non-locked jobs combine. */
function mean(values) {
  const v = values.filter((x) => typeof x === 'number' && x > 0);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

/**
 * Combine two persons' job-fits. lockDualCareer → harmonic mean (BOTH must be good,
 * low if either is low). Otherwise arithmetic mean (good enough for one of them).
 */
export function combineJobs(fits, lockDualCareer) {
  return lockDualCareer ? harmonicMean(fits) : mean(fits);
}

/**
 * Dimension set for a profile: identical to the engine's DIMENSIONS, except the jobs
 * dimension honours profile.lockDualCareer. No scoring logic changes — we only swap
 * how the jobs raw value is combined across persons. Back-compatible: when
 * lockDualCareer is undefined we default to harmonic mean (the engine's prior behaviour).
 */
export function dimensionsForProfile(profile) {
  const lock = profile?.lockDualCareer !== false;
  return DIMENSIONS.map((d) =>
    d.key !== 'jobs'
      ? d
      : {
          ...d,
          extract: (c, p) =>
            combineJobs(
              (p?.persons ?? []).map((pp) => c.jobs?.[pp?.occupationCode]?.value ?? null),
              lock
            )
        }
  );
}
