<script>
  import { cva } from 'class-variance-authority';
  import { cn } from '$lib/utils';

  const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-[10px] font-sans font-medium no-underline cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 disabled:cursor-default',
    {
      variants: {
        variant: {
          default: 'bg-primary text-white hover:bg-accent-dark',
          ghost: 'border border-border bg-transparent text-primary hover:bg-secondary',
        },
        size: {
          default: 'px-[22px] py-[13px] text-base',
          small: 'px-[14px] py-2 text-sm',
        },
      },
      defaultVariants: { variant: 'default', size: 'default' },
    },
  );

  let { variant = 'default', size = 'default', href, class: className, children, ...rest } = $props();
</script>

{#if href}
  <a {href} class={cn(buttonVariants({ variant, size }), className)} {...rest}>
    {@render children()}
  </a>
{:else}
  <button class={cn(buttonVariants({ variant, size }), className)} {...rest}>
    {@render children()}
  </button>
{/if}
