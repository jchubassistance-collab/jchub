import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests of the public site: they only read pages and use tools in the browser,
 * nothing is sent or bought. Against the local server by default:
 *   npm run build && npm start      (another terminal)
 *   npm run test:e2e
 * Against production after a deployment:
 *   E2E_BASE_URL=https://jchub.dev npm run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
