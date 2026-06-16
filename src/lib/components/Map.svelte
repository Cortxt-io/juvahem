<script>
  // Choropleth of all 290 kommuner, filled by the current ranking score.
  // MapLibre + OpenFreeMap tiles (no API key). Boundaries are served as a static
  // asset (static/commune_boundaries.geojson) and fetched at runtime so the ~1-2MB
  // geometry never bloats the JS bundle. Score is joined onto each feature by kommunkod.
  import { onMount, onDestroy } from 'svelte';

  let { ranked = [] } = $props();

  let container;
  let map = null;
  let maplibre = null;
  let geojson = null;
  let status = $state('loading'); // loading | ready | nodata | error

  const scoreByKod = $derived(new Map(ranked.map((r) => [r.kommunkod, r.score])));

  function paint() {
    if (!map || !geojson || !map.getSource('communes')) return;
    const data = {
      ...geojson,
      features: geojson.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          score: scoreByKod.get(String(f.properties.kommunkod ?? f.properties.kom_kod ?? '')) ?? null
        }
      }))
    };
    map.getSource('communes').setData(data);
  }

  // Re-paint whenever the ranking changes.
  $effect(() => {
    scoreByKod; // track
    paint();
  });

  onMount(async () => {
    try {
      const resp = await fetch('/commune_boundaries.geojson');
      if (!resp.ok) {
        status = 'nodata';
        return;
      }
      geojson = await resp.json();
      maplibre = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');

      map = new maplibre.Map({
        container,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [16.5, 62.5],
        zoom: 3.6,
        attributionControl: true
      });

      map.on('load', () => {
        map.addSource('communes', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'communes-fill',
          type: 'fill',
          source: 'communes',
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'score'], null],
              '#d9d2c5',
              [
                'interpolate',
                ['linear'],
                ['get', 'score'],
                0, '#e9efe7',
                40, '#a9c6ad',
                70, '#5a8c6a',
                100, '#2c5840'
              ]
            ],
            'fill-opacity': 0.78
          }
        });
        map.addLayer({
          id: 'communes-line',
          type: 'line',
          source: 'communes',
          paint: { 'line-color': '#ffffff', 'line-width': 0.4 }
        });

        const popup = new maplibre.Popup({ closeButton: false, closeOnClick: false });
        map.on('mousemove', 'communes-fill', (e) => {
          const p = e.features?.[0]?.properties;
          if (!p) return;
          map.getCanvas().style.cursor = 'pointer';
          const score = p.score == null ? '–' : Number(p.score).toFixed(1);
          popup.setLngLat(e.lngLat).setHTML(`<strong>${p.name ?? ''}</strong><br/>Poäng: ${score}`).addTo(map);
        });
        map.on('mouseleave', 'communes-fill', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
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
    height: 540px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: #eef2ec;
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
    background: rgba(250, 247, 242, 0.85);
    border-radius: 14px;
  }
</style>
