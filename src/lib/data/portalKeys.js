// Per-kommun keys for deep-linking to real listings (built by etl/build_portal_keys.py).
// kommunkod -> { name, hemnet_slug, qasa_area, jobtech_municipality_id }

import keys from '../../../data/portal_keys.json';

export const portalKeys = keys;

export function portalKeyFor(kommunkod) {
  return keys[kommunkod];
}

// --- Deep-link builders (legal: link to a public search page; never fetch listings) ---

const HEMNET = 'https://www.hemnet.se/till-salu';
const PLATSBANKEN = 'https://arbetsformedlingen.se/platsbanken/annonser';

/** Real-listing links per intent for a kommun. Returns [] if the kommun is unknown. */
export function listingLinks(kommunkod) {
  const k = keys[kommunkod];
  if (!k) return [];
  const slug = k.hemnet_slug;
  const qasa = `https://qasa.com/se/sv/find-home?searchAreas=${encodeURIComponent(k.qasa_area).replace(/%20/g, '_')}~~se`;
  return [
    { intent: 'rent', label: 'Hyresrätter', site: 'Qasa', url: qasa },
    { intent: 'apartment', label: 'Bostadsrätter', site: 'Hemnet', url: `${HEMNET}/lagenhet/${slug}` },
    { intent: 'house', label: 'Villor', site: 'Hemnet', url: `${HEMNET}/villa/${slug}` },
    { intent: 'plot', label: 'Tomter', site: 'Hemnet', url: `${HEMNET}/tomt/${slug}` }
  ];
}

/** Platsbanken job-search link for one occupation field in one kommun. */
export function jobLink(kommunkod, occupationFieldId) {
  const k = keys[kommunkod];
  const params = new URLSearchParams();
  if (k?.jobtech_municipality_id) params.set('l', k.jobtech_municipality_id);
  if (occupationFieldId) params.set('occupation-field', occupationFieldId);
  const qs = params.toString();
  return qs ? `${PLATSBANKEN}?${qs}` : PLATSBANKEN;
}
