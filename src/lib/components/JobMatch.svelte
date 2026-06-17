<script>
  // Concrete jobs for THIS couple in THIS kommun: for each partner's occupation
  // field, the live open-ad count (from JobTech data already in the commune file)
  // + a "Se jobben" deep-link to Platsbanken. Makes the abstract "Jobb" score real.
  import { byKommunkod } from '$lib/data/communes.js';
  import { jobLink } from '$lib/data/portalKeys.js';
  import { occupationLabel } from '$lib/data/occupationFields.js';

  let { kommunkod, persons = [] } = $props();

  const commune = $derived(byKommunkod.get(kommunkod));
  const rows = $derived(
    persons
      .map((p, i) => {
        const code = p?.occupationCode;
        if (!code) return null;
        const job = commune?.jobs?.[code];
        return {
          who: i === 0 ? 'Person 1' : 'Person 2',
          label: occupationLabel.get(code) ?? job?.label ?? code,
          count: job?.count ?? 0,
          url: jobLink(kommunkod, code)
        };
      })
      .filter(Boolean)
  );
</script>

{#if rows.length}
  <div class="jobs">
    {#each rows as r (r.who)}
      <div class="jrow">
        <div class="meta">
          <span class="who">{r.who}</span>
          <span class="field">{r.label}</span>
        </div>
        <div class="right">
          <span class="count" class:zero={r.count === 0}>
            {r.count} {r.count === 1 ? 'jobb' : 'jobb'}
          </span>
          <a class="see" href={r.url} target="_blank" rel="noopener nofollow">Se jobben ↗</a>
        </div>
      </div>
    {/each}
    <p class="src">Öppna annonser just nu · källa JobTech/Platsbanken</p>
  </div>
{/if}

<style>
  .jobs {
    display: grid;
    gap: 8px;
  }
  .jrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .meta {
    display: flex;
    flex-direction: column;
  }
  .who {
    font-size: 12px;
    color: var(--muted);
  }
  .field {
    font-weight: 600;
    font-size: 14px;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .count {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: var(--accent-dark);
    background: var(--accent-soft);
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 14px;
  }
  .count.zero {
    color: var(--warn);
    background: #f6ede2;
  }
  .see {
    font-size: 13px;
    white-space: nowrap;
  }
  .src {
    font-size: 11px;
    color: var(--muted);
    margin: 2px 0 0;
  }
</style>
