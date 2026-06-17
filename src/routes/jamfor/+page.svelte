<script>
  import { communes } from '$lib/data/communes.js';
  import { rankCommunes } from '$lib/score.js';
  import PersonColumns from '$lib/components/PersonColumns.svelte';
  import WeightSliders from '$lib/components/WeightSliders.svelte';
  import RankedList from '$lib/components/RankedList.svelte';
  import Map from '$lib/components/Map.svelte';

  // Life-situation presets — pick one to set how many people and the default
  // weights. juvahem ranks against YOUR situation, not a generic top-list. As more
  // dimensions land (schools/safety/transit) their weights get added per situation.
  const SITUATIONS = [
    { id: 'par', label: 'Par som jobbar', icon: '👫', persons: 2,
      weights: { jobs: 45, tax: 20, energy: 20, growth: 15 } },
    { id: 'singel', label: 'Singel', icon: '🧍', persons: 1,
      weights: { jobs: 45, tax: 20, energy: 20, growth: 15 } },
    { id: 'familj', label: 'Familj med barn', icon: '👨‍👩‍👧', persons: 2,
      weights: { jobs: 35, tax: 15, energy: 20, growth: 30 } },
    { id: 'pensionar', label: 'Pensionär', icon: '🌅', persons: 2,
      weights: { jobs: 5, tax: 35, energy: 35, growth: 25 } },
    { id: 'distans', label: 'Distansarbetare', icon: '💻', persons: 1,
      weights: { jobs: 15, tax: 25, energy: 35, growth: 25 } }
  ];

  let profile = $state({
    persons: [{ occupationCode: '' }, { occupationCode: '' }],
    weights: { jobs: 45, tax: 20, energy: 20, growth: 15, price: 0, commute: 0 }
  });
  let situation = $state(null);

  let step = $state(0); // 0 situation · 1 persons · 2 weights · 3 results
  let view = $state('list'); // list | map

  function pickSituation(s) {
    profile.persons = Array.from(
      { length: s.persons },
      (_, i) => profile.persons[i] ?? { occupationCode: '' }
    );
    profile.weights = { ...profile.weights, ...s.weights };
    situation = s.id;
    step = 1;
  }

  // Live ranking — recomputes on every profile change.
  const ranked = $derived(rankCommunes(communes, profile));
  const single = $derived(profile.persons.length === 1);

  const STEPS = ['Situation', 'Yrken', 'Vikter', 'Resultat'];
</script>

<svelte:head>
  <title>Ranka kommunerna — Juvahem</title>
  <meta name="description" content="Fyll i ert pars profil och få alla 290 kommuner rankade live." />
</svelte:head>

<div class="wrap">
  <header>
    <a class="brand" href="/"><span class="dot">🏡</span> Juvahem</a>
  </header>

  <nav class="steps">
    {#each STEPS as s, i (s)}
      <button
        class="chip"
        class:active={step === i}
        class:done={step > i}
        type="button"
        onclick={() => (step = i)}
      >
        <span class="dot">{i + 1}</span>{s}
      </button>
    {/each}
  </nav>

  {#if step === 0}
    <section class="panel">
      <h1>Var ska du bo?</h1>
      <p class="lead">
        Vi rankar Sveriges alla 290 kommuner mot <b>din</b> situation — jobb, skatt, elkostnad
        och befolkningstrend, vägt som det passar dig. Börja med vilken situation som stämmer:
      </p>
      <div class="situations">
        {#each SITUATIONS as s (s.id)}
          <button class="sit" type="button" onclick={() => pickSituation(s)}>
            <span class="ico">{s.icon}</span>{s.label}
          </button>
        {/each}
      </div>
    </section>
  {:else if step === 1}
    <section class="panel">
      <h2>{single ? 'Ditt yrke' : 'Era yrken'}</h2>
      <p class="sub">
        Välj yrkesområde — det driver jobb-dimensionen{single ? '' : ' för er båda (harmoniskt medel: båda måste kunna jobba)'}.
        Hoppa över om jobb inte är relevant (t.ex. pensionär) — då räknas det inte.
      </p>
      <PersonColumns bind:persons={profile.persons} />
      <div class="actions">
        <button class="btn" type="button" onclick={() => (step = 2)}>Vidare till vikter →</button>
      </div>
    </section>
  {:else if step === 2}
    <section class="panel">
      <h2>Vad väger tyngst för er?</h2>
      <p class="sub">Dra reglagen. Rankningen längst ner uppdateras direkt.</p>
      <WeightSliders bind:weights={profile.weights} />
      <div class="actions">
        <button class="btn" type="button" onclick={() => (step = 3)}>Se resultatet →</button>
      </div>
    </section>
  {:else}
    <section class="panel">
      <div class="results-head">
        <h2>Era topp-kommuner</h2>
        <div class="toggle">
          <button class:active={view === 'list'} type="button" onclick={() => (view = 'list')}>Lista</button>
          <button class:active={view === 'map'} type="button" onclick={() => (view = 'map')}>Karta</button>
        </div>
      </div>
      <p class="sub">
        Rankat mot er profil. Klicka en kommun för att se varför den hamnar där. Justera vikterna när
        som helst — listan rankar om sig live.
      </p>

      {#if view === 'list'}
        <RankedList {ranked} limit={20} persons={profile.persons} />
      {:else}
        <Map {ranked} />
      {/if}

      <details class="tune">
        <summary>Justera vikter</summary>
        <WeightSliders bind:weights={profile.weights} />
      </details>
    </section>
  {/if}
</div>

<style>
  header {
    padding: 22px 0;
  }
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 22px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: 999px;
    padding: 7px 14px 7px 8px;
    font-size: 14px;
    cursor: pointer;
    color: var(--muted);
  }
  .chip .dot {
    display: inline-flex;
    width: 22px;
    height: 22px;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent-dark);
    font-weight: 700;
    font-size: 12px;
  }
  .chip.active {
    border-color: var(--accent);
    color: var(--ink);
    font-weight: 600;
  }
  .chip.done .dot {
    background: var(--accent);
    color: #fff;
  }
  .panel {
    margin-bottom: 40px;
  }
  h1 {
    font-size: clamp(28px, 5vw, 44px);
    letter-spacing: -0.02em;
    margin: 0 0 14px;
  }
  h2 {
    font-size: clamp(22px, 3.4vw, 28px);
    margin: 0 0 6px;
  }
  .lead {
    font-size: 19px;
    color: var(--muted);
    max-width: 64ch;
    margin: 0 0 24px;
  }
  .sub {
    color: var(--muted);
    margin: 0 0 22px;
  }
  .actions {
    margin-top: 24px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .situations {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-top: 8px;
  }
  .sit {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: 12px;
    padding: 16px 18px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
    text-align: left;
  }
  .sit:hover {
    border-color: var(--accent);
    background: #fbf8f2;
  }
  .sit .ico {
    font-size: 24px;
  }
  .results-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .toggle {
    display: inline-flex;
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
  }
  .toggle button {
    border: 0;
    background: var(--card);
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    color: var(--muted);
  }
  .toggle button.active {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }
  .tune {
    margin-top: 24px;
    border-top: 1px solid var(--line);
    padding-top: 16px;
  }
  .tune summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--accent-dark);
    margin-bottom: 16px;
  }
</style>
