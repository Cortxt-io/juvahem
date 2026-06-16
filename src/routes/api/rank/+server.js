// Thin server-side ranking endpoint (share / mobile / external use).
// The /jamfor UI ranks client-side for instant weight-tuning; this exists so a
// profile can be ranked over HTTP too. POST a profile, get the ranked list back.

import { json } from '@sveltejs/kit';
import { communes } from '$lib/data/communes.js';
import { rankCommunes } from '$lib/score.js';

export async function POST({ request }) {
  let profile;
  try {
    profile = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const ranked = rankCommunes(communes, profile ?? {});
  const limit = Number(profile?.limit) || ranked.length;
  return json({ count: ranked.length, results: ranked.slice(0, limit) });
}
