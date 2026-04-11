import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 15000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:3001',
        headless: true,
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
    webServer: {
        command: 'npx serve -l 3001',
        port: 3001,
        reuseExistingServer: !process.env.CI,
    },
});
