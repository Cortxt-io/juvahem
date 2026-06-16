// Waitlist signup — ported from the old root api/subscribe.js (Upstash KV).
// Same storage contract: SADD waitlist:emails + HSET waitlist:joined.
// Env: KV_REST_API_URL, KV_REST_API_TOKEN (set when an Upstash KV is linked in Vercel).

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = (body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Ogiltig e-postadress' }, { status: 400 });
  }

  const url = env.KV_REST_API_URL;
  const token = env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return json({ error: 'Lagring inte konfigurerad (saknar KV-env-vars)' }, { status: 500 });
  }

  try {
    const resp = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        ['SADD', 'waitlist:emails', email],
        ['HSET', 'waitlist:joined', email, new Date().toISOString()]
      ])
    });
    if (!resp.ok) {
      return json({ error: 'Kunde inte spara just nu' }, { status: 502 });
    }
    return json({ ok: true });
  } catch {
    return json({ error: 'Kunde inte spara just nu' }, { status: 502 });
  }
}
