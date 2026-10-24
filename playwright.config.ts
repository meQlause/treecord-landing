import { defineConfig, devices } from '@playwright/test';

const APP_PORT = 5178;
const PROTOTYPE_PORT = 5180;
const APP = `http://127.0.0.1:${APP_PORT}`;
const PROTOTYPE = `http://127.0.0.1:${PROTOTYPE_PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  workers: 2, // each worker runs a software-WebGL page; more starved the machine before
  use: {
    baseURL: APP,
    // headless Chromium has no GPU: software WebGL keeps the 3D stage alive
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: '**/fidelity.spec.ts' },
    // paired screenshots for review by eye (L-2); slow, so it is its own project: `npm run e2e:fidelity`
    { name: 'fidelity', use: { ...devices['Desktop Chrome'] }, testMatch: '**/fidelity.spec.ts' },
  ],
  webServer: [
    { command: 'npm run dev', url: APP, reuseExistingServer: true },
    // the prototype imports ../three-assets and ../svg-assets, so it is served from the repo root
    {
      command: `python -m http.server ${PROTOTYPE_PORT} --bind 127.0.0.1`,
      cwd: '..',
      url: `${PROTOTYPE}/landing/`,
      reuseExistingServer: true,
    },
  ],
});
