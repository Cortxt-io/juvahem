<script>
  import '../app.css';
  import { browser } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

  if (browser) {
    injectAnalytics();
    injectSpeedInsights();
  }

  let { children } = $props();
</script>

{@render children()}
