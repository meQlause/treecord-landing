/// <reference types="vitest/config" />
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line import/no-unresolved -- the plugin is exports-only ESM, which eslint-plugin-import's node resolver cannot read
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BARE_IMPORT = /^[a-z@]/;

// ../svg-assets and ../three-assets are shared sources with no node_modules of their own: resolve their
// bare imports (three, gsap) as if they were written inside this app.
const sharedAssets = (): Plugin => ({
  name: 'treecord-shared-assets',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    const outside = importer && !importer.startsWith(ROOT) && !importer.includes('node_modules');
    if (!outside || !BARE_IMPORT.test(source)) {
      return null;
    }

    return this.resolve(source, join(ROOT, 'index.html'), { ...options, skipSelf: true });
  },
});

export default defineConfig({
  plugins: [sharedAssets(), react()],
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/helpers/setup.ts'],
  },
});
