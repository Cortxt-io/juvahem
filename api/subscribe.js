// Vercel Serverless Function — väntelista för juvahem.
// Tar emot { email } via POST och sparar i en Vercel-kopplad Redis (Upstash KV).
// Du äger listan själv — ingen tredjepartstjänst som Formspree.
//
// Kräver två env-vars (sätts automatiskt när du kopplar en Upstash KV-databas
// till projektet i Vercel → Storage): KV_REST_API_URL och KV_REST_API_TOKEN.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // body kan vara redan parsad (Vercel) eller en sträng — hantera båda.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const email = (body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Ogiltig e-postadress' });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    return res.status(500).json({ error: 'Lagring inte konfigurerad (saknar KV-env-vars)' });
  }

  try {
    // Pipeline: lägg e-posten i ett set (dedupe) + tidsstämpla i en hash.
    const resp = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['SADD', 'waitlist:emails', email],
        ['HSET', 'waitlist:joined', email, new Date().toISOString()],
      ]),
    });

    if (!resp.ok) {
      return res.status(502).json({ error: 'Kunde inte spara just nu' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'Kunde inte spara just nu' });
  }
}
