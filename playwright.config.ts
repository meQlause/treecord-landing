import { defineConfig, devices } from '@playwright/test';

const PORT = 5178;
const URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  use: {
    baseURL: URL,
    // headless Chromium has no GPU: software WebGL keeps the 3D stage alive
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev', url: URL, reuseExistingServer: true },
});
