// Vercel Serverless Function — hämta väntelistan (skyddad).
// Anropa med header  Authorization: Bearer <ADMIN_TOKEN>
// där ADMIN_TOKEN är en env-var du själv sätter i Vercel → Settings → Environment Variables.
//
// Exempel:  curl -H "Authorization: Bearer DIN_HEMLIGA_TOKEN" https://juvahem.se/api/list

export default async function handler(req, res) {
  const admin = process.env.ADMIN_TOKEN;
  const auth = req.headers.authorization || '';
  if (!admin || auth !== `Bearer ${admin}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return res.status(500).json({ error: 'Lagring inte konfigurerad' });
  }

  try {
    const [emailsResp, joinedResp] = await Promise.all([
      fetch(`${url}/smembers/waitlist:emails`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${url}/hgetall/waitlist:joined`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const emails = (await emailsResp.json())?.result || [];
    const joinedFlat = (await joinedResp.json())?.result || [];

    // hgetall returnerar [field, value, field, value, ...] → para ihop.
    const joined = {};
    for (let i = 0; i < joinedFlat.length; i += 2) {
      joined[joinedFlat[i]] = joinedFlat[i + 1];
    }

    const list = emails
      .map((email) => ({ email, joined: joined[email] || null }))
      .sort((a, b) => (a.joined || '').localeCompare(b.joined || ''));

    return res.status(200).json({ count: list.length, subscribers: list });
  } catch {
    return res.status(502).json({ error: 'Kunde inte hämta listan' });
  }
}
