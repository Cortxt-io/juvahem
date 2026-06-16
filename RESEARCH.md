# Juvahem — research (datadriven relocation-verktyg)

Källbelagd research bakom planen (se även `compiled-wishing-flame.md` hos grundaren).
Två rundor: (1) datakällor/kontext/framtid/konkurrens/AI, (2) djupare på licenskostnad,
marknad/betalningsvilja, konkurrens+internationellt, teknik, scoring, GTM.

## 1. Bostads-/prisdata — laglighet & kostnad

- **Hemnet/Booli-skrapning:** ToS-brott + HTTP 403. Uteslutet. (Apify-skrapers finns men gråzon.)
- **Booli = juridisk spärr:** användarvillkoren förbjuder att sprida/sälja/göra data tillgänglig
  för tredjepart eller konkurrerande tjänst. Inte licensierbart. Ägs av SBAB; Hemnet har anmält
  till Konkurrensverket.
- **Lantmäteriet Fastighetsprisregistret/-uttag/-avisering:** laglig köpeskilling (pris, datum,
  parter), B2B-licens via Geotorget, **inga publika priser** (offert; kommersiell rabattfaktor 0,95).
  Grov gissning 100k–500k SEK/år beroende på volym.
- **Svensk Mäklarstatistik / Valueguard HOX:** licensierbar prisindex (ingen konkurrensklausul
  till skillnad från Booli), pris ej publikt.
- **Skatteverket taxeringsvärden:** gratis API (säkerhetskrav), men gammal proxy, ej aktuellt pris.
- **Lantmäteriet öppna data (CC0):** kommungränser, adresser, byggnader, ortofoto, höjd — gratis
  även kommersiellt. Kartgrund utan licensaffär.

Källor:
- https://www.booli.se/p/anvandarvillkor
- https://www.affarsvarlden.se/artikel/hemnet-anmaler-booli-till-konkurrensverket
- https://www.lantmateriet.se/globalassets/geodata/geodataprodukter/avgifter_och_leveransinformation_for_geodata.pdf
- https://www.lantmateriet.se/sv/geodata/vara-produkter/produktlista/fastighetsprisavisering/
- https://valueguard.se/erbjudande/valueguard-hox-prisindex/
- https://www.maklarstatistik.se/svensk-maklarstatistiks-api-aggregerad-statistik/
- https://www4.skatteverket.se/rattsligvagledning/edition/2025.1/408739.html
- https://www.lantmateriet.se/oppnadata

## 2. Kontextlager — gratis/öppna API:er (MVP-grunden)

- **Kolada** v3 (sedan 2025-04, gratis, inget avtal): 6000+ kommunnyckeltal (skatt, ekonomi, service). *Kärna.*
- **SCB PxWeb API v2** (okt 2025): befolkning/prognos/sysselsättning. Gräns 150k celler, 30 anrop/10s/IP.
- **JobTech Dev** (Arbetsförmedlingen): JobSearch/Jobstream + yrkestaxonomi. *Kärna för par-vinkeln.*
- **Skolverket** skolenhetsregistret (dagligt), **Trafiklab ResRobot/GTFS Sverige 3** (pendling A→B),
  **Trafikverket NVDB**, **SMHI** (väder, CC BY), **Naturvårdsverket**, **BRÅ/Polisen events**,
  **OpenStreetMap** (ODbL, share-alike → attribuera).

Källor:
- https://www.kolada.se/om-oss/api/
- https://www.scb.se/en/services/open-data-api/pxwebapi/pxapi-2.0
- https://www.jobtechdev.se/
- https://www.skolverket.se/om-skolverket/webbplatser-och-tjanster/oppna-data/api-for-skolenhetsregistret
- https://www.trafiklab.se/api/our-apis/resrobot-v21/
- https://www.trafiklab.se/api/gtfs-datasets/gtfs-sweden/
- https://www.smhi.se/data/oppna-data/meteorologiska-data/api-for-vaderprognosdata-1.34233

## 3. Framtidslager (moat, fragmenterat → fas 3)

- **Lantmäteriet detaljplaner (NGP-API):** ~22 kommuner levererar live (162 har avtal); nyare än
  2022 digitala, 100k+ äldre på papper.
- **TED (EU-upphandlingar):** öppet API, infrastruktur > vägar/järnväg/kollektivtrafik.
- **Regionala trafikförsörjningsplaner:** offentliga men PDF, ingen API (Region Stockholm, VG, m.fl.).
- **Bygglov/nyetableringar:** ingen central öppen data — kräver per-kommun-scan/PDF.
- Förebild: **Nacka kommun** byggde AI-agenter över GIS+detaljplaner+bygglov (lärdom:
  metadata-fragmentering dödar reliabilitet → behöver ren ETL).

Källor:
- https://www.lantmateriet.se/sv/nationella-geodataplattformen/datamangder/detaljplan/
- https://ted.europa.eu/sv/
- https://www.regionstockholm.se/kollektivtrafik/framtidens-kollektivtrafik/
- https://www.nacka.se/boende-miljo/nyheter/2025/12/nackas-fardriktning-nar-ai-moter-geodata-och-bygglov/

## 4. Marknad & affärsmodell (affiliate förkastad)

- **Marknad:** ~1,5 M inrikes flyttar/år (+33 % sedan 2000); 41 % av svenskar har flyttat senaste 5 åren.
- **Affiliate fel:** vid ~3,5 Mkr snittpris går mäklarprovisionen (2–3 %) till mäklaren; referral
  ger dig en bråkdel. Direkt betalning = 80–90 % marginal.
- **Betalningsprejudikat:** skriftlig bostadsvärdering 3 000–10 000 kr, besiktning 4 000 kr+,
  Hemnet-annonspaket 3 650–9 890 kr.
- **Intäktsstege:** (1) betald engångsrapport 2 500–4 500 kr [primär], (2) B2B relocation-firmor
  ~1 500 kr/rapport [snabb], (3) B2G kommunal inflyttarservice 50–150k + 10–30k/år [långsam].

Källor:
- https://www.scb.se/hitta-statistik/sverige-i-siffror/manniskorna-i-sverige/flyttar-inom-sverige/
- https://www.hemnet.se/priser
- https://www.xn--mklarsmart-q5a.se/pris/kostnad-for-skriftlig-vardering
- https://nrgab.com/
- https://www.mynewsdesk.com/se/pitea/pressmeddelanden/move-to-piteaa-en-investering-i-framtiden-3373721

## 5. Konkurrens & internationella förebilder

- **Booli Värdekollen:** ML/kernel-regression på slutpriser — bakåtblickande värdering.
- **Niche.com** (USA, 70 M besök/år): offentlig data + boenderecensioner, skolfokus.
- **AreaVibes** (USA, sedan 2010): livability-score på 50 datapunkter, 35k rankningar. Annons/lead-gen.
- **Vit fläck:** ingen gör par-/dual-career-matchning + framåtblickande framtidssignal. = juvahems moat.

Källor:
- https://www.booli.se/kunskap/fordjupning-sa-funkar-boolis-varderingar
- https://www.niche.com/about/methodology/best-places-to-live/
- https://www.areavibes.com/

## 6. Scoring-metodik (MCDA)

- **WSM (Weighted Sum Model)** i MVP — transparent/förklarbart. TOPSIS som ev. uppgradering; AHP bara
  om reglage känns godtyckligt.
- **Normalisering:** min-max per dimension → 0–1.
- **Dual-career:** jobbdimension = harmoniskt medel / min av person1/person2 (båda måste trivas).
- **Viktinmatning:** budget-allokering (100 poäng) eller reglage.
- **Fälla:** korrelerade variabler dubbelräknas (pris ↔ skatt ↔ inkomst) — håll dimensioner oberoende.

## 7. Go-to-market

- **Norra Sverige-boomen (PR-krok):** Northvolt Skellefteå, Stegra/H2GS Boden, LKAB Luleå, Gällivare →
  ~100 000 fler personer behövs till 2035, 10–15k jobb, akut bostadsbrist, inflyttare vill ha småhus.
- **Programmatisk SEO** för 290 kommuner (long-tail "flytta till X") — incumbenter ignorerar long-tail.
- **Data-som-PR:** släpp rankningar media plockar upp. **Community:** Norrlandsflytt-grupper, bostadsforum.

Källor:
- https://www.villaagarna.se/debatt/smahusbyggande/industri-boom-i-norrland--tiotusentals-fler-hus-behovs/
- https://www.hemhyra.se/nyheter/tusentals-grona-jobb-skapar-akut-bostadsbrist-och-oro-i-norrland/
- https://backlinko.com/programmatic-seo

## Kunskapsluckor / att verifiera före kommersiell satsning

- PRV/EUIPO/Bolagsverket: varumärkeskoll "Juva"/"Juvahem" (juvahem.de finns i tysk heminredning).
- Lantmäteriet/Valueguard faktiska priser = offert krävs.
- ResRobot exakt gratiskvot (pendling i skala = enda tekniska skalfällan).
