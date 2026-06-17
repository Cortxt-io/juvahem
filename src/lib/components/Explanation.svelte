<script>
  // Renders the Fas 1.5 interpretation layer for one commune. Pure presentation —
  // explain() does the logic. `compact` shows only the one-line summary (for the row);
  // full mode adds highlights + risk flags (for the expanded detail).
  import { explain } from '$lib/explain.js';
  import { communes } from '$lib/data/communes.js';

  let { entry, kommunkod, compact = false, profile = undefined } = $props();

  const commune = $derived(communes.find((c) => c.kommunkod === kommunkod) ?? {});
  const ex = $derived(explain(entry, commune, profile));
  const hasPrice = $derived(commune?.housing?.price_level_tkr?.value != null);
</script>

{#if compact}
  {#if ex.summary}
    <p class="summary">{ex.summary}</p>
  {/if}
{:else}
  <div class="explain">
    {#if ex.summary}
      <p class="summary big">{ex.summary} <span class="beta">beta</span></p>
    {/if}

    {#if ex.highlights.length}
      <ul class="highlights">
        {#each ex.highlights as h (h)}
          <li>{h}</li>
        {/each}
      </ul>
    {/if}

    {#if ex.riskFlags.length}
      <div class="risks">
        {#each ex.riskFlags as r (r.type)}
          <div class="risk" title={r.description}>
            <span class="ico" aria-hidden="true">⚠</span>
            <span><b>{r.label}.</b> {r.description}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if !ex.summary && !ex.highlights.length && !ex.riskFlags.length}
      <p class="none">Ingen tydlig profil – se poängfördelningen nedan.</p>
    {/if}

    {#if hasPrice}
      <p class="disclaimer">
        Prisnivån baseras på grov kommunnivådata från SCB (medel-köpeskilling för småhus),
        inte en värdering av enskild bostad.
      </p>
    {/if}
  </div>
{/if}

<style>
  .summary {
    margin: 2px 0 0;
    color: var(--muted);
    font-size: 14px;
  }
  .summary.big {
    font-size: 15px;
    color: var(--ink);
    font-weight: 500;
  }
  .beta {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-dark);
    background: var(--accent-soft);
    padding: 1px 6px;
    border-radius: 999px;
    vertical-align: middle;
  }
  .explain {
    display: grid;
    gap: 12px;
  }
  .highlights {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 4px;
    color: var(--ink);
    font-size: 14px;
  }
  .risks {
    display: grid;
    gap: 6px;
  }
  .risk {
    display: flex;
    gap: 8px;
    align-items: start;
    font-size: 13px;
    background: #fdf0e8;
    border: 1px solid #f3cdb6;
    color: #8a3d12;
    border-radius: 8px;
    padding: 7px 10px;
  }
  .risk .ico {
    flex: none;
  }
  .none {
    margin: 0;
    color: var(--muted);
    font-size: 13px;
  }
  .disclaimer {
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    font-style: italic;
    border-top: 1px dashed var(--line);
    padding-top: 8px;
  }
</style>
