import { test, expect } from '@playwright/test';

// These tests exercise the login UI — reset storageState so we start unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

const validUsername = process.env.E2E_USERNAME ?? 'testuser';
const validPassword = process.env.E2E_PASSWORD ?? 'testpass123';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('valid credentials → redirect to /shipments', async ({ page }) => {
    await page.getByLabel('Usuario').fill(validUsername);
    // shadcn wraps the password input in a relative div, so the label's `for` points
    // to that div, not the <input> — getByPlaceholder is more reliable here.
    await page.getByPlaceholder('Tu contraseña').fill(validPassword);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/shipments/, { timeout: 15_000 });
  });

  test('invalid credentials → shows error alert', async ({ page }) => {
    await page.getByLabel('Usuario').fill('wronguser');
    await page.getByPlaceholder('Tu contraseña').fill('wrongpassword');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    // Backend (SimpleJWT) returns: "No active account found with the given credentials"
    // rendered via <p role="alert"> in LoginForm.tsx
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  });
});
