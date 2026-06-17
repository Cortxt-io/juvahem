<script>
  import { onMount } from 'svelte';
  import { communes } from '$lib/data/communes.js';
  import { rankCommunes, INVEST_DIMENSIONS } from '$lib/score.js';
  import { PRESETS, getPreset, dimensionsForProfile } from '$lib/presets.js';
  import PresetPicker from '$lib/components/PresetPicker.svelte';
  import PersonColumns from '$lib/components/PersonColumns.svelte';
  import WeightSliders from '$lib/components/WeightSliders.svelte';
  import RankedList from '$lib/components/RankedList.svelte';
  import Map from '$lib/components/Map.svelte';

  let profile = $state({
    persons: [{ occupationCode: '' }, { occupationCode: '' }],
    lockDualCareer: true,
    weights: {
      jobs: 35, tax: 15, energy: 15, schools: 5, safety: 10, transit: 5, growth: 15, price: 0, commute: 0,
      // "Investera här"-vikter (egna nycklar, krockar inte med bo-läget):
      price_trend: 45, demand: 25, price_entry: 15, activity: 15
    }
  });
  let preset = $state(null); // chosen preset slug (null = today's default weights)
  let custom = $state(false); // true once the user hand-tunes weights off a preset

  let mode = $state('bo'); // bo | invest — two modes, one engine
  let priorityLowPrice = $state(false); // invest toggle: bias toward low köpeskilling

  // Bonus toggle — bumps the (same SCB) price dimension's weight in invest mode.
  function toggleLowPrice() {
    profile.weights.price_entry = priorityLowPrice ? 70 : 15;
  }
  let step = $state(0); // 0 situation · 1 persons · 2 weights · 3 results
  let view = $state('list'); // list | map

  // Slider set + helper text for the "investera här"-mode.
  const INVEST_SLIDERS = [
    { key: 'price_trend', label: 'Prisutveckling 5 år' },
    { key: 'price_entry', label: 'Lågt insteg (pris)' },
    { key: 'demand', label: 'Efterfrågan (befolkning)' },
    { key: 'activity', label: 'Marknadsaktivitet (antal köp)' }
  ];
  const INVEST_HINT =
    'Makro-screening på kommunnivå (fria SCB-data). Visar var marknaden vuxit och är aktiv — ' +
    'inte avkastning per objekt (det kräver licensierad fastighetsdata).';

  // Apply a life-situation preset: persons count, weights, dual-career lock.
  function applyPreset(p, { goToStep = 1 } = {}) {
    profile.persons = Array.from(
      { length: p.persons },
      (_, i) => profile.persons[i] ?? { occupationCode: '' }
    );
    profile.weights = { ...profile.weights, ...p.weights };
    profile.lockDualCareer = p.lockDualCareer;
    preset = p.slug;
    custom = false;
    step = goToStep;
    syncUrl();
  }

  // The "bo" dimension set honours lockDualCareer; invest mode uses its own set.
  const ranked = $derived(
    rankCommunes(communes, profile, mode === 'invest' ? INVEST_DIMENSIONS : dimensionsForProfile(profile))
  );
  const single = $derived(profile.persons.length === 1);

  // --- URL state (?preset=family & optional &w=jobs:35,...) ---
  const BO_KEYS = ['jobs', 'tax', 'energy', 'schools', 'safety', 'transit', 'growth', 'price', 'commute'];

  function syncUrl() {
    if (typeof history === 'undefined') return;
    const params = new URLSearchParams();
    if (mode === 'invest') params.set('mode', 'invest');
    if (preset) params.set('preset', preset);
    if (custom) params.set('w', BO_KEYS.map((k) => `${k}:${profile.weights[k] ?? 0}`).join(','));
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  // A hand-tune flips the active preset into "Anpassad — baserad på X" and re-syncs URL.
  function markCustom() {
    if (preset && !custom) custom = true;
    syncUrl();
  }

  onMount(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('mode') === 'invest') mode = 'invest';
    const p = getPreset(q.get('preset'));
    if (p) applyPreset(p, { goToStep: 3 }); // shared link lands on results
    const w = q.get('w');
    if (w) {
      for (const pair of w.split(',')) {
        const [k, v] = pair.split(':');
        if (BO_KEYS.includes(k)) profile.weights[k] = Number(v) || 0;
      }
      custom = true;
      step = 3;
    }
  });

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

  <div class="mode">
    <button class="modebtn" class:active={mode === 'bo'} type="button" onclick={() => (mode = 'bo')}>
      🏡 Bo här
    </button>
    <button class="modebtn" class:active={mode === 'invest'} type="button" onclick={() => (mode = 'invest')}>
      📈 Investera här
    </button>
  </div>

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
        och befolkningstrend, vägt som det passar dig. Börja med vem du är:
      </p>
      <PresetPicker selected={preset} {custom} onpick={(p) => applyPreset(p)} />
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
      <h2>{mode === 'invest' ? 'Vad väger tyngst i investeringen?' : 'Vad väger tyngst för er?'}</h2>
      <p class="sub">Dra reglagen. Rankningen längst ner uppdateras direkt.</p>
      {#if mode === 'invest'}
        <label class="lowprice">
          <input type="checkbox" bind:checked={priorityLowPrice} onchange={toggleLowPrice} />
          Prioritera låg köpeskilling (billigt insteg väger tyngst)
        </label>
        <WeightSliders bind:weights={profile.weights} dims={INVEST_SLIDERS} hint={INVEST_HINT} />
      {:else}
        <WeightSliders bind:weights={profile.weights} onchange={markCustom} />
      {/if}
      <div class="actions">
        <button class="btn" type="button" onclick={() => (step = 3)}>Se resultatet →</button>
      </div>
    </section>
  {:else}
    <section class="panel">
      <div class="results-head">
        <h2>{mode === 'invest' ? 'Topp för investering' : 'Era topp-kommuner'}</h2>
        <div class="toggle">
          <button class:active={view === 'list'} type="button" onclick={() => (view = 'list')}>Lista</button>
          <button class:active={view === 'map'} type="button" onclick={() => (view = 'map')}>Karta</button>
        </div>
      </div>
      <p class="sub">
        {#if preset}Profil: <b>{getPreset(preset)?.label}{custom ? ' (anpassad)' : ''}</b>. {/if}
        Rankat mot er profil. Klicka en kommun för att se varför den hamnar där. Justera vikterna när
        som helst — listan rankar om sig live.
      </p>

      {#if view === 'list'}
        <RankedList {ranked} limit={20} persons={profile.persons} {profile} {mode} />
      {:else}
        <Map {ranked} />
      {/if}

      <details class="tune">
        <summary>Justera vikter</summary>
        {#if mode === 'invest'}
          <WeightSliders bind:weights={profile.weights} dims={INVEST_SLIDERS} hint={INVEST_HINT} />
        {:else}
          <WeightSliders bind:weights={profile.weights} onchange={markCustom} />
        {/if}
      </details>
    </section>
  {/if}
</div>

<style>
  header {
    padding: 22px 0;
  }
  .mode {
    display: inline-flex;
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
    margin: 4px 0 16px;
  }
  .modebtn {
    border: 0;
    background: var(--card);
    padding: 10px 20px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    color: var(--muted);
  }
  .modebtn.active {
    background: var(--accent);
    color: #fff;
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
  .lowprice {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    cursor: pointer;
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
