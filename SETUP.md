# Setup — väntelista (egen Vercel-function)

Sidan samlar e-post via en egen serverless-funktion (`api/subscribe.js`) som sparar i
en Vercel-kopplad Redis (Upstash KV). Du äger listan själv — ingen tredjepart.

## 1. Koppla en KV-databas i Vercel

1. Vercel → ditt **juvahem**-projekt → **Storage** → **Create Database** → välj
   **Upstash for Redis** (KV) → skapa.
2. **Connect** databasen till juvahem-projektet.
   Då injiceras `KV_REST_API_URL` och `KV_REST_API_TOKEN` automatiskt som env-vars.
3. Redeploya (eller pusha) så funktionen får env-varsen.

## 2. Sätt en admin-token (för att läsa ut listan)

Vercel → projekt → **Settings → Environment Variables** → lägg till:

- `ADMIN_TOKEN` = en lång slumpsträng du hittar på (t.ex. från en lösenordsgenerator).

## 3. Hämta listan

```bash
curl -H "Authorization: Bearer DITT_ADMIN_TOKEN" https://juvahem.se/api/list
```

Svar:
```json
{ "count": 12, "subscribers": [ { "email": "...", "joined": "2026-06-16T..." } ] }
```

## Endpoints

- `POST /api/subscribe`  body `{ "email": "..." }` → sparar i väntelistan (publik).
- `GET  /api/list`       header `Authorization: Bearer <ADMIN_TOKEN>` → hela listan (skyddad).

## Lokalt testa

```bash
npm i -g vercel
vercel dev          # kör funktionerna lokalt (kräver KV-env-vars i .env.local)
```
