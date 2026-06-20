<script>
  import Button from '$lib/components/ui/Button.svelte';
  import PlannedFeature from '$lib/components/ui/PlannedFeature.svelte';

  let email = $state('');
  let status = $state('idle'); // idle | sending | done | error
  let errorMsg = $state('');

  async function submit(e) {
    e.preventDefault();
    status = 'sending';
    errorMsg = '';
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email })
      });
      if (r.ok) {
        status = 'done';
      } else {
        const data = await r.json().catch(() => ({}));
        errorMsg = data.error || 'Något gick fel — försök igen om en stund.';
        status = 'error';
      }
    } catch {
      errorMsg = 'Något gick fel — försök igen om en stund.';
      status = 'error';
    }
  }
</script>

<svelte:head>
  <title>Juvahem — Sveriges 290 kommuner, rankade mot dina prioriteringar</title>
  <meta
    name="description"
    content="Juvahem rankar alla 290 svenska kommuner mot just dina prioriteringar — jobb, skatt, bostadspris, trygghet och mer. Transparent, datadrivet, live. Inte generiska topplistor."
  />
  <meta property="og:title" content="Juvahem — rankade mot dina prioriteringar" />
  <meta
    property="og:description"
    content="Alla 290 kommuner rankade mot dina prioriteringar — transparent och datadrivet."
  />
  <meta property="og:type" content="website" />
  <link rel="canonical" href="https://juvahem.se/" />
</svelte:head>

<div class="wrap home">
  <header>
    <a class="brand" href="/"><span class="dot">🏡</span> Juvahem</a>
    <Button href="/jamfor" size="small">Öppna verktyget</Button>
  </header>

  <div class="hero">
    <span class="eyebrow">Datadrivet · transparent · live</span>
    <h1>Sveriges 290 kommuner, rankade mot <span class="accent">dina</span> prioriteringar.</h1>
    <p class="lead">
      Säg vad som väger tyngst — jobb, skatt, bostadspris, trygghet — så rankar Juvahem hela landet
      mot just det. Transparent och datadrivet, med förklaring per faktor. Inte generiska topplistor.
    </p>
    <div class="cta-row">
      <Button href="/jamfor">Ranka kommunerna</Button>
      <Button href="#sa-funkar-det" variant="ghost">Så funkar det</Button>
    </div>
    <p class="datacred">Byggt på öppna data: SCB · Kolada · JobTech · ResRobot</p>
  </div>

  <section id="sa-funkar-det">
    <h2>Så funkar det</h2>
    <div class="steps">
      <div class="card step">
        <span class="n">1</span><h3>Vikta faktorerna</h3>
        <p>Dra reglagen för vad som betyder mest för dig — jobb, ekonomi, pris, trygghet, tillväxt.</p>
      </div>
      <div class="card step">
        <span class="n">2</span><h3>290 kommuner rankas live</h3>
        <p>Varje kommun får en poäng mot dina vikter — listan rankar om sig direkt när du justerar.</p>
      </div>
      <div class="card step">
        <span class="n">3</span><h3>Se varför — inte bara vad</h3>
        <p>Poäng, bidrag per faktor, datatäckning och en karta över hela landet. Inget svart hål.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Varför Juvahem?</h2>
    <ul class="why">
      <li>
        <b>Rankat mot dig, inte mot ett genomsnitt.</b> Topplistor över "bästa orter" väger faktorerna
        åt alla lika. Här bestämmer du vad som räknas.
      </li>
      <li>
        <b>Transparent hela vägen.</b> Varje poäng går att bryta ner per faktor, med datakälla och
        datatäckning synlig — du ser var siffran är säker och var den är tunn.
      </li>
      <li>
        <b>Ett ställe i stället för tjugo flikar.</b> Jobb, skatt, bostadspris, skola, trygghet och
        tillväxt samlat och vägt — på sekunder, inte en helg.
      </li>
    </ul>
  </section>

  <section>
    <h2>På väg</h2>
    <div class="mb-6 max-w-[420px]">
      <PlannedFeature
        label="Fördjupad rapport"
        hint="Per-kommun-djupdyk: pendling, skola, marknad och prognoser samlat — utöver live-indexet."
      />
    </div>

    <div id="vantelista">
      <h2>Vill du ha den fördjupade rapporten när den öppnar?</h2>
      <p>Verktyget rankar redan live. Skriv upp dig så hör vi av oss när den fördjupade rapporten är klar.</p>
      {#if status === 'done'}
        <div class="ok">Tack! Du står på listan — vi hör av oss. 🏡</div>
      {:else}
        <form onsubmit={submit}>
          <input
            type="email"
            bind:value={email}
            placeholder="din.mejl@exempel.se"
            required
            aria-label="E-post"
          />
          <Button
            type="submit"
            disabled={status === 'sending'}
            class="bg-white text-accent-dark hover:bg-[#f1efe9]"
          >
            {status === 'sending' ? 'Skickar…' : 'Skriv upp mig'}
          </Button>
        </form>
        {#if status === 'error'}<p class="err">{errorMsg}</p>{/if}
      {/if}
      <p class="note">Vi mejlar bara om Juvahem. Ingen spam, inga vidareförsäljningar.</p>
    </div>
  </section>

  <footer>
    Juvahem · juvahem.se · alla 290 kommuner rankade mot dina prioriteringar.<br />
    Frågor? <a href="mailto:hej@juvahem.se">hej@juvahem.se</a>
  </footer>
</div>

<style>
  header {
    padding: 26px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .hero {
    padding: 48px 0 36px;
  }
  .hero h1 {
    font-size: clamp(34px, 6vw, 56px);
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin: 0 0 18px;
  }
  .hero .eyebrow {
    display: block;
    margin-bottom: 14px;
  }
  .accent {
    color: var(--gold-dark);
  }
  .lead {
    font-size: clamp(18px, 2.6vw, 22px);
    color: var(--muted);
    margin: 0 0 30px;
    max-width: 62ch;
  }
  .cta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .datacred {
    margin: 22px 0 0;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.02em;
  }
  section {
    padding: 40px 0;
    border-top: 1px solid var(--line);
  }
  h2 {
    font-size: clamp(24px, 3.4vw, 30px);
    letter-spacing: -0.02em;
    margin: 0 0 26px;
  }
  .steps {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 640px) {
    .steps {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .step .n {
    display: inline-flex;
    width: 30px;
    height: 30px;
    align-items: center;
    justify-content: center;
    background: var(--accent-soft);
    color: var(--accent-dark);
    border-radius: 8px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .step h3 {
    margin: 0 0 6px;
    font-size: 17px;
  }
  .step p {
    margin: 0;
    color: var(--muted);
    font-size: 15px;
  }
  .why li {
    margin: 0 0 12px;
    color: var(--muted);
  }
  .why b {
    color: var(--ink);
  }
  #vantelista {
    background: var(--accent);
    color: #fff;
    border-radius: 18px;
    padding: 36px 26px;
  }
  #vantelista h2 {
    color: #fff;
    margin-bottom: 8px;
  }
  #vantelista p {
    color: #e7efe8;
    margin: 0 0 22px;
    max-width: 54ch;
  }
  form {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  input[type='email'] {
    flex: 1 1 240px;
    min-width: 0;
    padding: 14px 16px;
    border: 0;
    border-radius: 11px;
    font-size: 16px;
  }
  form .btn {
    background: #fff;
    color: var(--accent-dark);
  }
  form .btn:hover {
    background: #f1efe9;
  }
  .ok {
    background: #eef7f0;
    color: var(--accent-dark);
    border-radius: 11px;
    padding: 14px 16px;
    font-weight: 600;
  }
  .err {
    color: #ffe0d6;
    font-size: 14px;
    margin: 10px 0 0;
  }
  .note {
    font-size: 13px;
    color: #cfe0d4 !important;
    margin-top: 12px !important;
  }
  footer {
    padding: 34px 0 50px;
    color: var(--muted);
    font-size: 14px;
    border-top: 1px solid var(--line);
  }
</style>
