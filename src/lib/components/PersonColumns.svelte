<script>
  import { occupationFields } from '$lib/data/occupationFields.js';

  let { persons = $bindable() } = $props();

  function copyFromFirst() {
    persons[1] = { ...persons[0] };
  }
</script>

<div class="cols">
  {#each persons as person, i (i)}
    <div class="col card">
      <h3>{i === 0 ? 'Person 1' : 'Person 2'}</h3>
      <label>
        Yrkesområde
        <select bind:value={person.occupationCode}>
          <option value="">Välj yrkesområde…</option>
          {#each occupationFields as f (f.id)}
            <option value={f.id}>{f.label}</option>
          {/each}
        </select>
      </label>
      {#if i === 1}
        <button class="btn ghost small" type="button" onclick={copyFromFirst}>
          Kopiera från Person 1
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .cols {
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 560px) {
    .cols {
      grid-template-columns: 1fr 1fr;
    }
  }
  h3 {
    margin: 0 0 14px;
    font-size: 16px;
  }
  label {
    display: block;
    font-size: 14px;
    color: var(--muted);
    font-weight: 600;
  }
  select {
    display: block;
    width: 100%;
    margin-top: 6px;
    padding: 11px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    font-size: 15px;
    background: #fff;
    color: var(--ink);
  }
  .small {
    margin-top: 12px;
  }
</style>
