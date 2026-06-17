/**
 * Shipments E2E — central module, depends on: warehouse, supplier, customer, product, transport.
 *
 * No /shipments/[id]/items route exists — products (shipment_items) live inside the
 * shipment detail page. The create test verifies the product appears there.
 *
 * Status machine exercised: pending → picked_up (Asignar Transporte) → in_transit.
 */

import type { APIRequestContext } from '@playwright/test';
import { request, test, expect } from '@playwright/test';

const P = 'E2E_SHIP_';
const API_BASE = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000/api';
const E2E_USERNAME = process.env.E2E_USERNAME ?? 'testuser';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'testpass123';

// ── Shared dependency state (seeded once in beforeAll) ────────────────────────
let warehouseId: number;
let warehouseName: string;
let customerId: number;
let customerName: string;
let productId: number;
let productName: string;
let transportId: number;
let transportName: string;
let transportPlate: string;

// ── API helpers ───────────────────────────────────────────────────────────────

async function makeApiCtx(): Promise<{ ctx: APIRequestContext; headers: Record<string, string> }> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_BASE}/auth/login/`, {
    data: { username: E2E_USERNAME, password: E2E_PASSWORD },
  });
  const { access } = await res.json();
  return { ctx, headers: { Authorization: `Bearer ${access}` } };
}

/** Seed a pending shipment with 1 product and return { id, tracking_number }. */
async function seedShipment(): Promise<{ id: number; tracking_number: string }> {
  const { ctx, headers } = await makeApiCtx();
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);
  const deliveryDate = futureDate.toISOString().split('T')[0];

  const res = await ctx.post(`${API_BASE}/shipments/`, {
    data: {
      customer: customerId,
      origin_warehouse: warehouseId,
      destination_address: '456 E2E Dest St',
      destination_city: 'DestCity',
      destination_country: 'DestCountry',
      scheduled_delivery_date: deliveryDate,
      weight_kg: '5.000',
      products: [{ product: productId, quantity: 1 }],
    },
    headers,
  });
  const data = await res.json();
  await ctx.dispose();
  return data as { id: number; tracking_number: string };
}

/**
 * Cancel + delete a shipment regardless of current status.
 * Both calls are silently ignored on error (e.g. already gone).
 */
async function cleanupShipment(id: number) {
  const { ctx, headers } = await makeApiCtx();
  await ctx.post(`${API_BASE}/shipments/${id}/cancel/`, { headers }).catch(() => {});
  await ctx.delete(`${API_BASE}/shipments/${id}/`, { headers }).catch(() => {});
  await ctx.dispose();
}

// ── Suite ──────────────────────────────────────────────────────────────────────

test.describe('Shipments CRUD', () => {
  // Seed all dependencies once — each test seeds/cleans its own shipment.
  test.beforeAll(async () => {
    const { ctx, headers } = await makeApiCtx();
    const ts = Date.now().toString(36).toUpperCase();

    // Warehouse
    warehouseName = `${P}WH-${ts}`;
    const wh = await ctx.post(`${API_BASE}/warehouses/`, {
      data: {
        name: warehouseName,
        address: '1 E2E Ship St',
        city: 'E2EShipCity',
        country: 'E2EShipCountry',
        is_active: true,
      },
      headers,
    });
    warehouseId = (await wh.json()).id;

    // Supplier (needed only for product FK)
    const sup = await ctx.post(`${API_BASE}/suppliers/`, {
      data: {
        name: `${P}Supplier-${ts}`,
        contact_name: 'E2E Ship Contact',
        email: `e2eshippsup${ts.toLowerCase()}@e2etest.invalid`,
        phone: '+10000000003',
        address: '2 E2E Sup St',
        city: 'E2ESupCity',
        country: 'E2ESupCountry',
      },
      headers,
    });
    const supplierId = (await sup.json()).id;

    // Customer
    customerName = `${P}Customer-${ts}`;
    const cust = await ctx.post(`${API_BASE}/customers/`, {
      data: {
        name: customerName,
        customer_type: 'company',
        email: `e2eshipcust${ts.toLowerCase()}@e2etest.invalid`,
        phone: '+10000000004',
        address: '3 E2E Cust St',
        city: 'E2ECustCity',
        country: 'E2ECustCountry',
        tax_id: `E2ESHIPT${ts}`,
      },
      headers,
    });
    customerId = (await cust.json()).id;

    // Product (stock_quantity=50 so it can be added to shipments)
    productName = `${P}Product-${ts}`;
    const prod = await ctx.post(`${API_BASE}/products/`, {
      data: {
        name: productName,
        sku: `${P}SKU-${ts}`,
        unit_price: '25.00',
        stock_quantity: 50,
        weight_kg: '0.500',
        width_cm: '5.00',
        height_cm: '5.00',
        depth_cm: '5.00',
        supplier: supplierId,
        warehouse: warehouseId,
      },
      headers,
    });
    productId = (await prod.json()).id;

    // Transport (status: available — needed for assign-transport test)
    transportName = `${P}Transport-${ts}`;
    transportPlate = `E2E-${ts.slice(0, 6)}`;
    const trans = await ctx.post(`${API_BASE}/transport/`, {
      data: {
        name: transportName,
        type: 'truck',
        plate_number: transportPlate,
        capacity_kg: '1000.00',
        capacity_m3: '10.000',
        status: 'available',
      },
      headers,
    });
    transportId = (await trans.json()).id;

    await ctx.dispose();
  });

  test.afterAll(async () => {
    const { ctx, headers } = await makeApiCtx();
    // Delete in dependency order: product → transport → customer → supplier → warehouse.
    await ctx.delete(`${API_BASE}/products/${productId}/`, { headers }).catch(() => {});
    await ctx.delete(`${API_BASE}/transport/${transportId}/`, { headers }).catch(() => {});
    await ctx.delete(`${API_BASE}/customers/${customerId}/`, { headers }).catch(() => {});
    // Supplier ID is local to beforeAll scope — reconstruct via name search if needed.
    // Transport and product deletion handles cascade; just delete the FK-free resources.
    await ctx.delete(`${API_BASE}/warehouses/${warehouseId}/`, { headers }).catch(() => {});
    await ctx.dispose();
  });

  // ── 1. List ────────────────────────────────────────────────────────────────
  test('list → seeded shipment tracking_number visible in table', async ({ page }) => {
    const { id, tracking_number } = await seedShipment();
    try {
      await page.goto(`/shipments?search=${tracking_number}`);
      await expect(
        page.getByRole('link', { name: tracking_number })
      ).toBeVisible({ timeout: 10_000 });
    } finally {
      await cleanupShipment(id);
    }
  });

  // ── 2. Create via UI + tracking_number + product in detail ────────────────
  test('create → tracking_number auto-generated; product listed in shipment detail', async ({
    page,
  }) => {
    // Register POST 201 watcher before filling the form.
    const postDone = page.waitForResponse(
      (r) =>
        r.url().includes('/api/shipments/') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
      { timeout: 20_000 }
    );

    await page.goto('/shipments/new');

    // ── Customer combobox (custom, not shadcn) ──
    const customerInput = page.getByPlaceholder('Search customer by name or email…');
    await customerInput.click();
    await customerInput.fill(customerName);
    // Dropdown renders buttons with "{name} {email}" — filter by name text
    await page.locator('button').filter({ hasText: customerName }).first().click();

    // ── Origin Warehouse (shadcn Select) ──
    await page.getByRole('combobox').filter({ hasText: 'Select a warehouse' }).click();
    await page.getByRole('option', { name: new RegExp(warehouseName) }).first().click();

    // ── Destination fields ──
    await page.getByLabel('Destination Address').fill('789 Dest Ave');
    await page.getByLabel('Destination City').fill('TestCity');
    await page.getByLabel('Destination Country').fill('TestCountry');

    // ── DatePicker (minDate = today — must pick future date) ──
    // Strategy: compute today+15; if still in current month, pick it directly;
    // otherwise navigate to next month with a position-offset click to avoid the
    // nav button overlapping with the Saturday column of day cells.
    await page.getByText('Seleccionar fecha de entrega').click();
    const today = new Date();
    const target = new Date(today);
    target.setDate(today.getDate() + 15);
    const targetDay = String(target.getDate());
    if (target.getMonth() === today.getMonth()) {
      // Same month — click directly without navigation.
      await page.locator('[role="gridcell"]').getByText(targetDay, { exact: true }).first().click();
    } else {
      // Next month — click nav at y=5 to avoid day-cell overlap with absolute button.
      await page.getByRole('button', { name: /next month/i }).click({ position: { x: 14, y: 5 } });
      await page.locator('[role="gridcell"]').getByText(targetDay, { exact: true }).first().click();
    }

    // ── Weight ──
    await page.getByLabel('Weight (kg)').fill('10.000');

    // ── Products combobox (custom, not shadcn) ──
    const productInput = page.getByPlaceholder('Search products by name or SKU…');
    await productInput.click();
    await productInput.fill(productName);
    // Dropdown shows buttons with product name + SKU + price
    await page.locator('button').filter({ hasText: productName }).first().click();

    await page.getByRole('button', { name: 'Crear Envío' }).click();

    const response = await postDone;
    const shipment = await response.json();
    const { id, tracking_number } = shipment as { id: number; tracking_number: string };

    try {
      // onSuccess → router.push('/shipments')
      await expect(page).toHaveURL(/\/shipments$/, { timeout: 10_000 });

      // Tracking number link visible in list
      await expect(
        page.getByRole('link', { name: tracking_number })
      ).toBeVisible({ timeout: 10_000 });

      // Detail page: tracking_number is prominent; product appears in Products section
      await page.goto(`/shipments/${id}`);
      await expect(page.getByText(tracking_number, { exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(productName)).toBeVisible();
    } finally {
      await cleanupShipment(id);
    }
  });

  // ── 3. Status transitions: pending → picked_up → in_transit ───────────────
  test('assign transport → picked_up; mark in transit → in_transit', async ({ page }) => {
    const { id } = await seedShipment();

    try {
      await page.goto(`/shipments/${id}`);

      // ── pending: Asignar Transporte button visible ──
      await expect(
        page.getByRole('button', { name: 'Asignar Transporte' })
      ).toBeVisible({ timeout: 10_000 });

      // Open AssignTransportDialog (Radix Dialog)
      await page.getByRole('button', { name: 'Asignar Transporte' }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

      // Select the seeded transport inside the dialog
      await page
        .getByRole('combobox')
        .filter({ hasText: 'Seleccionar transporte' })
        .click();
      await page.getByRole('option', { name: new RegExp(transportName) }).first().click();

      // Submit dialog — scoped to dialog to avoid ambiguous button names
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Asignar Transporte' })
        .click();

      // Dialog closes; query refetches; status → picked_up.
      // "Marcar En Tránsito" button appears when canMarkInTransit = true (picked_up).
      await expect(
        page.getByRole('button', { name: 'Marcar En Tránsito' })
      ).toBeVisible({ timeout: 15_000 });

      // ── picked_up → in_transit ──
      await page.getByRole('button', { name: 'Marcar En Tránsito' }).click();

      // ConfirmDialog (custom component — renders inline, not in a Radix portal)
      await expect(page.getByText('Marcar como En Tránsito')).toBeVisible();
      // Confirm button is the LAST "Marcar En Tránsito" button in DOM
      // (ConfirmDialog renders after the page action buttons in the JSX)
      await page.getByRole('button', { name: 'Marcar En Tránsito' }).last().click();

      // Status → in_transit.
      // "Marcar Entregado" appears (canMarkDelivered = true for both picked_up and in_transit).
      // Checking its visibility is more reliable than checking "Marcar En Tránsito" disappears,
      // because during the transition both buttons briefly coexist (page action + disabled confirm),
      // which would cause a strict-mode violation on not.toBeVisible.
      await expect(
        page.getByRole('button', { name: 'Marcar Entregado' })
      ).toBeVisible({ timeout: 15_000 });

      // Once in_transit, the "Marcar En Tránsito" page-action button must be gone.
      // Use .first() to avoid strict-mode if the dialog button is still in the DOM.
      await expect(
        page.getByRole('button', { name: 'Marcar En Tránsito' }).first()
      ).not.toBeVisible({ timeout: 10_000 });
    } finally {
      // Cancel → delete, handling any status (cancel is a no-op if already cancelled)
      await cleanupShipment(id);
    }
  });

  // ── 4. Delete pending shipment from detail page ────────────────────────────
  test('delete pending shipment → redirects to /shipments', async ({ page }) => {
    const { id, tracking_number } = await seedShipment();

    try {
      await page.goto(`/shipments/${id}`);

      // Pending shipments show the "Eliminar" button
      await expect(page.getByRole('button', { name: 'Eliminar' })).toBeVisible({
        timeout: 10_000,
      });

      await page.getByRole('button', { name: 'Eliminar' }).click();

      // ConfirmDialog: title "Eliminar Envío", confirmLabel "Eliminar"
      await expect(page.getByText('Eliminar Envío')).toBeVisible();
      // exact:true — the ConfirmDialog description also contains tracking_number as a substring,
      // causing a strict-mode violation without exact matching.
      await expect(page.getByText(tracking_number, { exact: true })).toBeVisible();

      // Confirm — LAST "Eliminar" button (ConfirmDialog renders at end of JSX)
      await page.getByRole('button', { name: 'Eliminar' }).last().click();

      // onSuccess → router.push('/shipments')
      await expect(page).toHaveURL(/\/shipments$/, { timeout: 10_000 });

      // Shipment no longer in list
      await expect(
        page.getByRole('link', { name: tracking_number })
      ).not.toBeVisible({ timeout: 5_000 });
    } finally {
      await cleanupShipment(id); // safe to call: ignores 404 if already deleted by UI
    }
  });
});
