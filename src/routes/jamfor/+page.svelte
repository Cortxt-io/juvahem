<script>
  import { onMount } from 'svelte';
  import { communes } from '$lib/data/communes.js';
  import { rankCommunes, INVEST_DIMENSIONS } from '$lib/score.js';
  import { getPreset, dimensionsForProfile, BALANCED_WEIGHTS } from '$lib/presets.js';
  import PresetPicker from '$lib/components/PresetPicker.svelte';
  import PersonColumns from '$lib/components/PersonColumns.svelte';
  import WeightSliders from '$lib/components/WeightSliders.svelte';
  import RankedList from '$lib/components/RankedList.svelte';
  import Map from '$lib/components/Map.svelte';
  import PlannedFeature from '$lib/components/ui/PlannedFeature.svelte';

  // Neutral default — one optional person, an even spread of factors. No persona.
  let profile = $state({
    persons: [{ occupationCode: '' }],
    lockDualCareer: false,
    weights: {
      ...BALANCED_WEIGHTS,
      commute: 0,
      // "Investera här"-vikter (egna nycklar, krockar inte med bo-läget):
      price_trend: 45, demand: 25, price_entry: 15, activity: 15
    }
  });
  let preset = $state(null); // chosen snabbval slug (null = neutral default weights)
  let custom = $state(false); // true once the user hand-tunes weights off a snabbval

  let mode = $state('bo'); // bo | invest — two modes, one engine
  let priorityLowPrice = $state(false); // invest toggle: bias toward low köpeskilling
  let highlighted = $state(null); // kommunkod hovered in list OR map — syncs both
  let panelOpen = $state(false); // narrow screens: filter panel as a left slide-in drawer

  // Bonus toggle — bumps the (same SCB) price dimension's weight in invest mode.
  function toggleLowPrice() {
    profile.weights.price_entry = priorityLowPrice ? 70 : 15;
  }

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

  // Apply a snabbval (life-situation): persons count, weights, dual-career lock.
  function applyPreset(p) {
    profile.persons = Array.from(
      { length: p.persons },
      (_, i) => profile.persons[i] ?? { occupationCode: '' }
    );
    profile.weights = { ...profile.weights, ...p.weights };
    profile.lockDualCareer = p.lockDualCareer;
    preset = p.slug;
    custom = false;
    syncUrl();
  }

  // The "bo" dimension set honours lockDualCareer; invest mode uses its own set.
  const ranked = $derived(
    rankCommunes(communes, profile, mode === 'invest' ? INVEST_DIMENSIONS : dimensionsForProfile(profile))
  );

  // The hovered kommun (from list OR map) — surfaced even when it's outside the
  // rendered top-20, so a map hover never silently misses.
  const hlEntry = $derived(highlighted ? ranked.find((r) => r.kommunkod === highlighted) : null);

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

  // A hand-tune flips the active snabbval into "Anpassad — baserad på X" and re-syncs URL.
  function markCustom() {
    if (preset && !custom) custom = true;
    syncUrl();
  }

  function setMode(m) {
    mode = m;
    syncUrl();
  }

  onMount(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('mode') === 'invest') mode = 'invest';
    const p = getPreset(q.get('preset'));
    if (p) applyPreset(p);
    const w = q.get('w');
    if (w) {
      for (const pair of w.split(',')) {
        const [k, v] = pair.split(':');
        if (BO_KEYS.includes(k)) profile.weights[k] = Number(v) || 0;
      }
      custom = true;
    }
  });
</script>

<svelte:head>
  <title>Ranka kommunerna — Juvahem</title>
  <meta name="description" content="Sveriges alla 290 kommuner rankade live mot dina prioriteringar — jobb, skatt, pris, trygghet och mer." />
</svelte:head>

<div class="wrap wide">
  <header class="topbar">
    <a class="brand" href="/"><span class="dot">🏡</span> Juvahem</a>
  </header>

  <div class="intro">
    <span class="eyebrow">Sveriges 290 kommuner · live-index</span>
    <h1>Rankade mot {mode === 'invest' ? 'din investering' : 'dina prioriteringar'}.</h1>
    <p class="lead">
      Välj ett snabbval eller justera vikterna i panelen — index och karta sorterar om sig direkt. Ettan glöder guld.
    </p>
  </div>

  <div class="tabsrow">
    <div class="tabs" role="tablist" aria-label="Läge">
      <button class="tab" role="tab" type="button" class:active={mode === 'bo'}
        aria-selected={mode === 'bo'} onclick={() => setMode('bo')}>Bo här</button>
      <button class="tab" role="tab" type="button" class:active={mode === 'invest'}
        aria-selected={mode === 'invest'} onclick={() => setMode('invest')}>Investera här</button>
    </div>
    <button class="btn small filterbtn" type="button" onclick={() => (panelOpen = true)}>
      ⚙ Sökfilter
    </button>
  </div>

  <div class="layout">
    <main class="main">
      <div class="atlas-map">
        <Map {ranked} {highlighted} onhover={(k) => (highlighted = k)} />
      </div>

      <div class="index-head">
        <span class="eyebrow">{mode === 'invest' ? 'Index · investering' : 'Index · boende'}</span>
        {#if hlEntry}
          <span class="hlchip tnum">{hlEntry.name} · #{hlEntry.rank} · {hlEntry.score.toFixed(1)}</span>
        {/if}
      </div>
      <p class="sub">Klicka en kommun för att se varför. Hovra för att hitta den på kartan.</p>
      <RankedList
        {ranked}
        limit={20}
        persons={profile.persons}
        {profile}
        {mode}
        {highlighted}
        onhover={(k) => (highlighted = k)}
      />
    </main>

    <aside class="panel" class:open={panelOpen}>
      <div class="panel-head">
        <span class="eyebrow">Sökfilter</span>
        <button class="panel-close" type="button" onclick={() => (panelOpen = false)} aria-label="Stäng filter">✕</button>
      </div>
      <div class="panel-card">
        <div class="psection">
          <span class="eyebrow">{mode === 'invest' ? 'Vikta investeringen' : 'Vikter'}</span>
          {#if mode === 'invest'}
            <label class="lowprice">
              <input type="checkbox" bind:checked={priorityLowPrice} onchange={toggleLowPrice} />
              Prioritera låg köpeskilling
            </label>
            <WeightSliders bind:weights={profile.weights} dims={INVEST_SLIDERS} hint={INVEST_HINT} />
            <div class="mt-4">
              <PlannedFeature
                label="Avkastning per objekt"
                note="kräver licensierad data"
                hint="Makro-screeningen visar var marknaden vuxit och är aktiv. Avkastning per objekt kräver licensierad fastighetsdata — på väg."
              />
            </div>
          {:else}
            <WeightSliders bind:weights={profile.weights} onchange={markCustom} />
          {/if}
        </div>

        {#if mode !== 'invest'}
          <div class="psection">
            <span class="eyebrow">Jobbmatchning · valfritt</span>
            <PersonColumns bind:persons={profile.persons} />
            {#if profile.persons.length >= 2}
              <label class="dc">
                <input type="checkbox" bind:checked={profile.lockDualCareer} />
                Båda måste kunna jobba (dual-career — straffar orter som bara passar en)
              </label>
            {/if}
          </div>
        {/if}

        <div class="psection psection--compact">
          <span class="eyebrow">Snabbval · valfri genväg</span>
          <PresetPicker selected={preset} {custom} onpick={(p) => applyPreset(p)} />
        </div>
      </div>
    </aside>

    {#if panelOpen}
      <button class="backdrop" type="button" aria-label="Stäng filter" onclick={() => (panelOpen = false)}></button>
    {/if}
  </div>
</div>

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 0 14px;
    flex-wrap: wrap;
  }
  .tabsrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 20px;
  }
  .tabs {
    display: flex;
    gap: 4px;
  }
  .filterbtn {
    display: none;
    flex: none;
    margin-bottom: 8px;
  }
  .panel-head {
    display: none;
  }
  .tab {
    border: 0;
    background: none;
    padding: 10px 16px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .tab:hover {
    color: var(--ink);
  }
  .tab.active {
    color: var(--ink);
    border-bottom-color: var(--accent);
  }
  .intro {
    margin: 6px 0 18px;
    display: grid;
    gap: 6px;
  }
  .intro h1 {
    font-size: clamp(26px, 4vw, 42px);
    line-height: 1.05;
    margin: 0;
    max-width: 18ch;
  }
  .lead {
    font-size: 16px;
    color: var(--muted);
    margin: 4px 0 0;
    max-width: 56ch;
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 22px;
    align-items: start;
    padding-bottom: 50px;
  }
  @media (min-width: 1000px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 340px;
    }
    .panel {
      position: sticky;
      top: 18px;
    }
  }
  .main {
    min-width: 0;
  }
  .atlas-map {
    margin-bottom: 18px;
    min-width: 0;
  }
  .panel-card {
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: 14px;
    overflow: hidden;
  }
  .psection {
    padding: 16px;
  }
  .psection + .psection {
    border-top: 1px solid var(--line);
  }
  .psection .eyebrow {
    display: block;
    margin-bottom: 12px;
  }
  .psection--compact {
    padding: 12px 16px;
  }
  .psection--compact .eyebrow {
    margin-bottom: 8px;
  }
  .lowprice,
  .dc {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    line-height: 1.4;
  }
  .lowprice {
    margin-bottom: 16px;
  }
  .dc {
    margin-top: 14px;
    color: var(--ink);
  }

  .index-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }
  .hlchip {
    font-size: 12px;
    color: #fff;
    background: var(--ink);
    padding: 3px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .sub {
    color: var(--muted);
    font-size: 13px;
    margin: 0 0 16px;
  }

  /* Narrow: the filter panel becomes a left slide-in drawer behind a "Sökfilter" button. */
  @media (max-width: 999px) {
    .filterbtn {
      display: inline-flex;
    }
    .panel {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: min(340px, 86vw);
      z-index: 50;
      background: var(--bg);
      padding: 16px;
      overflow-y: auto;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      box-shadow: 2px 0 24px rgba(20, 30, 28, 0.18);
    }
    .panel.open {
      transform: translateX(0);
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .panel-close {
      border: 0;
      background: none;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      color: var(--muted);
      padding: 4px 6px;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      border: 0;
      cursor: pointer;
      background: rgba(20, 30, 28, 0.4);
    }
  }
</style>
