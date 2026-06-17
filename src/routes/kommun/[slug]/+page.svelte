<script>
  import ListingLinks from '$lib/components/ListingLinks.svelte';
  import { jobLink } from '$lib/data/portalKeys.js';

  let { data } = $props();
  const c = $derived(data.commune);
  const fmt = (n, suffix = '') =>
    n == null ? '–' : `${Number(n).toLocaleString('sv-SE', { maximumFractionDigits: 1 })}${suffix}`;
</script>

<svelte:head>
  <title>{c.name} — flytta hit? | Juvahem</title>
  <meta
    name="description"
    content="{c.name}: kommunalskatt {fmt(c.tax, '%')}, befolkningstrend {fmt(c.growth5y, '%')} på 5 år. Se hur {c.name} passar ert par på Juvahem."
  />
  <link rel="canonical" href="https://juvahem.se/kommun/{data.slug}" />
</svelte:head>

<div class="wrap">
  <header><a class="brand" href="/"><span class="dot">🏡</span> Juvahem</a></header>

  <article>
    <p class="crumb"><a href="/jamfor">← Alla kommuner</a></p>
    <h1>{c.name}</h1>
    <p class="lead">
      Plats <b>{data.baselineRank}</b> av {data.total} i en neutral rankning på skatt och
      befolkningstrend. Lägg in ert pars yrken i verktyget för en rankning mot er.
    </p>

    <div class="grid">
      <div class="card stat"><span class="k">Kommunalskatt</span><span class="v">{fmt(c.tax, '%')}</span></div>
      <div class="card stat"><span class="k">Total skatt</span><span class="v">{fmt(c.totalTax, '%')}</span></div>
      <div class="card stat"><span class="k">Invånare</span><span class="v">{fmt(c.population)}</span></div>
      <div class="card stat"><span class="k">Trend 5 år</span><span class="v">{fmt(c.growth5y, '%')}</span></div>
    </div>

    {#if data.topJobs.length}
      <h2>Starkast jobbmarknad här</h2>
      <ul class="jobs">
        {#each data.topJobs as j (j.id)}
          <li>
            <span>{j.label}</span>
            <b>{j.value.toFixed(1)}</b><small>annonser / 10k inv.</small>
            <a href={jobLink(c.kommunkod, j.id)} target="_blank" rel="noopener nofollow">Se jobben ↗</a>
          </li>
        {/each}
      </ul>
    {/if}

    <h2>Bostäder i {c.name}</h2>
    <ListingLinks kommunkod={c.kommunkod} name={c.name} />

    {#if data.neighbours.length}
      <h2>Liknande kommuner</h2>
      <div class="neigh">
        {#each data.neighbours as n (n.slug)}
          <a class="btn ghost small" href="/kommun/{n.slug}">{n.name} <span>#{n.rank}</span></a>
        {/each}
      </div>
    {/if}

    <div class="cta">
      <a class="btn" href="/jamfor">Ranka mot ert par →</a>
    </div>
  </article>
</div>

<style>
  header { padding: 22px 0; }
  .crumb { margin: 0 0 8px; font-size: 14px; }
  h1 { font-size: clamp(30px, 5vw, 46px); margin: 0 0 12px; letter-spacing: -0.02em; }
  .lead { font-size: 18px; color: var(--muted); max-width: 60ch; margin: 0 0 26px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 30px; }
  @media (min-width: 560px) { .grid { grid-template-columns: repeat(4, 1fr); } }
  .stat { display: grid; gap: 4px; }
  .stat .k { font-size: 13px; color: var(--muted); }
  .stat .v { font-size: 22px; font-weight: 700; color: var(--accent-dark); }
  h2 { font-size: 22px; margin: 8px 0 14px; }
  .jobs { list-style: none; padding: 0; margin: 0 0 30px; display: grid; gap: 8px; }
  .jobs li { display: flex; align-items: baseline; gap: 10px; border-bottom: 1px solid var(--line); padding: 8px 0; }
  .jobs li span { flex: 1; }
  .jobs li b { color: var(--accent-dark); font-variant-numeric: tabular-nums; }
  .jobs li small { color: var(--muted); }
  .neigh { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 34px; }
  .neigh .btn span { color: var(--muted); }
  .cta { padding: 24px 0 50px; border-top: 1px solid var(--line); }
</style>
