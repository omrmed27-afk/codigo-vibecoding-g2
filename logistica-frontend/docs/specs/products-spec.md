# Spec: Products Module

**Status:** pending approval
**Generated:** 2026-05-28
**Dependencies:** warehouses (done), suppliers (done)

---

## Infrastructure Already in Place (Do NOT Recreate)

The following are pre-built and shared across all modules — do not touch:

- `services/api.ts` — Axios singleton with JWT Bearer interceptor and 401 refresh queue
- `stores/auth.store.ts` — Zustand auth state
- `types/api.ts` — `PaginatedResponse<T>`, `ApiError`
- `types/suppliers.ts` — `Supplier`, `SupplierListParams` (already exists — import, never redefine)
- `types/warehouses.ts` — `Warehouse`, `WarehouseListParams` (already exists — import, never redefine)
- `services/suppliers.ts` — `getList` for suppliers (already exists — use it inside the form query)
- `services/warehouses.ts` — `getList` for warehouses (already exists — use it inside the form query)
- `hooks/suppliers/use-suppliers.ts` — `useSupplierList` (already exists — import, never redefine)
- `hooks/warehouses/use-warehouses.ts` — `useWarehouseList` (already exists — import, never redefine)
- `components/shared/DataTable.tsx` — TanStack Table wrapper
- `components/shared/PageHeader.tsx` — title + action button
- `components/shared/ConfirmDialog.tsx` — delete confirmation modal
- `components/shared/StatusBadge.tsx` — colored badge
- `components/shared/LoadingSpinner.tsx` — spinner
- `components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new `products` block, never remove existing `warehouses`, `suppliers`, or `customers` blocks)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

**Sidebar already has "Products" entry** — do NOT modify `Sidebar.tsx`.

---

## Types

- [x] ✅ `types/products.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `interface ProductRef` — nested reference object returned by the API for supplier and warehouse fields:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
  - [x] ✅ `interface Product` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string` — max 200
    - [x] ✅ `description: string | null`
    - [x] ✅ `sku: string` — unique, max 100
    - [x] ✅ `weight_kg: string` — decimal (API returns string, e.g. `"1.500"`)
    - [x] ✅ `width_cm: string` — decimal (API returns string, e.g. `"35.50"`)
    - [x] ✅ `height_cm: string` — decimal (API returns string, e.g. `"23.00"`)
    - [x] ✅ `depth_cm: string` — decimal (API returns string, e.g. `"18.50"`)
    - [x] ✅ `unit_price: string` — decimal (API returns string, e.g. `"1299.99"`)
    - [x] ✅ `stock_quantity: number` — integer
    - [x] ✅ `supplier: ProductRef` — nested object (read), ID sent on write
    - [x] ✅ `warehouse: ProductRef` — nested object (read), ID sent on write
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface ProductListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches `name`, `sku`, `description`
    - [x] ✅ `supplier?: number` — filter by supplier ID
    - [x] ✅ `warehouse?: number` — filter by warehouse ID
    - [x] ✅ `ordering?: 'name' | '-name' | 'unit_price' | '-unit_price' | 'stock_quantity' | '-stock_quantity' | 'created_at' | '-created_at'`
  - [x] ✅ `interface CreateProductBody`:
    - [x] ✅ `name: string`
    - [x] ✅ `description?: string | null`
    - [x] ✅ `sku: string`
    - [x] ✅ `weight_kg: string` — never `parseFloat`, send as-is from form
    - [x] ✅ `width_cm: string`
    - [x] ✅ `height_cm: string`
    - [x] ✅ `depth_cm: string`
    - [x] ✅ `unit_price: string`
    - [x] ✅ `stock_quantity: number`
    - [x] ✅ `supplier: number` — FK id
    - [x] ✅ `warehouse: number` — FK id
  - [x] ✅ `interface UpdateProductBody` — same shape as `CreateProductBody` but all fields optional (for PATCH)
  - [x] ✅ All five decimal fields (`weight_kg`, `width_cm`, `height_cm`, `depth_cm`, `unit_price`) typed as `string` — never `number`

---

## Service Layer

- [x] ✅ `services/products.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: ProductListParams): Promise<PaginatedResponse<Product>>`
  - [x] ✅ Maps params to query string: `page`, `search`, `supplier`, `warehouse`, `ordering`
  - [x] ✅ GET `/api/products/`
- [x] ✅ `getById(id: number): Promise<Product>`
  - [x] ✅ GET `/api/products/{id}/`
- [x] ✅ `create(body: CreateProductBody): Promise<Product>`
  - [x] ✅ POST `/api/products/` — expects 201
- [x] ✅ `update(id: number, body: UpdateProductBody): Promise<Product>`
  - [x] ✅ PATCH `/api/products/{id}/` — partial update, expects 200
- [x] ✅ `remove(id: number): Promise<void>`
  - [x] ✅ DELETE `/api/products/{id}/` — expects 204, returns void

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — APPEND new `products` block (do not modify existing `warehouses`, `suppliers`, or `customers` blocks):
  - [x] ✅ `all: ['products'] as const`
  - [x] ✅ `list: (filters: ProductListParams) => ['products', 'list', filters] as const`
  - [x] ✅ `detail: (id: number) => ['products', 'detail', id] as const`
- [x] ✅ Import `ProductListParams` from `@/types/products` at the top of `query-keys.ts`

---

## Hooks

- [x] ✅ `hooks/products/use-products.ts` — single file exporting all hooks for this module
  - [x] ✅ `useProductList(params: ProductListParams)` — `useQuery`
    - [x] ✅ Uses `queryKeys.products.list(params)` as query key
    - [x] ✅ Calls `getList(params)` from `@/services/products`
    - [x] ✅ Returns `PaginatedResponse<Product>` (count, next, previous, results)
  - [x] ✅ `useProduct(id: number)` — `useQuery` for single item
    - [x] ✅ Uses `queryKeys.products.detail(id)` as query key
    - [x] ✅ Calls `getById(id)`
    - [x] ✅ `enabled: !!id` — do not query when `id` is falsy
  - [x] ✅ `useCreateProduct()` — `useMutation`
    - [x] ✅ Calls `create(body)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.products.all })` + `toast.success('Product created')`
    - [x] ✅ `onError`: `toast.error` with API `message` or fallback `'Failed to create product'`
  - [x] ✅ `useUpdateProduct()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; body: UpdateProductBody }`
    - [x] ✅ Calls `update(id, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.products.all` + `queryKeys.products.detail(id)` + `toast.success('Product updated')`
    - [x] ✅ `onError`: `toast.error` with API `message` or fallback `'Failed to update product'`
  - [x] ✅ `useDeleteProduct()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `remove(id)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.products.all })` + `toast.success('Product deleted')`
    - [x] ✅ `onError`: `toast.error` with API `message` or fallback `'Failed to delete product'`
  - [x] ✅ All hooks import `toast` from `sonner`
  - [x] ✅ All hooks import `queryKeys` from `@/lib/query-keys`

---

## Pages

### `app/(dashboard)/products/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads from `useSearchParams`:
  - [x] ✅ `?page` → `Number(param)` (default `1` when absent)
  - [x] ✅ `?search` → defaults to `''`
  - [x] ✅ `?supplier` → `Number(param)` or `undefined` when absent
  - [x] ✅ `?warehouse` → `Number(param)` or `undefined` when absent
  - [x] ✅ `?ordering` → one of the `ProductListParams` ordering values or `undefined`
- [x] ✅ Builds `ProductListParams` from URL params and passes to `useProductList`
- [x] ✅ Updates URL params via `router.push` with merged `URLSearchParams` (does NOT use `router.replace`)
- [x] ✅ Renders `PageHeader` with title `"Products"` and `"New Product"` button linking to `/products/new`
- [x] ✅ Renders `ProductsTable` with data, loading state, params, and `onParamsChange` callback
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading` (delegated to `DataTable` inside `ProductsTable`)
- [x] ✅ Empty state: `"No products found"` message when `results` is empty and not loading
- [x] ✅ Error state: error message when query fails

### `app/(dashboard)/products/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ Renders `PageHeader` with title `"New Product"` and back button → `/products`
- [x] ✅ Renders `ProductForm` in `mode="create"`
- [x] ✅ `onSuccess` callback: `router.push('/products')`

### `app/(dashboard)/products/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useProduct(Number(id))` for data
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading`
- [x] ✅ Not-found / error state: renders `"Product not found"` with a back button if query fails or data is undefined
- [x] ✅ Displays all fields in a readable layout:
  - [x] ✅ `name` — displayed prominently as page sub-title or heading
  - [x] ✅ `sku` — labeled "SKU", displayed in monospace or badge style
  - [x] ✅ `description` — labeled "Description"; show `"—"` (em dash) when `null`
  - [x] ✅ `unit_price` — labeled "Unit Price"; display the string value as-is (do NOT `parseFloat`)
  - [x] ✅ `stock_quantity` — labeled "Stock"
  - [x] ✅ `weight_kg` — labeled "Weight (kg)"
  - [x] ✅ `width_cm` — labeled "Width (cm)"
  - [x] ✅ `height_cm` — labeled "Height (cm)"
  - [x] ✅ `depth_cm` — labeled "Depth (cm)"
  - [x] ✅ `supplier.name` — labeled "Supplier", linkable to `/suppliers/[id]` using `supplier.id`
  - [x] ✅ `warehouse.name` — labeled "Warehouse", linkable to `/warehouses/[id]` using `warehouse.id`
  - [x] ✅ `created_at` — formatted as readable date/time string
  - [x] ✅ `updated_at` — formatted as readable date/time string
- [x] ✅ Edit button → `/products/[id]/edit`
- [x] ✅ Delete button → opens `ConfirmDialog` → on confirm calls `useDeleteProduct().mutate(id)` → on success `router.push('/products')`
- [x] ✅ `ConfirmDialog` message warns: `"This action cannot be undone."`

### `app/(dashboard)/products/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useProduct(Number(id))` to fetch current data
- [x] ✅ Shows `LoadingSpinner` until data is loaded
- [x] ✅ Renders `PageHeader` with title `"Edit Product"` and back button → `/products/[id]`
- [x] ✅ Renders `ProductForm` in `mode="edit"` with `defaultValues` pre-populated from fetched data
- [x] ✅ `onSuccess` callback: `router.push('/products/' + id)`

---

## Components

### `components/products/ProductsTable.tsx`

- [x] ✅ Props:
  - [x] ✅ `data: PaginatedResponse<Product> | undefined`
  - [x] ✅ `isLoading: boolean`
  - [x] ✅ `params: ProductListParams`
  - [x] ✅ `onParamsChange: (p: Partial<ProductListParams>) => void`
- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Product>[]`:
  - [x] ✅ `name` — clickable link to `/products/[id]`
  - [x] ✅ `sku` — displayed as-is; monospace or badge style preferred
  - [x] ✅ `unit_price` — labeled "Unit Price"; displayed as string (no `parseFloat`)
  - [x] ✅ `stock_quantity` — labeled "Stock"
  - [x] ✅ `supplier` — renders `supplier.name`; links to `/suppliers/[id]`
  - [x] ✅ `warehouse` — renders `warehouse.name`; links to `/warehouses/[id]`
  - [x] ✅ `created_at` — formatted date string
  - [x] ✅ Actions column: View (`/products/[id]`), Edit (`/products/[id]/edit`), Delete (inline `ConfirmDialog`)
- [x] ✅ Search input:
  - [x] ✅ Controlled by `params.search`
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ search: value, page: 1 })`
  - [x] ✅ Placeholder: `"Search by name, SKU, description…"`
- [x] ✅ `supplier` filter:
  - [x] ✅ Shadcn `Select` populated with all suppliers from `useSupplierList({ page: 1 })` (or a flat fetch without pagination)
  - [x] ✅ Options: `"All Suppliers"` (clears filter) + one option per supplier (`supplier.id` as value, `supplier.name` as label)
  - [x] ✅ Calls `onParamsChange({ supplier: value || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.supplier`
- [x] ✅ `warehouse` filter:
  - [x] ✅ Shadcn `Select` populated with all warehouses from `useWarehouseList({ page: 1 })`
  - [x] ✅ Options: `"All Warehouses"` (clears filter) + one option per warehouse (`warehouse.id` as value, `warehouse.name` as label)
  - [x] ✅ Calls `onParamsChange({ warehouse: value || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.warehouse`
- [x] ✅ Ordering:
  - [x] ✅ Column headers for `name`, `unit_price`, `stock_quantity`, and `created_at` are sortable
  - [x] ✅ Clicking toggles ascending/descending (e.g. `name` / `-name`)
  - [x] ✅ Active sort direction shown with icon (▲/▼) in column header
- [x] ✅ Pagination controls:
  - [x] ✅ Shows current page and total count
  - [x] ✅ Previous / Next buttons
  - [x] ✅ Calls `onParamsChange({ page: newPage })`
  - [x] ✅ Previous disabled on page 1; Next disabled when `next` is `null`
- [x] ✅ Delete per-row: `ConfirmDialog` opens with product name, calls `useDeleteProduct` on confirm
- [x] ✅ Loading state: render `LoadingSpinner` or skeleton rows when `isLoading`
- [x] ✅ Empty state: `"No products found"` when `data?.results` is empty and not loading

### `components/products/ProductForm.tsx`

- [x] ✅ Props:
  - [x] ✅ `mode: 'create' | 'edit'`
  - [x] ✅ `defaultValues?: Product`
  - [x] ✅ `onSuccess: () => void`
- [x] ✅ Zod schema (`productSchema`):
  - [x] ✅ `name`: `z.string().min(1, 'Name is required').max(200)`
  - [x] ✅ `description`: `z.string().max(2000).optional().nullable()` — empty string sent as `null`
  - [x] ✅ `sku`: `z.string().min(1, 'SKU is required').max(100)`
  - [x] ✅ `weight_kg`: `z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number')`
  - [x] ✅ `width_cm`: `z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number')`
  - [x] ✅ `height_cm`: `z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number')`
  - [x] ✅ `depth_cm`: `z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number')`
  - [x] ✅ `unit_price`: `z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number')`
  - [x] ✅ `stock_quantity`: `z.number({ invalid_type_error: 'Must be a number' }).int().min(0, 'Stock cannot be negative')`
  - [x] ✅ `supplier`: `z.number({ required_error: 'Supplier is required' }).int().positive()`
  - [x] ✅ `warehouse`: `z.number({ required_error: 'Warehouse is required' }).int().positive()`
- [x] ✅ Uses `react-hook-form` with `zodResolver`
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Supplier select: loaded inside the form component via `useSupplierList({ page: 1 })` — shows loading state while fetching; options are all suppliers from `results`
- [x] ✅ Warehouse select: loaded inside the form component via `useWarehouseList({ page: 1 })` — shows loading state while fetching; options are all warehouses from `results`; only show warehouses where `is_active: true`
- [x] ✅ Fields layout:
  - [x] ✅ `name`: `Input` type="text", placeholder="e.g. Laptop Pro"
  - [x] ✅ `sku`: `Input` type="text", placeholder="e.g. LP-2026-001"
  - [x] ✅ `description`: `Textarea` (shadcn), placeholder="Optional product description", rows=3
  - [x] ✅ `unit_price`: `Input` type="text" (NOT number), placeholder="e.g. 1299.99"
  - [x] ✅ `stock_quantity`: `Input` type="number" with `min="0"` and `step="1"`; registered with `valueAsNumber: true`
  - [x] ✅ `weight_kg`: `Input` type="text", placeholder="e.g. 1.500"
  - [x] ✅ `width_cm`: `Input` type="text", placeholder="e.g. 35.50"
  - [x] ✅ `height_cm`: `Input` type="text", placeholder="e.g. 23.00"
  - [x] ✅ `depth_cm`: `Input` type="text", placeholder="e.g. 18.50"
  - [x] ✅ `supplier`: shadcn `Select` using `FormField`; option value is `supplier.id.toString()`, label is `supplier.name`; `onChange` converts value back to `Number` before storing in form state
  - [x] ✅ `warehouse`: shadcn `Select` using `FormField`; option value is `warehouse.id.toString()`, label is `warehouse.name`; `onChange` converts value back to `Number` before storing in form state
- [x] ✅ In edit mode: `defaultValues` pre-populates all fields; decimal strings render as-is (e.g. `"1.500"`); `supplier` and `warehouse` selects must pre-select the correct option using `defaultValues.supplier.id` and `defaultValues.warehouse.id`
- [x] ✅ In edit mode: `description` renders as `''` (empty string) when `null` so the Textarea is not uncontrolled
- [x] ✅ On submit:
  - [x] ✅ Transforms empty `description` string to `null` before sending to API
  - [x] ✅ `mode === 'create'` → calls `useCreateProduct().mutate(body)`
  - [x] ✅ `mode === 'edit'` → calls `useUpdateProduct().mutate({ id, body })`
  - [x] ✅ On mutation success: calls `onSuccess()`
- [x] ✅ API `details` field errors mapped to individual form fields via `form.setError`:
  - [x] ✅ Iterates `error.response?.data?.error?.details` and calls `form.setError(field, { message })` for each key
  - [x] ✅ `details.sku` → `form.setError('sku', { message: details.sku[0] })` — handles duplicate SKU
  - [x] ✅ `details.supplier` → `form.setError('supplier', { message })` — handles invalid supplier FK
  - [x] ✅ `details.warehouse` → `form.setError('warehouse', { message })` — handles invalid warehouse FK
  - [x] ✅ Non-field / generic errors handled by `toast.error` in the hook's `onError`
- [x] ✅ Submit button:
  - [x] ✅ Label: `"Create Product"` in create mode, `"Save Changes"` in edit mode
  - [x] ✅ `disabled={isPending}`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`

---

## Sidebar Navigation

- [x] ✅ `components/layout/Sidebar.tsx` — verify "Products" nav item already exists:
  - [x] ✅ Entry with `href: '/products'` is already present in the `navItems` array — **no changes needed**
  - [x] ✅ If entry is missing for any reason, add it with an appropriate icon from `lucide-react` (e.g. `Package`)

---

## Error & Edge Cases

- [x] ✅ **Duplicate SKU**: POST/PATCH returns 400 with `details.sku` — must be surfaced via `form.setError('sku', { message })`, not just `toast.error`; the user must see the error next to the SKU field
- [x] ✅ **Decimal fields are strings end-to-end**: the form captures them as strings, Zod validates via regex, and they are sent to the API as strings — never call `parseFloat`, `Number()`, or `+` on `weight_kg`, `width_cm`, `height_cm`, `depth_cm`, or `unit_price`
- [x] ✅ **stock_quantity is an integer**: use `type="number"` input with `step="1"` and register with `valueAsNumber: true` so react-hook-form stores it as `number`, not string; Zod validates with `z.number().int().min(0)`
- [x] ✅ **Supplier select loading**: while `useSupplierList` is loading, the supplier `Select` must be disabled or show a placeholder "Loading suppliers…"; form cannot be submitted without a supplier
- [x] ✅ **Warehouse select loading**: same requirement for the warehouse `Select` — disabled with placeholder "Loading warehouses…" until data is available
- [x] ✅ **Warehouse filter in form**: only show active warehouses (`is_active: true`) in the `ProductForm` warehouse select; inactive warehouses should not appear as options
- [x] ✅ **supplier / warehouse filter values are numbers in params but strings in URL**: `useSearchParams` returns strings — always `Number(param)` before building `ProductListParams`; send `undefined` (not `NaN`) when the param is absent or not parseable
- [x] ✅ **Supplier and warehouse filter in table**: the filter Selects in `ProductsTable` must load option lists independently (they do not depend on the current product list); use `useSupplierList` and `useWarehouseList` directly in the table component
- [x] ✅ **"All" clears the FK filter**: selecting "All Suppliers" or "All Warehouses" in the table filter sends `supplier: undefined` / `warehouse: undefined` to the API (not `0` or empty string)
- [x] ✅ **Edit form pre-population for selects**: `defaultValues.supplier.id` and `defaultValues.warehouse.id` must pre-select the correct `Select` option; the select value is stored as a number in form state but the shadcn Select uses string values — convert with `.toString()` for display and `Number()` on change
- [x] ✅ **description is optional**: form allows an empty `description`; empty string must be converted to `null` before sending to API; must not be sent as `""`
- [x] ✅ **description renders as `""` in edit mode when null**: `defaultValues` must map `description: null` → `description: ''` so the Textarea is not uncontrolled
- [x] ✅ **DELETE on product referenced by Shipments**: API may return 400/409 if the product has linked ShipmentProducts — `toast.error` must display the API's `message`, not a generic string
- [x] ✅ **404 on detail/edit page**: if `useProduct` returns a 404 error, render `"Product not found"` with a back button instead of crashing
- [x] ✅ **Network error**: all mutations handle network errors in `onError` — no unhandled promise rejections
- [x] ✅ **Pagination reset on filter change**: when `search`, `supplier`, or `warehouse` filter changes, reset `page` to 1
- [x] ✅ **Ordering state reflected in column headers**: active sort direction shown with icon (▲/▼); toggling the same column reverses direction; clicking a different column resets to ascending
- [x] ✅ **Double-submit prevention**: Submit button is `disabled` while `isPending` — no duplicate POST/PATCH requests sent
- [x] ✅ **Form reset in create mode**: after successful creation the form is NOT shown again (page navigates away via `onSuccess`) — no manual `form.reset()` needed
- [x] ✅ **`useSearchParams` on list page**: use `router.push` with merged `URLSearchParams` to update filters without full page reload; do NOT use `router.replace`
- [x] ✅ **Auth**: all API calls go through `@/services/api` Axios instance which automatically attaches `Authorization: Bearer <token>` — do not manually add headers in the service file
- [x] ✅ **`id` param coercion**: `useParams` returns strings — always call `Number(id)` before passing to hooks/services that expect `number`
- [x] ✅ **`enabled` flag on detail query**: `useProduct` must set `enabled: !!id` to prevent querying with `id = 0` or `NaN`
- [x] ✅ **Decimal input type="text" not type="number"**: all five decimal fields use `type="text"` so the browser does not strip trailing zeros (e.g. `"1.500"` would become `"1.5"` with `type="number"`)
- [x] ✅ **query-keys.ts import**: the `products` block must import `ProductListParams` at the top of the file alongside the existing `WarehouseListParams`, `SupplierListParams`, and `CustomerListParams` imports — one import statement per type, never merge into existing import lines
