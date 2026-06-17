// Thin server-side ranking endpoint (share / mobile / external use).
// The /jamfor UI ranks client-side for instant weight-tuning; this exists so a
// profile can be ranked over HTTP too. POST a profile, get the ranked list back.

import { json } from '@sveltejs/kit';
import { communes } from '$lib/data/communes.js';
import { rankCommunes, INVEST_DIMENSIONS } from '$lib/score.js';
import { dimensionsForProfile } from '$lib/presets.js';
import { explain } from '$lib/explain.js';

const byKod = new Map(communes.map((c) => [c.kommunkod, c]));

export async function POST({ request }) {
  let profile;
  try {
    profile = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const mode = profile?.mode === 'invest' ? 'invest' : 'bo';
  const dims = mode === 'invest' ? INVEST_DIMENSIONS : dimensionsForProfile(profile ?? {});
  const ranked = rankCommunes(communes, profile ?? {}, dims);
  const limit = Number(profile?.limit) || ranked.length;
  // Attach the human-readable interpretation layer (Fas 1.5, beta).
  const results = ranked.slice(0, limit).map((r) => ({
    ...r,
    explanation: explain(r, byKod.get(r.kommunkod), profile)
  }));
  return json({ mode, count: ranked.length, results });
}
