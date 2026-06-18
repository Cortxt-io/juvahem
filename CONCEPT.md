# Juvahem — koncept (one-pager)

> Status: **live** på juvahem.se. Egen Venture i Cortxt-portföljen (`domain: juvahem`), eget repo + egen drift.

## I en mening
Ett **neutralt, datadrivet beslutsverktyg** som rankar Sveriges alla **290 kommuner mot dina prioriteringar** — du säger vad som väger tyngst (och vad som är ett måste), verktyget sorterar hela landet mot just det och visar *varför*, faktor för faktor.

## Positionering
*"Sveriges 290 kommuner, rankade mot dina prioriteringar."* Inte en topplista över "bästa orter" (de viktar åt alla lika) — utan en rankning byggd på **din** profil, med den riktiga datan synlig, inte gömd bakom ett svart match-tal.

> Tidigare var produkten framad som ett **par-verktyg**. Den framingen är borttagen (2026-06-18): dual-career är *ett läge* bland flera, inte hjälten. Verktyget tjänar ensamstående, familjer, pensionärer, distansarbetare och par — och investerare via ett eget invest-läge.

## Problemet
Att välja **var** man ska bo är ett höginsats-beslut med spridd, motstridig info: jobbmarknad, skatt, bostadspris, skola, trygghet, pendling, framtid. Idag görs det ad-hoc i huvudet och tjugo webbflikar. Ingen tar **din** kombinerade profil och rankar orter mot den — transparent och med källorna framme.

## Insikten (moat)
- **Personalisering, inte en generisk lista.** Varje faktor vägs mot din profil (vikter + måsten). Moaten är kontext-/framtidslagret Hemnet/Booli saknar, inte annonsportalen.
- **Transparens som princip.** Visa den riktiga siffran (skatt 31,8 % · pris 5 396 tkr), inte bara en match-%. Ogenomskinliga index (jfr Numbeo) undergräver tilliten; öppna data + synlig härkomst bygger den.

## Hur det fungerar (live)
1. **Profil:** säg vem du är / vad du bryr dig om (sätter vikter), och dina **måsten** (dealbreakers som silar bort kommuner).
2. **Rankning live:** 290 kommuner rankas direkt mot din profil; index + atlas-karta sorterar om sig medan du drar reglagen. Ettan glöder guld.
3. **Förklaring:** varje kommun bryts ner per faktor — råvärde + träff för din viktning + bidrag + datatäckning + källa. Egen datasida per kommun.

## Faktorer
8 fria, öppna per-kommun-dimensioner live (jobb, skatt, bostadspris, elkostnad, skola, trygghet, kollektivtrafik, befolkningstrend), 15–20+ på väg (regionskatt, bostadsbrist, sol/klimat, bredband, natur, vård, nätavgift…). Full katalog + källor i `FACTORS.md`. Motorn är additiv: ny faktor = ETL-block + dimensionsrad + reglage, ingen omskrivning.

## Affärsmodell & avgränsningar (beslutade)
- **Affiliate förkastad** (provision går till mäklaren, inte oss). Primär modell = betald fördjupad **beslutsrapport**; sekundärt B2B (relocation-firmor) / B2G (kommunal inflyttarservice).
- **Booli = juridisk spärr** (villkoren förbjuder konkurrerande bruk — använd aldrig Booli-data). Hemnet/Booli-skrapning utesluten (EU-databasrätt + ToS). Bostäder kopplas via **lagliga djuplänkar** (Qasa hyra, Hemnet köp/tomt).
- **Gratis-data-MVP** först (Kolada, SCB, JobTech, m.fl., CC0). Riktiga objekt-slutpriser = licens (Lantmäteriet) → senare fas.

## Riktning framåt (foundation)
Bygger mot ett **profil-kontrakt** som alla ytor är vyer av (identitet · måsten · vikter · kontext), data-presentation som visar råvärdet, rika kommun-sidor, sparade/delbara profiler, fler beslutskontexter, och framtidsytor (rapport, boende-koppling, head-to-head, språk-inmatning). Plan: `.claude/plans/` + `NOTES.md`.
