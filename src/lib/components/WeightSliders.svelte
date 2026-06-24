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
      <span class="lbl" title={d.label}>{d.label}</span>
      <input type="range" min="0" max="100" step="5" aria-label={d.label}
        bind:value={weights[d.key]} oninput={() => onchange?.()} />
      <span class="pct">{pct(d.key)}%</span>
    </div>
  {/each}
  <p class="hint">
    {hint || 'Dra för att vikta vad som betyder mest. Pendling är på väg in.'}
  </p>
</div>

<style>
  .sliders {
    display: grid;
    gap: 9px;
  }
  .row {
    display: grid;
    grid-template-columns: 82px 1fr 30px;
    align-items: center;
    gap: 8px;
  }
  .lbl {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pct {
    color: var(--accent-dark);
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: 12px;
    text-align: right;
  }
  input[type='range'] {
    width: 100%;
    min-width: 0;
    accent-color: var(--accent);
  }
  .hint {
    color: var(--muted);
    font-size: 12px;
    margin: 6px 0 0;
  }
</style>
