import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Pin the Vercel function runtime so the local Node version (24) doesn't
    // matter — Vercel runs Node 22.x.
    adapter: adapter({ runtime: 'nodejs22.x' })
  }
};

export default config;
