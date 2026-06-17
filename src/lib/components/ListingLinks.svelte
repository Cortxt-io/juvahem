<script>
  // Real-listing deep-links per kommun × intent (rent / bostadsrätt / villa / tomt).
  // Legal: we link to each portal's public search page (EU Svensson) — we never
  // fetch or display their listing data. Qasa for rentals, Hemnet for buy/plot.
  import { listingLinks } from '$lib/data/portalKeys.js';

  let { kommunkod, name = '' } = $props();
  const links = $derived(listingLinks(kommunkod));
</script>

{#if links.length}
  <div class="listings">
    <div class="head">Se riktiga bostäder i {name}</div>
    <div class="btns">
      {#each links as l (l.intent)}
        <a class="lk" href={l.url} target="_blank" rel="noopener nofollow">
          {l.label}<span class="site">{l.site} ↗</span>
        </a>
      {/each}
    </div>
  </div>
{/if}

<style>
  .listings {
    display: grid;
    gap: 8px;
  }
  .head {
    font-size: 13px;
    color: var(--muted);
    font-weight: 600;
  }
  .btns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lk {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    border: 1px solid var(--line);
    background: var(--card);
    border-radius: 10px;
    padding: 8px 13px;
    text-decoration: none;
    color: var(--ink);
    font-size: 14px;
    font-weight: 600;
  }
  .lk:hover {
    border-color: var(--accent);
  }
  .site {
    font-size: 11px;
    color: var(--muted);
    font-weight: 400;
  }
</style>
