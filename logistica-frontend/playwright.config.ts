/**
 * Prerequisites to run E2E tests:
 *
 *   1. Django backend running at http://localhost:8000
 *      cd logistica-api && python manage.py runserver
 *
 *   2. Next.js frontend running at http://localhost:3000
 *      cd logistica-frontend && npm run dev
 *
 *   3. A test user must exist in the database:
 *      python manage.py shell -c "
 *        from django.contrib.auth import get_user_model
 *        U = get_user_model()
 *        U.objects.create_superuser('testuser', 'test@test.com', 'testpass123')
 *      "
 *      Then set: E2E_USERNAME=testuser  E2E_PASSWORD=testpass123
 *
 * webServer is intentionally NOT configured — both servers must be started manually
 * (project rule: npm run dev must never be executed by Claude/automation).
 */
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: 'e2e',
  reporter: [['html'], ['list']],
  use: {
    baseURL,
    trace: 'on',
    screenshot: 'on',
  },
  projects: [
    // Runs first: obtains tokens via API and seeds browser storageState.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Unauthenticated tests (login UI, public pages).
    // test.use({ storageState: { cookies:[], origins:[] } }) is set per-file.
    {
      name: 'no-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /login\.spec\.ts/,
    },
    // Authenticated tests: depend on setup, receive pre-seeded storageState.
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testIgnore: /login\.spec\.ts/,
    },
  ],
});
