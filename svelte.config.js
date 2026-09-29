import cloudflare from '@sveltejs/adapter-cloudflare';
import staticAdapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: isCapacitorBuild
      ? staticAdapter({ fallback: 'index.html', precompress: true, strict: false })
      : cloudflare(),
    alias: {
      $lib: './src/lib'
    }
  }
};

export default config;
