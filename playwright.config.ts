import { defineConfig, devices } from '@playwright/test';

const APP_PORT = 5178;
const PROTOTYPE_PORT = 5180;
const APP = `http://127.0.0.1:${APP_PORT}`;
const PROTOTYPE = `http://127.0.0.1:${PROTOTYPE_PORT}`;
const PREVIEW_PORT = 4178;
const PREVIEW = `http://127.0.0.1:${PREVIEW_PORT}`;
// the production build is served only for `npm run e2e:preview`, so the other runs do not build it
const previewOnly = process.argv.includes('--project=preview');

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  // each worker runs a software-WebGL page, and the story scrubs over several seconds: one at a time keeps
  // the timings honest (two starved the machine before, and the longer journeys then timed out)
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: APP,
    // headless Chromium has no GPU: software WebGL keeps the 3D stage alive
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/fidelity.spec.ts', '**/preview/**'],
    },
    // paired screenshots for review by eye (L-2); slow, so it is its own project: `npm run e2e:fidelity`
    { name: 'fidelity', use: { ...devices['Desktop Chrome'] }, testMatch: '**/fidelity.spec.ts' },
    // the production build, prerendered and served as a visitor gets it: `npm run e2e:preview`
    {
      name: 'preview',
      use: { ...devices['Desktop Chrome'], baseURL: PREVIEW },
      testMatch: '**/preview/*.spec.ts',
    },
  ],
  webServer: [
    { command: 'npm run dev', url: APP, reuseExistingServer: true },
    ...(previewOnly
      ? [
          {
            command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PREVIEW_PORT}`,
            url: PREVIEW,
            reuseExistingServer: true,
            timeout: 180_000,
          },
        ]
      : []),
    // the frozen prototype keeps its layout (landing/ beside svg-assets/ and three-assets/), so it is served from there
    {
      command: `python -m http.server ${PROTOTYPE_PORT} --bind 127.0.0.1`,
      cwd: 'src/generated/prototype',
      url: `${PROTOTYPE}/landing/`,
      reuseExistingServer: true,
    },
  ],
});
