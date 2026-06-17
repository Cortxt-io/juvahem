<script>
  // Dev-only tuning surface for the Fas 1.5 interpretation layer: raw normalized
  // factors side-by-side with the generated text, so thresholds in explain.js can be
  // tuned by eye. Not linked anywhere / not in the sitemap — reach it at /debug.
  import { communes } from '$lib/data/communes.js';
  import { rankCommunes, DIMENSIONS, INVEST_DIMENSIONS } from '$lib/score.js';
  import { explain, THRESHOLDS } from '$lib/explain.js';

  let mode = $state('bo');
  let weightsText = $state('jobs:35, tax:15, growth:15, energy:15, safety:10, schools:5, transit:5');
  let investWeights = $state('price_trend:45, demand:25, price_entry:15, activity:15');

  function parseWeights(str) {
    const w = {};
    for (const pair of str.split(',')) {
      const [k, v] = pair.split(':').map((s) => s.trim());
      if (k) w[k] = Number(v) || 0;
    }
    return w;
  }

  const dims = $derived(mode === 'invest' ? INVEST_DIMENSIONS : DIMENSIONS);
  const profile = $derived({
    persons: [{ occupationCode: null }, { occupationCode: null }],
    weights: parseWeights(mode === 'invest' ? investWeights : weightsText)
  });
  const ranked = $derived(rankCommunes(communes, profile, dims));
  const byKod = $derived(new Map(communes.map((c) => [c.kommunkod, c])));
  const rows = $derived(
    ranked.slice(0, 25).map((r) => ({ r, ex: explain(r, byKod.get(r.kommunkod)) }))
  );
</script>

<svelte:head><title>Debug: explain — Juvahem</title><meta name="robots" content="noindex" /></svelte:head>

<div class="wrap">
  <h1>Tolkningslager — debug</h1>
  <p>Trösklar: stark ≥ {THRESHOLDS.strong * 100} · svag ≤ {THRESHOLDS.weak * 100} (justera i <code>explain.js</code>).</p>

  <div class="ctrl">
    <label><input type="radio" bind:group={mode} value="bo" /> Bo här</label>
    <label><input type="radio" bind:group={mode} value="invest" /> Investera här</label>
    {#if mode === 'invest'}
      <input class="w" bind:value={investWeights} />
    {:else}
      <input class="w" bind:value={weightsText} />
    {/if}
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Kommun</th><th>Faktorer (0–100)</th><th>Dom + highlights</th><th>Riskflaggor</th></tr>
    </thead>
    <tbody>
      {#each rows as { r, ex } (r.kommunkod)}
        <tr>
          <td>{r.rank}</td>
          <td><b>{r.name}</b><br /><span class="sc">{r.score}</span></td>
          <td class="fac">
            {#each r.breakdown as b (b.key)}
              <span class:strong={b.factor >= THRESHOLDS.strong * 100} class:weak={b.factor <= THRESHOLDS.weak * 100}>
                {b.key}:{b.factor}
              </span>
            {/each}
          </td>
          <td>
            <i>{ex.summary || '—'}</i>
            <ul>{#each ex.highlights as h (h)}<li>{h}</li>{/each}</ul>
          </td>
          <td>{#each ex.riskFlags as f (f.type)}<div class="rf">⚠ {f.label}</div>{/each}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .wrap { padding: 24px; font-size: 13px; }
  h1 { font-size: 22px; }
  .ctrl { display: flex; gap: 16px; align-items: center; margin: 16px 0; flex-wrap: wrap; }
  .w { flex: 1; min-width: 280px; padding: 6px 8px; font-family: monospace; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid var(--line); padding: 6px 8px; vertical-align: top; text-align: left; }
  .fac { display: flex; flex-wrap: wrap; gap: 4px; max-width: 260px; }
  .fac span { background: #eee; padding: 1px 5px; border-radius: 4px; font-family: monospace; }
  .fac .strong { background: #cdebd3; }
  .fac .weak { background: #f6d6c4; }
  .sc { color: var(--accent-dark); font-weight: 700; }
  .rf { color: #8a3d12; }
  ul { margin: 4px 0 0; padding-left: 16px; }
</style>
