<script>
  // Occupation input for 1→N persons. Neutral default is a single person; adding a
  // second (or more) is what turns on dual-career matching in the parent. The scoring
  // engine combines each person's job-fit (harmonic vs arithmetic mean, see presets.js).
  import { occupationFields } from '$lib/data/occupationFields.js';

  let { persons = $bindable() } = $props();
  const MAX = 4;

  function add() {
    if (persons.length < MAX) persons = [...persons, { occupationCode: '' }];
  }
  function remove(i) {
    if (persons.length > 1) persons = persons.filter((_, idx) => idx !== i);
  }
  function copyFrom(i) {
    persons[persons.length - 1] = { ...persons[i] };
  }
</script>

<div class="cols">
  {#each persons as person, i (i)}
    <div class="col card">
      <div class="colhead">
        <h3>Person {i + 1}</h3>
        {#if persons.length > 1}
          <button class="rm" type="button" onclick={() => remove(i)} aria-label="Ta bort person {i + 1}">✕</button>
        {/if}
      </div>
      <label>
        Yrkesområde
        <select bind:value={person.occupationCode}>
          <option value="">Välj yrkesområde…</option>
          {#each occupationFields as f (f.id)}
            <option value={f.id}>{f.label}</option>
          {/each}
        </select>
      </label>
      {#if i > 0}
        <button class="btn ghost small" type="button" onclick={() => copyFrom(0)}>
          Kopiera från Person 1
        </button>
      {/if}
    </div>
  {/each}
</div>

{#if persons.length < MAX}
  <button class="add" type="button" onclick={add}>+ Lägg till person</button>
{/if}

<style>
  .cols {
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 560px) {
    .cols {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
  }
  .colhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  h3 {
    margin: 0;
    font-size: 15px;
  }
  .rm {
    border: 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 2px 4px;
  }
  .rm:hover {
    color: var(--warn);
  }
  label {
    display: block;
    font-size: 13px;
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
    background: var(--surface);
    color: var(--ink);
  }
  .small {
    margin-top: 12px;
  }
  .add {
    margin-top: 12px;
    border: 1px dashed var(--line);
    background: none;
    color: var(--accent-dark);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
  }
  .add:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
</style>
