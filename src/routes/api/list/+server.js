// Protected waitlist dump — ported from root api/list.js.
// Call with header: Authorization: Bearer <ADMIN_TOKEN>

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function GET({ request }) {
  const admin = env.ADMIN_TOKEN;
  const auth = request.headers.get('authorization') || '';
  if (!admin || auth !== `Bearer ${admin}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = env.KV_REST_API_URL;
  const token = env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return json({ error: 'Lagring inte konfigurerad' }, { status: 500 });
  }

  try {
    const [emailsResp, joinedResp] = await Promise.all([
      fetch(`${url}/smembers/waitlist:emails`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${url}/hgetall/waitlist:joined`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const emails = (await emailsResp.json())?.result || [];
    const joinedFlat = (await joinedResp.json())?.result || [];

    const joined = {};
    for (let i = 0; i < joinedFlat.length; i += 2) {
      joined[joinedFlat[i]] = joinedFlat[i + 1];
    }

    const list = emails
      .map((email) => ({ email, joined: joined[email] || null }))
      .sort((a, b) => (a.joined || '').localeCompare(b.joined || ''));

    return json({ count: list.length, subscribers: list });
  } catch {
    return json({ error: 'Kunde inte hämta listan' }, { status: 502 });
  }
}
