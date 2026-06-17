import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = 'playwright/.auth/user.json';
const API_BASE = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000/api';
const username = process.env.E2E_USERNAME ?? 'testuser';
const password = process.env.E2E_PASSWORD ?? 'testpass123';

setup('authenticate via API and seed storageState', async ({ page, context, request }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  // Obtain tokens directly from DRF — faster and independent of login UI
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { username, password },
  });
  expect(res.ok(), `Login API failed (${res.status()}): ${await res.text()}`).toBeTruthy();

  const { refresh, user } = await res.json();

  // Navigate to /login to establish http://localhost:3000 as a known origin
  // so localStorage.setItem calls land on the correct origin.
  await page.goto('/login');

  // Seed localStorage: auth.store.ts reads these keys on initFromStorage
  await page.evaluate(
    ({ refreshToken, userData }) => {
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
    },
    { refreshToken: refresh, userData: user ?? { id: 0, username } }
  );

  // Set the cookie that proxy.ts checks before allowing dashboard routes
  await context.addCookies([
    {
      name: 'is_logged_in',
      value: '1',
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);

  // Smoke-check: protected route should load without redirecting to /login
  await page.goto('/shipments');
  await expect(page).toHaveURL(/\/shipments/, { timeout: 15_000 });

  await context.storageState({ path: AUTH_FILE });
});
