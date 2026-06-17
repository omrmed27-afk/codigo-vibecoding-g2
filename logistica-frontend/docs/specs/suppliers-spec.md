# Spec: Suppliers Module

**Status:** done
**Generated:** 2026-05-27
**Dependencies:** auth (done)

---

## Infrastructure Already in Place (Do NOT Recreate)

The following are pre-built and shared across all modules — do not touch:

- `services/api.ts` — Axios singleton with JWT Bearer interceptor and 401 refresh queue
- `stores/auth.store.ts` — Zustand auth state
- `types/api.ts` — `PaginatedResponse<T>`, `ApiError`
- `components/shared/DataTable.tsx` — TanStack Table wrapper
- `components/shared/PageHeader.tsx` — title + action button
- `components/shared/ConfirmDialog.tsx` — delete confirmation modal
- `components/shared/StatusBadge.tsx` — colored badge
- `components/shared/LoadingSpinner.tsx` — spinner
- `components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new `suppliers` block, never remove existing)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

**Sidebar already has "Suppliers" entry** (`Building` icon, `/suppliers` href) — do NOT modify `Sidebar.tsx`.

---

## Types

- [x] ✅ `types/suppliers.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `interface Supplier` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string` — max 200
    - [x] ✅ `contact_name: string` — max 200
    - [x] ✅ `email: string` — unique
    - [x] ✅ `phone: string` — max 30
    - [x] ✅ `address: string` — max 500
    - [x] ✅ `city: string` — max 100
    - [x] ✅ `country: string` — max 100
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface SupplierListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches `name`, `contact_name`, `email`
    - [x] ✅ `city?: string`
    - [x] ✅ `country?: string`
    - [x] ✅ `ordering?: 'name' | '-name' | 'created_at' | '-created_at'`
  - [x] ✅ `interface CreateSupplierBody`:
    - [x] ✅ `name: string`
    - [x] ✅ `contact_name: string`
    - [x] ✅ `email: string`
    - [x] ✅ `phone: string`
    - [x] ✅ `address: string`
    - [x] ✅ `city: string`
    - [x] ✅ `country: string`
  - [x] ✅ `interface UpdateSupplierBody` — same shape as `CreateSupplierBody` but all fields optional (for PATCH)
  - [x] ✅ No decimal fields in this module — no string-typed numeric fields required

---

## Service Layer

- [x] ✅ `services/suppliers.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: SupplierListParams): Promise<PaginatedResponse<Supplier>>`
  - [x] ✅ Maps params to query string: `page`, `search`, `city`, `country`, `ordering`
  - [x] ✅ GET `/api/suppliers/`
- [x] ✅ `getById(id: number): Promise<Supplier>`
  - [x] ✅ GET `/api/suppliers/{id}/`
- [x] ✅ `create(body: CreateSupplierBody): Promise<Supplier>`
  - [x] ✅ POST `/api/suppliers/` — expects 201
- [x] ✅ `update(id: number, body: UpdateSupplierBody): Promise<Supplier>`
  - [x] ✅ PATCH `/api/suppliers/{id}/` — partial update, expects 200
- [x] ✅ `remove(id: number): Promise<void>`
  - [x] ✅ DELETE `/api/suppliers/{id}/` — expects 204, returns void

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — APPEND new `suppliers` block (do not modify the existing `warehouses` block):
  - [x] ✅ `all: ['suppliers']`
  - [x] ✅ `list: (filters: SupplierListParams) => ['suppliers', 'list', filters]`
  - [x] ✅ `detail: (id: number) => ['suppliers', 'detail', id]`
- [x] ✅ Import `SupplierListParams` from `@/types/suppliers` at the top of `query-keys.ts`

---

## Hooks

- [x] ✅ `hooks/suppliers/use-suppliers.ts` — single file exporting all hooks for this module
  - [x] ✅ `useSupplierList(params: SupplierListParams)` — `useQuery`
    - [x] ✅ Uses `queryKeys.suppliers.list(params)` as query key
    - [x] ✅ Calls `getList(params)` from `@/services/suppliers`
    - [x] ✅ Returns `PaginatedResponse<Supplier>` (count, next, previous, results)
  - [x] ✅ `useSupplier(id: number)` — `useQuery` for single item
    - [x] ✅ Uses `queryKeys.suppliers.detail(id)` as query key
    - [x] ✅ Calls `getById(id)`
    - [x] ✅ Enabled only when `id` is truthy (`enabled: !!id`)
  - [x] ✅ `useCreateSupplier()` — `useMutation`
    - [x] ✅ Calls `create(body)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.suppliers.all })` + `toast.success('Supplier created')`
    - [x] ✅ `onError`: `toast.error` with fallback `'Failed to create supplier'`
  - [x] ✅ `useUpdateSupplier()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; body: UpdateSupplierBody }`
    - [x] ✅ Calls `update(id, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.suppliers.all` + `queryKeys.suppliers.detail(id)` + `toast.success('Supplier updated')`
    - [x] ✅ `onError`: `toast.error` with fallback `'Failed to update supplier'`
  - [x] ✅ `useDeleteSupplier()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `remove(id)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.suppliers.all })` + `toast.success('Supplier deleted')`
    - [x] ✅ `onError`: `toast.error` with fallback `'Failed to delete supplier'`
  - [x] ✅ All hooks import `toast` from `sonner`
  - [x] ✅ All hooks import `queryKeys` from `@/lib/query-keys`

---

## Pages

### `app/(dashboard)/suppliers/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads from `useSearchParams`:
  - [x] ✅ `?page` → `Number(param)` (default `1` when absent)
  - [x] ✅ `?search` → defaults to `''`
  - [x] ✅ `?city` → defaults to `''`
  - [x] ✅ `?country` → defaults to `''`
  - [x] ✅ `?ordering` → `'name' | '-name' | 'created_at' | '-created_at'` (default undefined)
- [x] ✅ Builds `SupplierListParams` from URL params and passes to `useSupplierList`
- [x] ✅ Updates URL params via `router.push` with merged `URLSearchParams` (does NOT use `router.replace`)
- [x] ✅ Renders `PageHeader` with title `"Suppliers"` and `"New Supplier"` button linking to `/suppliers/new`
- [x] ✅ Renders `SuppliersTable` with data, loading state, params, and `onParamsChange` callback
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading` (delegated to `DataTable` inside `SuppliersTable`)
- [x] ✅ Empty state: `"No suppliers found"` message when `results` is empty and not loading (delegated to `DataTable`)
- [x] ✅ Error state: error message when query fails

### `app/(dashboard)/suppliers/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ Renders `PageHeader` with title `"New Supplier"` and back button → `/suppliers`
- [x] ✅ Renders `SupplierForm` in `mode="create"`
- [x] ✅ `onSuccess` callback: `router.push('/suppliers')`

### `app/(dashboard)/suppliers/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useSupplier(Number(id))` for data
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading`
- [x] ✅ Not-found / error state: renders `"Supplier not found"` with a back button if query fails or data is undefined
- [x] ✅ Displays all fields in a readable layout:
  - [x] ✅ `name` — displayed prominently as page sub-title or heading
  - [x] ✅ `contact_name` — labeled "Contact Name"
  - [x] ✅ `email` — labeled "Email"
  - [x] ✅ `phone` — labeled "Phone"
  - [x] ✅ `address` — labeled "Address"
  - [x] ✅ `city` — labeled "City"
  - [x] ✅ `country` — labeled "Country"
  - [x] ✅ `created_at` — formatted as readable date/time string
  - [x] ✅ `updated_at` — formatted as readable date/time string
- [x] ✅ Edit button → `/suppliers/[id]/edit`
- [x] ✅ Delete button → opens `ConfirmDialog` → on confirm calls `useDeleteSupplier().mutate(id)` → on success `router.push('/suppliers')`
- [x] ✅ `ConfirmDialog` message warns: `"This action cannot be undone."`

### `app/(dashboard)/suppliers/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useSupplier(Number(id))` to fetch current data
- [x] ✅ Shows `LoadingSpinner` until data is loaded
- [x] ✅ Renders `PageHeader` with title `"Edit Supplier"` and back button → `/suppliers/[id]`
- [x] ✅ Renders `SupplierForm` in `mode="edit"` with `defaultValues` pre-populated from fetched data
- [x] ✅ `onSuccess` callback: `router.push('/suppliers/' + id)`

---

## Components

### `components/suppliers/SuppliersTable.tsx`

- [x] ✅ Props:
  - [x] ✅ `data: PaginatedResponse<Supplier> | undefined`
  - [x] ✅ `isLoading: boolean`
  - [x] ✅ `params: SupplierListParams`
  - [x] ✅ `onParamsChange: (p: Partial<SupplierListParams>) => void` — updates URL params in the parent page
- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Supplier>[]`:
  - [x] ✅ `name` — clickable link to `/suppliers/[id]`
  - [x] ✅ `contact_name` — labeled "Contact"
  - [x] ✅ `email`
  - [x] ✅ `phone`
  - [x] ✅ `city`
  - [x] ✅ `country`
  - [x] ✅ Actions column: View (`/suppliers/[id]`), Edit (`/suppliers/[id]/edit`), Delete (inline `ConfirmDialog`)
- [x] ✅ Search input:
  - [x] ✅ Controlled by `params.search`
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ search: value, page: 1 })`
  - [x] ✅ Placeholder: `"Search by name, contact, email…"`
- [x] ✅ `city` filter:
  - [x] ✅ Text input (not a select — city values are free-form)
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ city: value, page: 1 })`
- [x] ✅ `country` filter:
  - [x] ✅ Text input (not a select — country values are free-form)
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ country: value, page: 1 })`
- [x] ✅ Ordering:
  - [x] ✅ Column headers for `name` and `created_at` are sortable
  - [x] ✅ Clicking toggles `?ordering=name` / `?ordering=-name` (same for `created_at`)
  - [x] ✅ Active sort direction shown with icon (▲/▼) in the column header
- [x] ✅ Pagination controls:
  - [x] ✅ Shows current page and total count
  - [x] ✅ Previous / Next buttons
  - [x] ✅ Calls `onParamsChange({ page: newPage })`
  - [x] ✅ Previous disabled on page 1; Next disabled when `next` is `null`
- [x] ✅ Delete per-row: `ConfirmDialog` opens with supplier name, calls `useDeleteSupplier` on confirm
- [x] ✅ Loading state: render `LoadingSpinner` or skeleton rows when `isLoading`
- [x] ✅ Empty state: `"No suppliers found"` when `data?.results` is empty and not loading

### `components/suppliers/SupplierForm.tsx`

- [x] ✅ Props:
  - [x] ✅ `mode: 'create' | 'edit'`
  - [x] ✅ `defaultValues?: Supplier`
  - [x] ✅ `onSuccess: () => void`
- [x] ✅ Zod schema (`supplierSchema`):
  - [x] ✅ `name`: `z.string().min(1, 'Name is required').max(200)`
  - [x] ✅ `contact_name`: `z.string().min(1, 'Contact name is required').max(200)`
  - [x] ✅ `email`: `z.string().min(1, 'Email is required').email('Must be a valid email')`
  - [x] ✅ `phone`: `z.string().min(1, 'Phone is required').max(30)`
  - [x] ✅ `address`: `z.string().min(1, 'Address is required').max(500)`
  - [x] ✅ `city`: `z.string().min(1, 'City is required').max(100)`
  - [x] ✅ `country`: `z.string().min(1, 'Country is required').max(100)`
- [x] ✅ Uses `react-hook-form` with `zodResolver`
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Fields:
  - [x] ✅ `name`: `Input` type="text", placeholder="e.g. Tech Supplier Inc"
  - [x] ✅ `contact_name`: `Input` type="text", placeholder="e.g. John Doe"
  - [x] ✅ `email`: `Input` type="email", placeholder="e.g. john@techsupply.com"
  - [x] ✅ `phone`: `Input` type="tel", placeholder="e.g. +1987654321"
  - [x] ✅ `address`: `Input` type="text", placeholder="e.g. 456 Industrial Ave"
  - [x] ✅ `city`: `Input` type="text", placeholder="e.g. Los Angeles"
  - [x] ✅ `country`: `Input` type="text", placeholder="e.g. USA"
- [x] ✅ In edit mode: `defaultValues` pre-populates all fields from the fetched `Supplier` object
- [x] ✅ On submit:
  - [x] ✅ `mode === 'create'` → calls `useCreateSupplier().mutate(body)`
  - [x] ✅ `mode === 'edit'` → calls `useUpdateSupplier().mutate({ id, body })`
  - [x] ✅ On mutation success: calls `onSuccess()`
- [x] ✅ API `details` field errors mapped to individual form fields via `form.setError`:
  - [x] ✅ Iterates `error.response?.data?.error?.details` and calls `form.setError(field, { message })` for each key
  - [x] ✅ Non-field / generic errors handled by `toast.error` in the hook's `onError`
- [x] ✅ Submit button:
  - [x] ✅ Label: `"Create Supplier"` in create mode, `"Save Changes"` in edit mode
  - [x] ✅ `disabled={isPending}`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`

---

## Sidebar Navigation

- [x] ✅ `components/layout/Sidebar.tsx` — verify "Suppliers" nav item already exists:
  - [x] ✅ Entry `{ label: 'Suppliers', href: '/suppliers', icon: Building }` is already present in the `navItems` array — **no changes needed**
  - [x] ✅ If entry is missing for any reason, add it with `Building` icon from `lucide-react`, positioned between Customers and Warehouses

---

## Error & Edge Cases

- [x] ✅ **Duplicate email**: POST/PATCH returns 400 with `details.email` — must be surfaced via `form.setError('email', { message })`, not just `toast.error`
- [x] ✅ **All fields required**: SupplierForm Zod schema must reject submission if any field is blank; no optional fields exist in this module
- [x] ✅ **Email format validation**: Zod `z.string().email()` runs client-side before API is called — prevents unnecessary network requests
- [x] ✅ **Phone field is text, not numeric**: `Input type="tel"` — accept any phone format; no Zod numeric validation
- [x] ✅ **DELETE on supplier referenced by Products**: API may return 400/409 if the supplier has linked Products — `toast.error` must display the API's `message` field, not a generic string
- [x] ✅ **404 on detail/edit page**: if `useSupplier` returns a 404 error, render `"Supplier not found"` with a back button instead of crashing
- [x] ✅ **Network error**: all mutations handle network errors in `onError` — no unhandled promise rejections
- [x] ✅ **Pagination reset on filter change**: when `search`, `city`, or `country` filter changes, reset `page` to 1
- [x] ✅ **Ordering state reflected in column headers**: active sort direction shown with an icon (▲/▼); toggling the same column reverses direction; clicking a different column resets to ascending
- [x] ✅ **Double-submit prevention**: Submit button is `disabled` while `isPending` — no duplicate POST/PATCH requests sent
- [x] ✅ **Form reset in create mode**: after successful creation the form is NOT shown again (page navigates away via `onSuccess`) — no manual `form.reset()` needed
- [x] ✅ **Edit form pre-population**: all fields must match the API response exactly; no field should render as `"null"` or `"undefined"` string
- [x] ✅ **`useSearchParams` on list page**: use `router.push` with merged `URLSearchParams` to update filters without full page reload; do NOT use `router.replace` (would break browser back button)
- [x] ✅ **Auth**: all API calls go through `@/services/api` Axios instance which automatically attaches `Authorization: Bearer <token>` — do not manually add headers in the service file
- [x] ✅ **`city` / `country` filters are freeform text inputs**: do not use Select dropdowns since the API does not provide an enum or a distinct values endpoint for these fields
- [x] ✅ **Debounce on all text filter inputs**: search, city, and country filter inputs must be debounced (300 ms) to avoid firing a new API request on every keystroke
- [x] ✅ **`id` param coercion**: `useParams` returns strings — always call `Number(id)` before passing to hooks/services that expect `number`
- [x] ✅ **`enabled` flag on detail query**: `useSupplier` must set `enabled: !!id` to prevent querying with `id = 0` or `NaN`
