import { test, expect } from './fixtures';

const P = 'E2E_DRV_';

// Unique suffix per call — prevents username/license_number collisions.
function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

// Minimal valid driver payload for API seeding.
// POST /api/drivers/ auto-creates the Django auth_user — no pre-seeding needed.
function driverSeed(id: string, overrides: Record<string, unknown> = {}) {
  return {
    username: `e2edrv${id.toLowerCase()}`,
    password: 'Secur3Driv3r!',
    email: `e2edrv${id.toLowerCase()}@e2etest.invalid`,
    first_name: 'E2E',
    last_name: `Drv${id}`,
    license_number: `E2E-${id}`,
    license_expiry: '2028-12-31',
    phone: '+10000000001',
    status: 'available',
    ...overrides,
  };
}

test.describe('Drivers CRUD', () => {
  // ── 1. List ───────────────────────────────────────────────────────────────
  test('list → seeded driver full name link visible in table', async ({ page, api }) => {
    const id = uid();
    const seed = driverSeed(id);
    const driverId = await api.seed('drivers', seed);

    try {
      // Search field queries user__username — ensures we land on the right row
      // regardless of how many other drivers exist.
      await page.goto(`/drivers?search=${seed.username}`);
      const fullName = `${seed.first_name} ${seed.last_name}`;
      await expect(page.getByRole('link', { name: fullName })).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove('drivers', driverId);
      // DELETE /api/drivers/{id}/ also removes the associated auth_user.
    }
  });

  // ── 2. Create + user-derived fields visible in detail ────────────────────
  test('create → driver appears in list; detail shows username / email / fullname', async ({
    page,
    api,
  }) => {
    const id = uid();
    const username = `e2edrv${id.toLowerCase()}`;
    const email = `e2edrv${id.toLowerCase()}@e2etest.invalid`;
    const firstName = 'E2E';
    const lastName = `Cre${id}`;
    const fullName = `${firstName} ${lastName}`;
    const license = `E2E-CRE-${id}`;

    const postDone = page.waitForResponse(
      (r) =>
        r.url().includes('/api/drivers/') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
      { timeout: 15_000 }
    );

    await page.goto('/drivers/new');

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill('Secur3Driv3r!');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('License Number').fill(license);

    // DatePicker — Popover + Calendar (react-day-picker v10).
    // react-day-picker sets aria-label to the full date ("Sunday, July 20th, 2026"),
    // so getByRole(name:'20') never matches. Use getByText on the text content instead.
    // Avoid month navigation entirely — the absolute nav button overlaps day cells
    // and force-clicking it hits the wrong element. Day 28 is always in the current
    // month, positioned below the nav row where there is no overlap.
    await page.getByText('Seleccionar fecha de vencimiento').click();
    await page.locator('[role="gridcell"]').getByText('28', { exact: true }).first().click();

    await page.getByLabel('Phone').fill('+10000000002');

    // Status — shadcn Select (combobox role)
    await page.getByRole('combobox').filter({ hasText: 'Select a status' }).click();
    await page.getByRole('option', { name: 'Available' }).click();

    await page.getByRole('button', { name: 'Create Driver' }).click();

    const response = await postDone;
    const { id: driverId } = await response.json();

    try {
      // onSuccess → router.push('/drivers')
      await expect(page).toHaveURL(/\/drivers$/, { timeout: 10_000 });
      await expect(page.getByRole('link', { name: fullName })).toBeVisible({ timeout: 10_000 });

      // Detail page — user-derived fields
      await page.goto(`/drivers/${driverId}`);
      await expect(page.getByRole('heading', { name: fullName })).toBeVisible({ timeout: 10_000 });
      // "Usuario" dt → username dd (exact: avoids matching the email which contains the username)
      await expect(page.getByText(username, { exact: true })).toBeVisible();
      // "Email" dt → email dd
      await expect(page.getByText(email, { exact: true })).toBeVisible();
    } finally {
      await api.remove('drivers', driverId);
    }
  });

  // ── 3. Validation — empty form ────────────────────────────────────────────
  test('validation → empty form shows required errors, no navigation', async ({ page }) => {
    await page.goto('/drivers/new');
    await page.getByRole('button', { name: 'Create Driver' }).click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('License number is required')).toBeVisible();
    await expect(page.getByText('License expiry is required')).toBeVisible();
    await expect(page.getByText('Phone is required')).toBeVisible();
    await expect(page).toHaveURL(/\/drivers\/new/);
  });

  // ── 4. Edit ───────────────────────────────────────────────────────────────
  test('edit → updated phone visible in detail page', async ({ page, api }) => {
    const id = uid();
    const seed = driverSeed(id);
    const driverId = await api.seed('drivers', seed);

    try {
      await page.goto(`/drivers/${driverId}/edit`);
      // Wait for form hydration (edit-only: phone is a plain Input)
      await expect(page.getByLabel('Phone')).toHaveValue(seed.phone as string, {
        timeout: 10_000,
      });

      const newPhone = '+19999999999';
      await page.getByLabel('Phone').fill(newPhone);
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // onSuccess → router.push(`/drivers/${id}`)
      await expect(page).toHaveURL(new RegExp(`/drivers/${driverId}$`), {
        timeout: 10_000,
      });
      await expect(page.getByText(newPhone)).toBeVisible();
    } finally {
      await api.remove('drivers', driverId);
    }
  });

  // ── 5. Delete ─────────────────────────────────────────────────────────────
  test('delete → driver disappears from list after confirmation', async ({ page, api }) => {
    const id = uid();
    const seed = driverSeed(id);
    const driverId = await api.seed('drivers', seed);
    const fullName = `${seed.first_name} ${seed.last_name}`;

    try {
      await page.goto(`/drivers?search=${seed.username}`);
      const row = page.getByRole('row').filter({ hasText: fullName });
      await expect(row).toBeVisible({ timeout: 10_000 });

      await row.getByRole('button', { name: 'Delete' }).click();

      // ConfirmDialog (table version — English)
      await expect(page.getByText('Delete Driver')).toBeVisible();
      await expect(
        page.getByText(`Are you sure you want to delete "${fullName}"`)
      ).toBeVisible();
      // ConfirmDialog renders last in DriversTable → confirm Delete is last in DOM.
      await page.getByRole('button', { name: 'Delete' }).last().click();

      await expect(page.getByRole('link', { name: fullName })).not.toBeVisible({
        timeout: 10_000,
      });
    } finally {
      // api.remove silently ignores 404 — safe if UI delete already succeeded.
      await api.remove('drivers', driverId);
    }
  });

  // ── 6. Search ─────────────────────────────────────────────────────────────
  test('search → filters by username to matching driver only', async ({ page, api }) => {
    const id1 = uid();
    const id2 = uid();
    const seed1 = driverSeed(id1);
    const seed2 = driverSeed(id2);

    const [driverId1, driverId2] = await Promise.all([
      api.seed('drivers', seed1),
      api.seed('drivers', seed2),
    ]);

    const fullName1 = `${seed1.first_name} ${seed1.last_name}`;
    const fullName2 = `${seed2.first_name} ${seed2.last_name}`;

    try {
      await page.goto('/drivers');
      // Placeholder uses Unicode ellipsis U+2026
      await page
        .getByPlaceholder('Search by username, email, license…')
        .fill(seed1.username as string);

      // Wait for debounce (300 ms) + API response before asserting negatives.
      await expect(page.getByRole('link', { name: fullName1 })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('link', { name: fullName2 })).not.toBeVisible();
    } finally {
      await Promise.all([
        api.remove('drivers', driverId1),
        api.remove('drivers', driverId2),
      ]);
    }
  });
});
