<script>
  // Horizontal contribution bars (no radar). Each bar's width = that factor's
  // weighted contribution to the total score; the muted track shows the factor's
  // own 0–100 strength. Dormant dimensions are listed honestly as "Kommer snart".
  let { breakdown = [] } = $props();

  // Pendling (commute) is the one dimension still computed on-demand / not yet in
  // the dataset. Bostadspris is live (SCB) and weighted like any other factor.
  const DORMANT = ['Pendling'];
  const maxContribution = $derived(
    Math.max(1, ...breakdown.map((b) => b.contribution))
  );
</script>

<div class="bd">
  {#each breakdown as b (b.key)}
    <div class="bar-row">
      <div class="lbl">{b.label}</div>
      <div class="track">
        <div class="fill" style="width:{(b.contribution / maxContribution) * 100}%"></div>
      </div>
      <div class="num">+{b.contribution.toFixed(1)}</div>
    </div>
  {/each}
  <p class="dormant">{DORMANT.join(' · ')}: <span>Kommer snart</span></p>
</div>

<style>
  .bd {
    display: grid;
    gap: 8px;
  }
  .bar-row {
    display: grid;
    grid-template-columns: 140px 1fr 48px;
    align-items: center;
    gap: 10px;
  }
  .lbl {
    font-size: 13px;
    color: var(--muted);
  }
  .track {
    background: var(--accent-soft);
    border-radius: 6px;
    height: 14px;
    overflow: hidden;
  }
  .fill {
    background: var(--accent);
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease;
  }
  .num {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--accent-dark);
    text-align: right;
    font-weight: 600;
  }
  .dormant {
    font-size: 12px;
    color: var(--muted);
    margin: 6px 0 0;
  }
  .dormant span {
    color: var(--warn);
    font-weight: 600;
  }
</style>
