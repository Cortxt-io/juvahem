# Juvahem — koncept (one-pager, utkast)

> Status: **utforskande**. Utanför CNS-portföljen tills det mognat. Domän: **juvahem.se** (köpt 2026-06-15).

## I en mening
Ett beslutsverktyg som hjälper **par** svara på *"var ska vi bo?"* — och hitta boende där — utifrån
**parets egna parametrar** (båda personernas jobb/kompetens, budget, hushållsstorlek, livsstil), inte
generiska topplistor.

## Problemet
Att välja **var** man ska bo som par är ett höginsats-beslut med spridd, motstridig info:
- Jobbmarknad för **BÅDAS** kompetenser (inte bara en av er)
- Boendekostnad: kommunalskatt, huspriser, pendling
- Livskvalitet: natur/stad, service, framtid (krymper orten?)

Idag görs det ad-hoc i huvudet och spridda webbflikar. **Ingen tar parets *kombinerade* profil och rankar
orter mot den.**

## För vem
Par / småhushåll som **överväger att flytta och är öppna för var** — särskilt från dyr storstad mot
billigare ort/landsbygd. Första nisch = exakt Rikard & Amelies fall: storstad → Norrland.

## Insikten (edge)
Beslutet ska **parametriseras på paret**: två personers kompetenser + inkomstpotential + budget + hushåll
→ vägd ortsrankning + konkreta boendekandidater. Bevisat på er själva (tech-distans + industri →
Älvsbyn-axeln, vald på skatt/huspris/pendling). **Er research är prototypen.**

## Vad det gör (MVP-tes)
1. Paret matar in: yrken/kompetenser, inkomstmål, boendebudget, hushållsstorlek, preferenser (natur/stad/pendling).
2. Verktyget rankar orter (jobbmatchning för båda · kommunalskatt · huspriser · pendling · service).
3. Levererar en kort **"var-ska-vi-bo"-rapport** + boendekandidater — er Norrbotten-research, generaliserad.

## MVP-avgränsning
Börja **smalt**: EN flyttyp (storstad → Norrland), några orter, halvautomatisk research. Validera att par
faktiskt vill ha/betalar för det **innan** full automation.

## Öppna frågor (besvara innan bygge)
- **Affärsmodell:** engångsrapport (betald)? abonnemang? affiliate mot mäklare/Hemnet?
- **Data:** Hemnet/Booli **blockerar maskinläsning (HTTP 403)** — ert eget förbehåll. Hur får vi färska
  bostads-/prisdata lagligt? (API? partner? manuell kurering först?)
- **Marknad:** vilken första region/flyttyp? Hur stor är målgruppen "öppna-för-var"-par?
- **Konkurrens:** finns liknande (flyttkalkylatorer, "best places to live"-sajter)? Vad saknar de? (= par-vinkeln + boende-koppling)

## Nästa steg (välj efter denna sida)
- **A) Landningssida** på juvahem.se — förklara konceptet + samla väntelista → validera efterfrågan billigt.
- **B) Verktygs-MVP** — en enkel "mata in profil → få ortsförslag"-flöde, halvautomatiskt.

Rekommendation: **A först** (validera att andra par vill ha det) — er egen research bevisar redan att det
*går* att göra; det obevisade är om *andra* betalar för det.
