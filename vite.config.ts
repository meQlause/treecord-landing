/// <reference types="vitest/config" />
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line import/no-unresolved -- the plugin is exports-only ESM, which eslint-plugin-import's node resolver cannot read
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BARE_IMPORT = /^[a-z@]/;

// The app imports nothing from outside this folder. Only the unit tests reach out, to load the prototype's
// own modules in ../svg-assets and ../three-assets as oracles. Those have no node_modules of their own, so
// their bare imports (three, gsap) resolve as if written inside this app. Test mode only.
const prototypeOracles = (): Plugin => ({
  name: 'treecord-prototype-oracles',
  enforce: 'pre',
  apply: (_config, { mode }) => mode === 'test',
  async resolveId(source, importer, options) {
    const outside = importer && !importer.startsWith(ROOT) && !importer.includes('node_modules');
    if (!outside || !BARE_IMPORT.test(source)) {
      return null;
    }

    return this.resolve(source, join(ROOT, 'index.html'), { ...options, skipSelf: true });
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [prototypeOracles(), react()],
  server: mode === 'test' ? { fs: { allow: ['..'] } } : {},
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/helpers/setup.ts'],
  },
}));
