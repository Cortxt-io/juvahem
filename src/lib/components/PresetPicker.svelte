<script>
  // Life-situation preset picker (Fas B). Five cards; the selected one highlights.
  // When the user has hand-tuned weights afterwards, `custom` shows a "based on X" note
  // without losing the preset identity.
  import { PRESETS, getPreset } from '$lib/presets.js';

  let { selected = null, custom = false, onpick } = $props();
  const current = $derived(getPreset(selected));
</script>

<div class="picker">
  <div class="cards">
    {#each PRESETS as p (p.slug)}
      <button
        type="button"
        class="card"
        class:active={selected === p.slug}
        aria-pressed={selected === p.slug}
        onclick={() => onpick?.(p)}
      >
        <span class="ico">{p.icon}</span>
        <span class="lbl">{p.label}</span>
        <span class="desc">{p.description}</span>
      </button>
    {/each}
  </div>

  {#if custom && current}
    <p class="custom">Anpassad — baserad på <b>{current.label}</b></p>
  {/if}
</div>

<style>
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: 14px;
    padding: 16px;
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
  }
  .card:hover {
    border-color: var(--accent);
    background: #fbf8f2;
  }
  .card.active {
    border-color: var(--accent);
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  .ico {
    font-size: 26px;
  }
  .lbl {
    font-weight: 700;
    font-size: 16px;
    color: var(--ink);
  }
  .desc {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.35;
  }
  .custom {
    margin: 12px 0 0;
    font-size: 13px;
    color: var(--accent-dark);
  }
</style>
