<script>
  import { cn } from '$lib/utils';

  // "Unlit instrument" — the cartographic version. A dormant card that names a
  // feature on the way without faking a working tool. Same signature as the other
  // surfaces, rendered in juvahem's atlas material (mono eyebrow, recessed track).
  let { label, note = 'på väg', hint, class: className } = $props();
</script>

<div class={cn('rounded-[14px] border border-border bg-card p-4 opacity-80 transition-opacity hover:opacity-100', className)}>
  <div class="font-mono text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{label}</div>

  <!-- Unlit meter — a recessed track with no fill behind it. -->
  <div
    aria-hidden="true"
    class="mt-3 h-2 rounded-full opacity-60"
    style="background-image: repeating-linear-gradient(90deg, var(--surface-2) 0 8px, transparent 8px 15px);"
  ></div>

  {#if hint}
    <p class="mb-0 mt-3 text-[13px] text-[color:var(--muted)]">{hint}</p>
  {/if}

  <div class="mt-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[color:var(--muted)]">
    <span class="inline-block h-1.5 w-1.5 rounded-full" style="background: var(--muted);"></span>
    <span>· {note}</span>
  </div>
</div>
