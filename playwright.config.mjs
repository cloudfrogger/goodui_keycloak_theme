import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: { baseURL: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8089', browserName: 'chromium' },
  reporter: 'list',
  outputDir: 'test-results',
});
