// End-to-end tests run against the PRODUCTION build (both languages),
// i.e. exactly what users will get. Run with: npm test
import {defineConfig, devices} from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {name: 'desktop', use: {...devices['Desktop Chrome']}, testIgnore: /mobile\.spec/},
    {name: 'mobile', use: {...devices['Pixel 7']}, testMatch: /mobile\.spec/},
  ],
  webServer: {
    command: `npm run build && npx docusaurus serve --port ${PORT} --no-open`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
