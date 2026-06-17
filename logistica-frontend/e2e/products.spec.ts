import type { Page } from '@playwright/test';
import { request } from '@playwright/test';
import { test, expect } from './fixtures';

const P = 'E2E_PROD_';
const API_BASE = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000/api';
const E2E_USERNAME = process.env.E2E_USERNAME ?? 'testuser';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123';

// Shared state — seeded once before all tests, cleaned up after.
let supplierId: number;
let supplierName: string;
let warehouseId: number;
let warehouseName: string;

// Fresh authenticated API context for beforeAll / afterAll (no fixture available there).
async function makeApiCtx() {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_BASE}/auth/login/`, {
    data: { username: E2E_USERNAME, password: E2E_PASSWORD },
  });
  const { access } = await res.json();
  return { ctx, headers: { Authorization: `Bearer ${access}` } };
}

// Minimal valid product payload for API seeding.
function productSeed(overrides: Record<string, unknown> = {}) {
  return {
    name: `${P}Product`,
    sku: `${P}${Date.now().toString(36).toUpperCase()}`,
    unit_price: '99.99',
    stock_quantity: 5,
    weight_kg: '1.000',
    width_cm: '10.00',
    height_cm: '10.00',
    depth_cm: '10.00',
    supplier: supplierId,
    warehouse: warehouseId,
    ...overrides,
  };
}

// Fill all required product form fields (supplier/warehouse comboboxes included).
async function fillForm(page: Page, values: { name: string; sku: string }) {
  await page.getByLabel('Name').fill(values.name);
  await page.getByLabel('SKU').fill(values.sku);
  await page.getByLabel('Unit Price').fill('149.99');
  await page.getByLabel('Stock Quantity').fill('3');
  await page.getByLabel('Weight (kg)').fill('2.000');
  await page.getByLabel('Width (cm)').fill('20.00');
  await page.getByLabel('Height (cm)').fill('15.00');
  await page.getByLabel('Depth (cm)').fill('10.00');

  // Shadcn Select — click trigger (combobox role), then pick the option from the portal.
  // .first() guards against stale duplicate supplier/warehouse records from failed prior runs.
  await page.getByRole('combobox').filter({ hasText: 'Select a supplier' }).click();
  await page.getByRole('option', { name: supplierName }).first().click();

  await page.getByRole('combobox').filter({ hasText: 'Select a warehouse' }).click();
  await page.getByRole('option', { name: warehouseName }).first().click();
}

test.describe('Products CRUD', () => {
  // ── Shared fixture: warehouse + supplier needed by every product ───────────
  test.beforeAll(async () => {
    const { ctx, headers } = await makeApiCtx();
    supplierName = `${P}Supplier`;
    warehouseName = `${P}Warehouse`;

    const whRes = await ctx.post(`${API_BASE}/warehouses/`, {
      data: {
        name: warehouseName,
        address: '1 E2E Prod St',
        city: 'E2EProdCity',
        country: 'E2EProdCountry',
        is_active: true,
      },
      headers,
    });
    warehouseId = (await whRes.json()).id;

    // Use timestamp in email so re-runs don't collide if prior cleanup failed.
    const supRes = await ctx.post(`${API_BASE}/suppliers/`, {
      data: {
        name: supplierName,
        contact_name: 'E2E Products Test',
        email: `e2e-prod-${Date.now()}@e2etest.invalid`,
        phone: '+10000000001',
        address: '2 E2E Sup St',
        city: 'E2ESupCity',
        country: 'E2ESupCountry',
      },
      headers,
    });
    supplierId = (await supRes.json()).id;

    await ctx.dispose();
  });

  test.afterAll(async () => {
    const { ctx, headers } = await makeApiCtx();
    // Individual tests clean up their own products via api.remove, so only the
    // shared warehouse and supplier need to be removed here.
    await ctx.delete(`${API_BASE}/warehouses/${warehouseId}/`, { headers });
    await ctx.delete(`${API_BASE}/suppliers/${supplierId}/`, { headers });
    await ctx.dispose();
  });

  // ── 1. List ───────────────────────────────────────────────────────────────
  test('list → seeded product renders in table', async ({ page, api }) => {
    const name = `${P}List`;
    const id = await api.seed('products', productSeed({ name }));

    try {
      await page.goto(`/products?search=${name}`);
      await expect(page.getByRole('link', { name })).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove('products', id);
    }
  });

  // ── 2. Create — verifies selects populate and product lands in list ────────
  test('create → supplier/warehouse selects populate; product appears in list', async ({
    page,
    api,
  }) => {
    const name = `${P}Create`;
    const sku = productSeed().sku as string; // random per run — avoids stale-SKU collisions

    // Register watcher before clicking submit.
    const postDone = page.waitForResponse(
      (r) =>
        r.url().includes('/api/products/') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
      { timeout: 15_000 }
    );

    await page.goto('/products/new');

    // Verify selects are present and show placeholders before choosing.
    await expect(
      page.getByRole('combobox').filter({ hasText: 'Select a supplier' })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('combobox').filter({ hasText: 'Select a warehouse' })
    ).toBeVisible();

    await fillForm(page, { name, sku });

    // After selection, triggers should reflect chosen values.
    await expect(
      page.getByRole('combobox').filter({ hasText: supplierName })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox').filter({ hasText: warehouseName })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Create Product' }).click();

    const response = await postDone;
    const { id } = await response.json();

    try {
      // onSuccess → router.push('/products')
      await expect(page).toHaveURL(/\/products$/, { timeout: 10_000 });
      await expect(page.getByRole('link', { name })).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.remove('products', id);
    }
  });

  // ── 3. Validation — empty form ────────────────────────────────────────────
  test('validation → empty form shows required errors, no navigation', async ({ page }) => {
    await page.goto('/products/new');
    await page.getByRole('button', { name: 'Create Product' }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('SKU is required')).toBeVisible();
    await expect(page.getByText('Supplier is required')).toBeVisible();
    await expect(page.getByText('Warehouse is required')).toBeVisible();
    await expect(page).toHaveURL(/\/products\/new/);
  });

  // ── 4. Edit ───────────────────────────────────────────────────────────────
  test('edit → updated name visible in detail page', async ({ page, api }) => {
    const id = await api.seed(
      'products',
      productSeed({ name: `${P}EditOrig` })
    );

    try {
      await page.goto(`/products/${id}/edit`);
      await expect(page.getByLabel('Name')).toHaveValue(`${P}EditOrig`, {
        timeout: 10_000,
      });

      await page.getByLabel('Name').fill(`${P}EditUpdated`);
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // onSuccess → router.push(`/products/${id}`)
      await expect(page).toHaveURL(new RegExp(`/products/${id}$`), {
        timeout: 10_000,
      });
      await expect(
        page.getByRole('heading', { name: `${P}EditUpdated` })
      ).toBeVisible();
    } finally {
      await api.remove('products', id);
    }
  });

  // ── 5. Delete ─────────────────────────────────────────────────────────────
  test('delete → product disappears from list after confirmation', async ({
    page,
    api,
  }) => {
    const name = `${P}Delete`;
    const id = await api.seed('products', productSeed({ name }));

    try {
      await page.goto(`/products?search=${name}`);
      const rows = page.getByRole('row').filter({ hasText: name });
      await rows.first().waitFor({ state: 'visible', timeout: 10_000 });
      const countBefore = await rows.count();

      await rows.first().getByRole('button', { name: 'Delete' }).click();

      // ConfirmDialog (English version from table)
      await expect(page.getByText('Delete Product')).toBeVisible();
      await expect(
        page.getByText(`Are you sure you want to delete "${name}"`)
      ).toBeVisible();
      // Confirm button is last Delete button in DOM (ConfirmDialog renders after table rows).
      await page.getByRole('button', { name: 'Delete' }).last().click();

      // One row removed — handles stale duplicates from failed prior runs.
      await expect(rows).toHaveCount(countBefore - 1, { timeout: 10_000 });
    } finally {
      await api.remove('products', id);
    }
  });

  // ── 6. Search ─────────────────────────────────────────────────────────────
  test('search → filters to matching product only', async ({ page, api }) => {
    const [id1, id2] = await Promise.all([
      api.seed('products', productSeed({ name: `${P}SrchFoo` })),
      api.seed('products', productSeed({ name: `${P}SrchBar` })),
    ]);

    try {
      await page.goto('/products');
      // Placeholder uses Unicode ellipsis U+2026.
      await page
        .getByPlaceholder('Search by name, SKU, description…')
        .fill(`${P}SrchFoo`);

      // Wait for debounce (300 ms) + API response before asserting negatives.
      await expect(
        page.getByRole('link', { name: `${P}SrchFoo` })
      ).toBeVisible({ timeout: 10_000 });
      await expect(
        page.getByRole('link', { name: `${P}SrchBar` })
      ).not.toBeVisible();
    } finally {
      await Promise.all([
        api.remove('products', id1),
        api.remove('products', id2),
      ]);
    }
  });

  // ── 7. SKU uniqueness ─────────────────────────────────────────────────────
  test('duplicate SKU → backend error displayed on SKU field', async ({
    page,
    api,
  }) => {
    // Timestamp suffix → unique per run; avoids collision with stale DB records.
    const sku = `${P}DUPE-${Date.now().toString(36).toUpperCase()}`;
    const id = await api.seed(
      'products',
      productSeed({ name: `${P}DupeSeed`, sku })
    );

    try {
      await page.goto('/products/new');
      // Submit with the same SKU — all other fields valid.
      await fillForm(page, { name: `${P}DupeAttempt`, sku });

      // Capture the 400 response before clicking so we can read the actual SKU error text.
      const errorResp = page.waitForResponse(
        (r) =>
          r.url().includes('/api/products/') &&
          r.request().method() === 'POST' &&
          r.status() === 400,
        { timeout: 15_000 }
      );

      await page.getByRole('button', { name: 'Create Product' }).click();

      const resp = await errorResp;
      const body = await resp.json();
      // custom_exception_handler wraps DRF errors as error.details.{field}[0]
      const skuErrorMsg: string =
        body?.error?.details?.sku?.[0] ?? 'This field must be unique.';

      // ProductForm.handleFieldErrors calls form.setError('sku', { message }) →
      // FormMessage renders the exact string returned by the backend.
      await expect(page.getByText(skuErrorMsg)).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/products\/new/);
    } finally {
      await api.remove('products', id);
    }
  });
});
