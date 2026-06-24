<script>
  // Life-situation preset picker. A light, optional starting point — rendered as a
  // compact chip row (not heavy cards), so it stays secondary to the ranking. The
  // description lives in the tooltip; `custom` keeps the preset identity after hand-tuning.
  import { PRESETS, getPreset } from '$lib/presets.js';

  let { selected = null, custom = false, onpick } = $props();
  const current = $derived(getPreset(selected));
</script>

<div class="picker">
  <div class="chips">
    {#each PRESETS as p (p.slug)}
      <button
        type="button"
        class="chip"
        class:active={selected === p.slug}
        aria-pressed={selected === p.slug}
        title={p.description}
        onclick={() => onpick?.(p)}
      >
        {p.label}
      </button>
    {/each}
  </div>

  {#if custom && current}
    <p class="custom">Anpassad — baserad på <b>{current.label}</b></p>
  {/if}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: 999px;
    padding: 5px 11px;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.12s, background 0.12s, color 0.12s;
  }
  .chip:hover {
    border-color: var(--accent);
  }
  .chip.active {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }
  .custom {
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--accent-dark);
  }
</style>
