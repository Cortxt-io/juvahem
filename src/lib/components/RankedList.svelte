<script>
  import { flip } from 'svelte/animate';
  import { kommunkodToSlug } from '$lib/data/communes.js';
  import ScoreBreakdown from './ScoreBreakdown.svelte';
  import JobMatch from './JobMatch.svelte';
  import ListingLinks from './ListingLinks.svelte';
  import Explanation from './Explanation.svelte';

  let {
    ranked = [],
    limit = 20,
    persons = [],
    mode = 'bo',
    profile = undefined,
    highlighted = null,
    onhover = undefined
  } = $props();
  let expanded = $state(null); // kommunkod currently expanded
  let activeTab = $state('varfor'); // tab within the expanded detail

  const shown = $derived(ranked.slice(0, limit));

  function toggle(kod) {
    expanded = expanded === kod ? null : kod;
    activeTab = 'varfor'; // every open starts on Varför (the primary "why")
  }
</script>

<ol class="list">
  {#each shown as r (r.kommunkod)}
    <li class="item" class:hl={highlighted === r.kommunkod} animate:flip={{ duration: 350 }}>
      <button
        class="rowbtn"
        type="button"
        onclick={() => toggle(r.kommunkod)}
        onmouseenter={() => onhover?.(r.kommunkod)}
        onmouseleave={() => onhover?.(null)}
        onfocus={() => onhover?.(r.kommunkod)}
        onblur={() => onhover?.(null)}
      >
        <span class="rank tnum" class:lead={r.rank === 1}>{r.rank}</span>
        <span class="name">
          <span class="place">{r.name}</span>
          <Explanation entry={r} kommunkod={r.kommunkod} {profile} compact />
        </span>
        <span class="scorecell">
          <span class="score tnum" class:lead={r.rank === 1}>{r.score.toFixed(1)}</span>
          <span class="meter" class:gold={r.rank === 1}><span class="bar" style="width:{Math.max(2, r.score)}%"></span></span>
        </span>
      </button>
      {#if expanded === r.kommunkod}
        <div class="detail">
          <div class="tabs" role="tablist" aria-label="Detaljer om {r.name}">
            <button class="tab" class:active={activeTab === 'varfor'} role="tab" type="button"
              aria-selected={activeTab === 'varfor'} onclick={() => (activeTab = 'varfor')}>Varför</button>
            {#if mode !== 'invest'}
              <button class="tab" class:active={activeTab === 'jobb'} role="tab" type="button"
                aria-selected={activeTab === 'jobb'} onclick={() => (activeTab = 'jobb')}>Jobb</button>
            {/if}
            <button class="tab" class:active={activeTab === 'bostader'} role="tab" type="button"
              aria-selected={activeTab === 'bostader'} onclick={() => (activeTab = 'bostader')}>Bostäder</button>
            <span class="coverage" title="Andel av faktorerna som hade data för {r.name}">
              <span class="dots">
                {#each Array(5) as _, i (i)}
                  <span class="d" class:on={i < Math.round((r.coverage ?? 0) * 5)}></span>
                {/each}
              </span>
              {Math.round((r.coverage ?? 0) * 100)}%
            </span>
          </div>

          <div class="panel">
            {#if activeTab === 'varfor'}
              <Explanation entry={r} kommunkod={r.kommunkod} {profile} showSummary={false} />
              <ScoreBreakdown breakdown={r.breakdown} />
            {:else if activeTab === 'jobb'}
              <JobMatch kommunkod={r.kommunkod} {persons} />
            {:else if activeTab === 'bostader'}
              <ListingLinks kommunkod={r.kommunkod} name={r.name} />
            {/if}
          </div>

          <a class="btn ghost small morelink" href="/kommun/{kommunkodToSlug.get(r.kommunkod)}">
            Mer om {r.name} →
          </a>
        </div>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .item {
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--card);
    overflow: hidden;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  .item.hl {
    border-color: var(--ink);
    box-shadow: inset 0 0 0 1px var(--ink);
  }
  .rowbtn {
    width: 100%;
    display: grid;
    grid-template-columns: 34px 1fr 132px;
    align-items: center;
    gap: 14px;
    padding: 13px 16px;
    background: none;
    border: 0;
    cursor: pointer;
    font-size: 16px;
    text-align: left;
    color: var(--ink);
  }
  .rowbtn:hover {
    background: var(--accent-soft);
  }
  .rank {
    color: var(--muted);
    font-weight: 700;
    font-size: 14px;
    text-align: right;
  }
  .rank.lead {
    color: var(--gold-dark);
  }
  .name {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .place {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 16px;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  .scorecell {
    display: grid;
    gap: 5px;
    justify-items: end;
  }
  .score {
    font-weight: 700;
    font-size: 16px;
    color: var(--accent-dark);
    letter-spacing: 0;
  }
  .score.lead {
    color: var(--gold-dark);
  }
  .scorecell .meter {
    width: 100%;
    height: 6px;
  }
  .detail {
    padding: 10px 16px 16px;
    border-top: 1px solid var(--line);
    display: grid;
    gap: 12px;
  }
  .tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    border-bottom: 1px solid var(--line);
  }
  .tab {
    border: 0;
    background: none;
    padding: 8px 12px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.04em;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .tab:hover { color: var(--ink); }
  .tab.active {
    color: var(--accent-dark);
    border-bottom-color: var(--accent);
  }
  .coverage {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono);
  }
  .dots { display: inline-flex; gap: 2px; }
  .d {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--line);
  }
  .d.on { background: var(--accent); }
  .panel { display: grid; gap: 14px; }
  .morelink { justify-self: start; }
</style>
