const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 120000,          // 90s per test (Render is slow)
  globalTimeout: 1800000,   // 15 mins total
  retries: 1,
  workers: 1,              // 1 worker (sequential - safer for login tests)
  reporter: [
    ['html', { outputFolder: 'test-report', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'https://resume-builder-v2-topaz.vercel.app',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,      // 15s for each action
    navigationTimeout: 45000,  // 45s for page loads
    locale: 'en-US',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});