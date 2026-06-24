<script>
  // Choropleth of all 290 kommuner — the atlas. Fill is the score ramp normalized
  // over the CURRENT min..max so the leader always burns gold (cold teal -> sage ->
  // gold). MapLibre + OpenFreeMap (no API key); boundaries fetched as a static asset.
  // Hover-sync: hovering a kommun emits onhover(kod); the `highlighted` prop (set by
  // the list) marks that kommun here with a dark fill + light halo so even a tiny
  // northern kommun pops at national zoom — the map and index breathe together.
  import { onMount, onDestroy } from 'svelte';

  let { ranked = [], highlighted = null, onhover = undefined } = $props();

  let container;
  let map = null;
  let maplibre = null;
  let geojson = null;
  let status = $state('loading'); // loading | ready | nodata | error

  const scoreByKod = $derived(new Map(ranked.map((r) => [r.kommunkod, r.score])));

  // Normalize the current scores to 0-1 so the ramp spans the live range.
  function bounds() {
    const vals = [...scoreByKod.values()];
    if (!vals.length) return { min: 0, max: 1 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return { min, max: max === min ? min + 1 : max };
  }

  function paint() {
    if (!map || !geojson || !map.getSource('communes')) return;
    const { min, max } = bounds();
    const data = {
      ...geojson,
      features: geojson.features.map((f) => {
        const kod = String(f.properties.kod ?? '');
        const score = scoreByKod.get(kod);
        const t = typeof score === 'number' ? (score - min) / (max - min) : null;
        return { ...f, properties: { ...f.properties, score: score ?? null, t } };
      })
    };
    map.getSource('communes').setData(data);
  }

  // Re-paint whenever the ranking changes.
  $effect(() => {
    scoreByKod; // track
    paint();
  });

  // Mark the kommun the list is hovering — drives both highlight layers.
  $effect(() => {
    if (!map || !map.getLayer('communes-highlight')) return;
    const hlFilter = ['==', ['get', 'kod'], highlighted ?? ' '];
    map.setFilter('communes-highlight-fill', hlFilter);
    map.setFilter('communes-highlight', hlFilter);
  });

  onMount(async () => {
    try {
      const resp = await fetch('/commune_boundaries.geojson');
      if (!resp.ok) {
        status = 'nodata';
        return;
      }
      const raw = await resp.json();
      // Normalize a stable string `kod` onto every feature for joins + filters.
      geojson = {
        ...raw,
        features: raw.features.map((f) => ({
          ...f,
          properties: {
            ...f.properties,
            kod: String(f.properties.kommunkod ?? f.properties.kom_kod ?? '')
          }
        }))
      };
      maplibre = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      map = new maplibre.Map({
        container,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [16.8, 62.6],
        zoom: 3.5,
        attributionControl: { compact: true }
      });
      // Overlay controls — zoom (bottom-right) + fullscreen (top-right), à la Hemnet.
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right');
      map.addControl(new maplibre.FullscreenControl(), 'top-right');

      map.on('load', () => {
        map.addSource('communes', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'communes-fill',
          type: 'fill',
          source: 'communes',
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 't'], null],
              '#cfd3cb',
              ['interpolate', ['linear'], ['get', 't'], 0, '#3b5a63', 0.5, '#9fb08a', 1, '#e2a32b']
            ],
            'fill-opacity': 0.82
          }
        });
        map.addLayer({
          id: 'communes-line',
          type: 'line',
          source: 'communes',
          paint: { 'line-color': '#f3f4f0', 'line-width': 0.4 }
        });
        // Highlight — dark fill + light halo, driven by the `highlighted` prop.
        map.addLayer({
          id: 'communes-highlight-fill',
          type: 'fill',
          source: 'communes',
          paint: { 'fill-color': '#16242a', 'fill-opacity': 0.9 },
          filter: ['==', ['get', 'kod'], ' ']
        });
        map.addLayer({
          id: 'communes-highlight',
          type: 'line',
          source: 'communes',
          paint: { 'line-color': '#f3f4f0', 'line-width': 2.4 },
          filter: ['==', ['get', 'kod'], ' ']
        });

        const popup = new maplibre.Popup({ closeButton: false, closeOnClick: false });
        map.on('mousemove', 'communes-fill', (e) => {
          const p = e.features?.[0]?.properties;
          if (!p) return;
          map.getCanvas().style.cursor = 'pointer';
          const score = p.score == null ? '-' : Number(p.score).toFixed(1);
          popup.setLngLat(e.lngLat).setHTML(`<strong>${p.name ?? ''}</strong><br/>Poäng: ${score}`).addTo(map);
          onhover?.(String(p.kod ?? ''));
        });
        map.on('mouseleave', 'communes-fill', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
          onhover?.(null);
        });

        status = 'ready';
        paint();
      });
    } catch (e) {
      status = 'error';
    }
  });

  onDestroy(() => map?.remove());
</script>

<div class="mapwrap">
  <div class="map" bind:this={container}></div>
  <div class="legend">
    <span class="eyebrow">Poäng</span>
    <span class="ramp" aria-hidden="true"></span>
    <span class="ends"><span>låg</span><span>hög</span></span>
  </div>
  {#if status === 'nodata'}
    <div class="overlay">Kartdata (kommungränser) byggs in härnäst — listan visar rankningen så länge.</div>
  {:else if status === 'error'}
    <div class="overlay">Kunde inte ladda kartan just nu.</div>
  {/if}
</div>

<style>
  .mapwrap {
    position: relative;
  }
  .map {
    width: 100%;
    height: 320px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: #dde1d8;
  }
  .legend {
    position: absolute;
    left: 12px;
    bottom: 12px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 8px 10px;
    display: grid;
    gap: 5px;
    width: 132px;
  }
  .ramp {
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(90deg, #3b5a63, #9fb08a, #e2a32b);
  }
  .ends {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--muted);
  }
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    color: var(--muted);
    background: rgba(233, 235, 230, 0.88);
    border-radius: 12px;
  }
</style>
