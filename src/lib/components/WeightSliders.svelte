<script>
  // Constant-sum-style weighting. The scoring engine renormalizes weights itself,
  // so these raw 0–100 values just need to be relative; we show each as a % of the
  // total for comprehension (UI-SPEC: "normalized to 100%").
  // `dims` is the slider set for the current mode (defaults to "bo här").
  const BO_DIMS = [
    { key: 'jobs', label: 'Jobb (efterfrågan)' },
    { key: 'tax', label: 'Skatt (kommun + region)' },
    { key: 'price', label: 'Bostadspris (köpkraft)' },
    { key: 'energy', label: 'Elkostnad (elområde)' },
    { key: 'schools', label: 'Skola (behörighet)' },
    { key: 'safety', label: 'Trygghet (få brott)' },
    { key: 'transit', label: 'Kollektivtrafik' },
    { key: 'growth', label: 'Befolkningstrend' }
  ];
  let { weights = $bindable(), dims = BO_DIMS, hint = '', onchange } = $props();

  const ACTIVE = $derived(dims);
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
      <input type="range" min="0" max="100" step="5" bind:value={weights[d.key]} oninput={() => onchange?.()} />
    </div>
  {/each}
  <p class="hint">
    {hint || 'Dra för att vikta vad som betyder mest för dig. Pendling är på väg in — den påverkar inte rankningen ännu.'}
  </p>
</div>

<style>
  .sliders {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 24px;
  }
  @media (max-width: 560px) {
    .sliders {
      grid-template-columns: 1fr;
    }
  }
  .hint {
    grid-column: 1 / -1;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .lbl {
    font-size: 14px;
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
