<script>
  import { flip } from 'svelte/animate';
  import { kommunkodToSlug } from '$lib/data/communes.js';
  import ScoreBreakdown from './ScoreBreakdown.svelte';
  import JobMatch from './JobMatch.svelte';
  import ListingLinks from './ListingLinks.svelte';
  import Explanation from './Explanation.svelte';

  let { ranked = [], limit = 20, persons = [], mode = 'bo', profile = undefined } = $props();
  let expanded = $state(null); // kommunkod currently expanded

  const shown = $derived(ranked.slice(0, limit));

  function toggle(kod) {
    expanded = expanded === kod ? null : kod;
  }
</script>

<ol class="list">
  {#each shown as r (r.kommunkod)}
    <li class="item" animate:flip={{ duration: 350 }}>
      <button class="rowbtn" type="button" onclick={() => toggle(r.kommunkod)}>
        <span class="rank">#{r.rank}</span>
        <span class="name">
          {r.name}
          <Explanation entry={r} kommunkod={r.kommunkod} {profile} compact />
        </span>
        <span class="score">{r.score.toFixed(1)}</span>
      </button>
      {#if expanded === r.kommunkod}
        <div class="detail">
          <Explanation entry={r} kommunkod={r.kommunkod} {profile} />
          <ScoreBreakdown breakdown={r.breakdown} />
          {#if mode !== 'invest'}
            <JobMatch kommunkod={r.kommunkod} {persons} />
          {/if}
          <ListingLinks kommunkod={r.kommunkod} name={r.name} />
          <a class="btn ghost small" href="/kommun/{kommunkodToSlug.get(r.kommunkod)}">
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
  }
  .rowbtn {
    width: 100%;
    display: grid;
    grid-template-columns: 56px 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 13px 16px;
    background: none;
    border: 0;
    cursor: pointer;
    font-size: 16px;
    text-align: left;
    color: var(--ink);
  }
  .rowbtn:hover {
    background: #fbf8f2;
  }
  .rank {
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    font-weight: 600;
  }
  .name {
    font-weight: 600;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .score {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: var(--accent-dark);
    background: var(--accent-soft);
    padding: 3px 10px;
    border-radius: 8px;
  }
  .detail {
    padding: 4px 16px 16px;
    border-top: 1px solid var(--line);
    display: grid;
    gap: 14px;
  }
  .detail .btn {
    justify-self: start;
  }
</style>
