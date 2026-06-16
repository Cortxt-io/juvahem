<script>
  // Constant-sum-style weighting. The scoring engine renormalizes weights itself,
  // so these raw 0–100 values just need to be relative; we show each as a % of the
  // total for comprehension (UI-SPEC: "normalized to 100%").
  let { weights = $bindable() } = $props();

  const ACTIVE = [
    { key: 'jobs', label: 'Jobb (båda)' },
    { key: 'tax', label: 'Kommunalskatt' },
    { key: 'growth', label: 'Befolkningstrend' }
  ];

  const total = $derived(ACTIVE.reduce((s, d) => s + (Number(weights[d.key]) || 0), 0));
  function pct(key) {
    if (total <= 0) return 0;
    return Math.round(((Number(weights[key]) || 0) / total) * 100);
  }
</script>

<div class="sliders">
  {#each ACTIVE as d (d.key)}
    <div class="row">
      <div class="head">
        <span class="lbl">{d.label}</span>
        <span class="pct">{pct(d.key)}%</span>
      </div>
      <input type="range" min="0" max="100" step="5" bind:value={weights[d.key]} />
    </div>
  {/each}
  <p class="hint">
    Dra för att vikta vad som betyder mest för er. Bostadspris och pendling är på väg in —
    de påverkar inte rankningen ännu.
  </p>
</div>

<style>
  .sliders {
    display: grid;
    gap: 18px;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .lbl {
    font-weight: 600;
  }
  .pct {
    color: var(--accent-dark);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--accent);
  }
  .hint {
    color: var(--muted);
    font-size: 13px;
    margin: 4px 0 0;
  }
</style>
