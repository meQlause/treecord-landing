/// <reference types="vitest/config" />
// eslint-disable-next-line import/no-unresolved -- the plugin is exports-only ESM, which eslint-plugin-import's node resolver cannot read
import react from '@vitejs/plugin-react';
import { createElement } from 'react';
import { createServer, defineConfig, type Plugin } from 'vite';

const VIEW = '/src/features/landing/landing.view.tsx';
const EMPTY_ROOT = '<div id="root"></div>';

// The built page carries the landing as plain HTML (the article, copy and links), so it reads without
// JavaScript. The client replaces it when it mounts and then adds the pinned layout. The illustrations are
// mounted by the client only, so the prerendered article is text without art.
const prerender = (): Plugin => ({
  name: 'treecord-prerender',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    async handler(html) {
      const server = await createServer({
        configFile: false,
        plugins: [react()],
        server: { middlewareMode: true },
        appType: 'custom',
        logLevel: 'silent',
      });
      try {
        const view = (await server.ssrLoadModule(
          VIEW,
        )) as typeof import('./src/features/landing/landing.view');
        const dom = await import('react-dom/server');

        return html.replace(
          EMPTY_ROOT,
          `<div id="root">${dom.renderToString(createElement(view.LandingView, {}))}</div>`,
        );
      } finally {
        await server.close();
      }
    },
  },
});

const THREE_KB = 560; // the warning limit: three.js plus headroom

// three.js is most of the 3D chunk's weight; it gets its own chunk so neither goes over the 500 kB budget.
const chunkOf = (id: string): string | undefined =>
  id.includes('/node_modules/three/') ? 'three' : undefined;

export default defineConfig({
  // relative asset URLs: the built page works from any path, e.g. served at /landing/ by the mockup site
  base: './',
  plugins: [react(), prerender()],
  // three.js alone is 539 kB minified (136 kB gzip), its own floor; the app's chunks are far under 500 kB
  build: { chunkSizeWarningLimit: THREE_KB, rollupOptions: { output: { manualChunks: chunkOf } } },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/helpers/setup.ts'],
  },
});
