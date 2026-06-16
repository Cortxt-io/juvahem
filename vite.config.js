import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // data/ lives at the repo root (the Python ETL writes there and the node
    // test reads it). Allow Vite to read it during dev/build for import.meta.glob.
    fs: { allow: ['.'] }
  }
});
