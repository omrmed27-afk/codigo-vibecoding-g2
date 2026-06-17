import { test, expect } from './fixtures';

// Distinctive prefix — avoids collisions with real data; easy to spot if cleanup fails.
const P = 'E2E_WH_';

test.describe('Warehouses CRUD', () => {
  // ── 1. List ──────────────────────────────────────────────────────────────
  test('list → seeded warehouse renders in table', async ({ page, api }) => {
    const id = await api.seed('warehouses', {
      name: `${P}List`,
      address: '1 List St',
      city: 'ListCity',
      country: 'ListCountry',
    });

    try {
      // Use URL search param to skip pagination — no debounce for initial load.
      await page.goto(`/warehouses?search=${P}List`);
      await expect(
        page.getByRole('link', { name: `${P}List` })
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove('warehouses', id);
    }
  });

  // ── 2. Create ─────────────────────────────────────────────────────────────
  test('create → new warehouse appears in list', async ({ page, api }) => {
    const name = `${P}Create`;

    // Register watcher before clicking submit so the response is captured.
    const postDone = page.waitForResponse(
      (r) =>
        r.url().includes('/api/warehouses/') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
      { timeout: 15_000 }
    );

    await page.goto('/warehouses/new');
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Address').fill('2 Create Ave');
    await page.getByLabel('City').fill('CreateCity');
    await page.getByLabel('Country').fill('CreateCountry');
    await page.getByRole('button', { name: 'Create Warehouse' }).click();

    const response = await postDone;
    const { id } = await response.json();

    try {
      // onSuccess → router.push('/warehouses')
      await expect(page).toHaveURL(/\/warehouses$/, { timeout: 10_000 });
      await expect(page.getByRole('link', { name })).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove('warehouses', id);
    }
  });

  // ── 3. Validation — required fields ────────────────────────────────────────
  test('validation → empty form shows required field errors, no navigation', async ({ page }) => {
    await page.goto('/warehouses/new');
    await page.getByRole('button', { name: 'Create Warehouse' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Address is required')).toBeVisible();
    await expect(page.getByText('City is required')).toBeVisible();
    await expect(page.getByText('Country is required')).toBeVisible();
    await expect(page).toHaveURL(/\/warehouses\/new/);
  });

  // ── 4. Validation — paired lat/lng ──────────────────────────────────────────
  test('validation → latitude without longitude shows paired error', async ({ page }) => {
    await page.goto('/warehouses/new');
    await page.getByLabel('Name').fill('Val Test');
    await page.getByLabel('Address').fill('1 St');
    await page.getByLabel('City').fill('City');
    await page.getByLabel('Country').fill('Country');
    // Use placeholder because label text has a nested "(optional)" span.
    await page.getByPlaceholder('e.g. 41.881832').fill('40.0');
    await page.getByRole('button', { name: 'Create Warehouse' }).click();

    await expect(
      page.getByText('Both latitude and longitude are required together')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/warehouses\/new/);
  });

  // ── 5. Edit ───────────────────────────────────────────────────────────────
  test('edit → updated name visible in detail page', async ({ page, api }) => {
    const id = await api.seed('warehouses', {
      name: `${P}EditOrig`,
      address: '3 Edit St',
      city: 'EditCity',
      country: 'EditCountry',
    });

    try {
      await page.goto(`/warehouses/${id}/edit`);
      // Wait for the form to hydrate with the pre-fetched warehouse data.
      await expect(page.getByLabel('Name')).toHaveValue(`${P}EditOrig`, {
        timeout: 10_000,
      });

      // .fill() replaces existing content entirely.
      await page.getByLabel('Name').fill(`${P}EditUpdated`);
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // onSuccess → router.push(`/warehouses/${id}`) — detail page
      await expect(page).toHaveURL(new RegExp(`/warehouses/${id}$`), {
        timeout: 10_000,
      });
      await expect(page.getByRole('heading', { name: `${P}EditUpdated` })).toBeVisible();
    } finally {
      await api.remove('warehouses', id);
    }
  });

  // ── 6. Delete ─────────────────────────────────────────────────────────────
  test('delete → warehouse disappears from list after confirmation', async ({
    page,
    api,
  }) => {
    const name = `${P}Delete`;
    const id = await api.seed('warehouses', {
      name,
      address: '4 Del St',
      city: 'DelCity',
      country: 'DelCountry',
    });

    try {
      await page.goto(`/warehouses?search=${name}`);

      // .first() + count — a stale record from a failed prior run may produce 2 rows.
      const rows = page.getByRole('row').filter({ hasText: name });
      await rows.first().waitFor({ state: 'visible', timeout: 10_000 });
      const countBefore = await rows.count();

      // Click the row-level Delete button.
      await rows.first().getByRole('button', { name: 'Delete' }).click();

      // ConfirmDialog appears.
      await expect(page.getByText('Delete Warehouse')).toBeVisible();
      await expect(
        page.getByText(`Are you sure you want to delete "${name}"`)
      ).toBeVisible();

      // Click the red confirm button.
      // ConfirmDialog renders last in WarehousesTable → its Delete button is last in DOM.
      await page.getByRole('button', { name: 'Delete' }).last().click();

      // Exactly one row must have been removed.
      await expect(rows).toHaveCount(countBefore - 1, { timeout: 10_000 });
    } finally {
      // api.remove silently ignores 404 — safe to call even if already deleted.
      await api.remove('warehouses', id);
    }
  });

  // ── 7. Search / filter ────────────────────────────────────────────────────
  test('search → filters table to matching warehouse only', async ({
    page,
    api,
  }) => {
    const [id1, id2, id3] = await Promise.all([
      api.seed('warehouses', { name: `${P}Alpha`, address: '5a St', city: 'Alpha', country: 'C' }),
      api.seed('warehouses', { name: `${P}Beta`, address: '5b St', city: 'Beta', country: 'C' }),
      api.seed('warehouses', { name: `${P}Gamma`, address: '5c St', city: 'Gamma', country: 'C' }),
    ]);

    try {
      await page.goto('/warehouses');

      // Type in the search box — debounce is 300 ms, then API filters server-side.
      await page.getByPlaceholder('Search warehouses...').fill(`${P}Beta`);

      // Wait for the filtered response to render before asserting negatives.
      await expect(
        page.getByRole('link', { name: `${P}Beta` })
      ).toBeVisible({ timeout: 10_000 });

      // Other seeded records must not appear in the filtered results.
      await expect(page.getByRole('link', { name: `${P}Alpha` })).not.toBeVisible();
      await expect(page.getByRole('link', { name: `${P}Gamma` })).not.toBeVisible();
    } finally {
      await Promise.all([
        api.remove('warehouses', id1),
        api.remove('warehouses', id2),
        api.remove('warehouses', id3),
      ]);
    }
  });
});
