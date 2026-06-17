import { test, expect } from '@playwright/test';

const validUsername = process.env.E2E_USERNAME ?? 'testuser';
const validPassword = process.env.E2E_PASSWORD ?? 'testpass123';

// ── Unauthenticated tests (login UI) ──────────────────────────────────────
// Override the chromium project's storageState so these tests start clean.
test.describe('Login UI — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('valid credentials → redirects to /shipments and shows Sidebar + Topbar', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario').fill(validUsername);
    // Password label's `for` points to the wrapper div, not the input — use placeholder.
    await page.getByPlaceholder('Tu contraseña').fill(validPassword);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/shipments/, { timeout: 15_000 });
    // Sidebar renders an <h1>Logística</h1> — only present in the dashboard layout.
    await expect(page.getByRole('heading', { name: 'Logística' })).toBeVisible();
    // Topbar renders a <header> element.
    await expect(page.locator('header')).toBeVisible();
  });

  test('invalid credentials → shows error alert, stays on /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Usuario').fill('wronguser');
    await page.getByPlaceholder('Tu contraseña').fill('wrongpassword');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('no token in localStorage → /warehouses redirects to /login', async ({ page }) => {
    // proxy.ts checks the `is_logged_in` cookie server-side before AuthGuard runs.
    await page.goto('/warehouses');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

// ── Authenticated tests (active session via storageState) ─────────────────
// The `chromium` project injects playwright/.auth/user.json automatically.
test.describe('Authenticated session', () => {
  test('active session → /shipments loads with Sidebar and Topbar', async ({ page }) => {
    await page.goto('/shipments');
    await expect(page).toHaveURL(/\/shipments/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Logística' })).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('logout → clears tokens, redirects to /login; re-entering /warehouses also redirects', async ({ page }) => {
    await page.goto('/shipments');
    await expect(page).toHaveURL(/\/shipments/, { timeout: 15_000 });

    // Open the profile dropdown in Topbar and click the logout item.
    await page.getByRole('button', { name: 'Menú de perfil' }).click();
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // auth.store.logout() removes refresh_token from localStorage.
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
    expect(refreshToken).toBeNull();

    // Visiting a protected route again should redirect to /login (proxy.ts clears the cookie too).
    await page.goto('/warehouses');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('(advanced) 401 from API → interceptor refreshes token + retries, user stays on page', async ({ page }) => {
    let warehousesCallCount = 0;

    // Intercept the first warehouses list request and respond with 401 to simulate an
    // expired access token.  Subsequent calls (the retry) pass through to the real backend.
    await page.route(/api\/warehouses/, async (route) => {
      warehousesCallCount++;
      if (warehousesCallCount === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'authentication_required',
              message: 'Given token not valid for any token type',
              details: { detail: 'Given token not valid for any token type' },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Register response watcher BEFORE navigation so it captures the retry.
    // The 401 is fulfilled by us; the retry goes to the real backend (200).
    // Waiting for a real 200 proves the intercept→refresh→retry cycle completed.
    const retrySucceeded = page.waitForResponse(
      (r) => r.url().includes('/api/warehouses') && r.status() === 200,
      { timeout: 15_000 },
    );

    await page.goto('/warehouses');
    await retrySucceeded;

    // User should NOT have been expelled to /login.
    await expect(page).toHaveURL(/\/warehouses/);
    // Confirm a retry happened (first call returned 401; second got through).
    expect(warehousesCallCount).toBeGreaterThan(1);
  });
});
