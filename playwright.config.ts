import { defineConfig, devices } from '@playwright/test'
const port = Number(process.env.PLAYWRIGHT_PORT || 3100)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4,
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 1100 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', channel: 'chrome' } },
  ],
  webServer: {
    command: 'npm start',
    url: `http://127.0.0.1:${port}/health`,
    env: { PORT: String(port), API_UPSTREAM: 'http://127.0.0.1:8001' },
    reuseExistingServer: false,
  },
})
