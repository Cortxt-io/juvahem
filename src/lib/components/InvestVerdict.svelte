<script>
  // Plain-text invest reads ("risk-flaggor i klartext", per deep-research wf_02886d5d).
  import { investVerdict } from '$lib/score.js';
  import { communes } from '$lib/data/communes.js';

  let { kommunkod } = $props();
  const commune = $derived(communes.find((c) => c.kommunkod === kommunkod));
  const tags = $derived(commune ? investVerdict(commune) : []);
</script>

{#if tags.length}
  <div class="verdict">
    {#each tags as t (t.label)}
      <span class="tag {t.tone}">{t.label}</span>
    {/each}
  </div>
{:else}
  <p class="none">Ingen prisdata för den här kommunen ännu.</p>
{/if}

<style>
  .verdict {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tag {
    font-size: 13px;
    font-weight: 600;
    padding: 5px 11px;
    border-radius: 999px;
    border: 1px solid var(--line);
  }
  .tag.good {
    background: #eaf6ec;
    color: #1f7a39;
    border-color: #bfe3c6;
  }
  .tag.warn {
    background: #fdf0e8;
    color: #b4501a;
    border-color: #f3cdb6;
  }
  .tag.neutral {
    background: var(--card);
    color: var(--muted);
  }
  .none {
    color: var(--muted);
    font-size: 13px;
    margin: 0;
  }
</style>
