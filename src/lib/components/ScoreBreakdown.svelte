<script>
  // Per-factor breakdown — RAW value first, match second (research-backed: OECD-style
  // transparency; Numbeo's "normalized-only" is the anti-pattern). Each row shows the
  // real number (31,8 % · 5 396 tkr), the factor's 0–100 strength for this weighting,
  // and its weighted contribution to the total. Dormant dims are listed honestly.
  import { formatRaw } from '$lib/format.js';

  let { breakdown = [] } = $props();

  // Pendling (commute) is the one dimension still computed on-demand / not yet in
  // the dataset. Bostadspris is live (SCB) and weighted like any other factor.
  const DORMANT = ['Pendling'];
</script>

<div class="bd">
  <div class="bar-row head">
    <div class="lbl">Faktor</div>
    <div class="val">Värde</div>
    <div class="track">Träff för din viktning</div>
    <div class="num">Bidrag</div>
  </div>
  {#each breakdown as b (b.key)}
    <div class="bar-row">
      <div class="lbl">{b.label}</div>
      <div class="val tnum">{formatRaw(b.raw, b.unit)}</div>
      <div class="track" title="Träffstyrka {b.factor}/100 för din viktning">
        <div class="fill" style="width:{Math.max(2, b.factor)}%"></div>
      </div>
      <div class="num tnum">+{b.contribution.toFixed(1)}</div>
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
    grid-template-columns: minmax(96px, 1.1fr) 78px 1fr 46px;
    align-items: center;
    gap: 10px;
  }
  .bar-row.head {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 2px;
  }
  .bar-row.head .track {
    background: none;
    height: auto;
  }
  .lbl {
    font-size: 13px;
    color: var(--muted);
  }
  .val {
    font-size: 14px;
    color: var(--ink);
    font-weight: 500;
    text-align: right;
  }
  .track {
    background: var(--surface-2);
    border-radius: 6px;
    height: 12px;
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
    color: var(--accent-dark);
    text-align: right;
    font-weight: 500;
  }
  .dormant {
    font-size: 12px;
    color: var(--muted);
    margin: 6px 0 0;
  }
  .dormant span {
    color: var(--warn);
    font-weight: 500;
  }
</style>
