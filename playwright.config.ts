import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
    launchOptions: {
      args: ['--disable-gpu', '--use-gl=swiftshader']
    }
  },
  webServer: {
    command: 'npx serve -l 5173 .',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000
  },
  reporter: [['list'], ['html', { outputFolder: 'reports/playwright', open: 'never' }]]
});
