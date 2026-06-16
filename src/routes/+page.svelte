<script>
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
  <title>Juvahem — var ska ni bo?</title>
  <meta
    name="description"
    content="Juvahem hjälper par hitta rätt plats att flytta till — utifrån era jobb, er budget och ert liv. Inte generiska topplistor."
  />
  <meta property="og:title" content="Juvahem — var ska ni bo?" />
  <meta
    property="og:description"
    content="Beslutsverktyget för par som vill hitta en ny plats att bo på."
  />
  <meta property="og:type" content="website" />
  <link rel="canonical" href="https://juvahem.se/" />
</svelte:head>

<div class="wrap home">
  <header>
    <a class="brand" href="/"><span class="dot">🏡</span> Juvahem</a>
    <a class="btn small" href="/jamfor">Testa verktyget</a>
  </header>

  <div class="hero">
    <h1>Var ska <span class="accent">ni</span> bo?</h1>
    <p class="lead">
      Juvahem hjälper par hitta rätt plats att flytta till — utifrån <b>era</b> jobb, er budget och
      ert liv. Inte generiska topplistor, utan en rankning byggd på ert pars kombinerade profil.
    </p>
    <div class="cta-row">
      <a class="btn" href="/jamfor">Ranka kommunerna åt oss</a>
      <a class="btn ghost" href="#sa-funkar-det">Så funkar det</a>
    </div>
  </div>

  <section id="sa-funkar-det">
    <h2>Så funkar det</h2>
    <div class="steps">
      <div class="card step">
        <span class="n">1</span><h3>Berätta om er</h3>
        <p>Era yrken, hushåll och vad ni vill ha — vikta jobb, ekonomi och tillväxt mot varandra.</p>
      </div>
      <div class="card step">
        <span class="n">2</span><h3>Vi rankar 290 kommuner</h3>
        <p>Mot jobbmarknaden för er <i>båda</i>, kommunalskatt och befolkningstrend — live.</p>
      </div>
      <div class="card step">
        <span class="n">3</span><h3>Ni får ett svar</h3>
        <p>En rankad lista med poäng, förklaring per faktor och en karta över hela landet.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Varför Juvahem?</h2>
    <ul class="why">
      <li>
        <b>Ingen annan tar ert kombinerade pars-profil.</b> Topplistor över "bästa orter" bryr sig inte
        om att <i>båda</i> behöver kunna jobba.
      </li>
      <li>
        <b>Beslutet är för stort för magkänsla och spridda webbflikar.</b> Jobb, ekonomi och tillväxt på
        ett ställe, vägt mot er.
      </li>
      <li>
        <b>Byggt av ett par som själva gjorde resan.</b> Vi flyttade — och insåg att verktyget vi önskade
        inte fanns.
      </li>
    </ul>
  </section>

  <section>
    <div id="vantelista">
      <h2>Vill ni ha er färdiga rapport när den är klar?</h2>
      <p>Verktyget rankar redan live. Skriv upp er så hör vi av oss när den fördjupade rapporten öppnar.</p>
      {#if status === 'done'}
        <div class="ok">Tack! Ni står på listan — vi hör av oss. 🏡</div>
      {:else}
        <form onsubmit={submit}>
          <input
            type="email"
            bind:value={email}
            placeholder="er.mejl@exempel.se"
            required
            aria-label="E-post"
          />
          <button class="btn" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Skickar…' : 'Skriv upp oss'}
          </button>
        </form>
        {#if status === 'error'}<p class="err">{errorMsg}</p>{/if}
      {/if}
      <p class="note">Vi mejlar bara om Juvahem. Ingen spam, inga vidareförsäljningar.</p>
    </div>
  </section>

  <footer>
    Juvahem · juvahem.se · ett verktyg för par som vill hitta en ny plats att bo på.<br />
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
  .accent {
    color: var(--accent);
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
