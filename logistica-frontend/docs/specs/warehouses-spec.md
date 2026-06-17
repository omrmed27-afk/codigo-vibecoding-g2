# Spec: Warehouses Module

**Status:** validated
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
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new block, never remove)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

---

## Types

- [x] ✅ `types/warehouses.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `interface Warehouse` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
    - [x] ✅ `address: string`
    - [x] ✅ `city: string`
    - [x] ✅ `country: string`
    - [x] ✅ `latitude: string | null` — decimal as string, nullable
    - [x] ✅ `longitude: string | null` — decimal as string, nullable
    - [x] ✅ `is_active: boolean`
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface WarehouseListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches name, address, city
    - [x] ✅ `is_active?: boolean`
    - [x] ✅ `city?: string`
    - [x] ✅ `country?: string`
    - [x] ✅ `ordering?: 'name' | '-name' | 'created_at' | '-created_at'`
  - [x] ✅ `interface CreateWarehouseBody`:
    - [x] ✅ `name: string`
    - [x] ✅ `address: string`
    - [x] ✅ `city: string`
    - [x] ✅ `country: string`
    - [x] ✅ `latitude?: string | null`
    - [x] ✅ `longitude?: string | null`
    - [x] ✅ `is_active: boolean`
  - [x] ✅ `interface UpdateWarehouseBody` — same shape as `CreateWarehouseBody` (all optional for PATCH)
  - [x] ✅ All decimal fields (`latitude`, `longitude`) typed as `string | null`, never `number`

---

## Service Layer

- [x] ✅ `services/warehouses.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: WarehouseListParams): Promise<PaginatedResponse<Warehouse>>`
  - [x] ✅ Maps params to query string: `page`, `search`, `is_active`, `city`, `country`, `ordering`
  - [x] ✅ GET `/api/warehouses/`
- [x] ✅ `getById(id: number): Promise<Warehouse>`
  - [x] ✅ GET `/api/warehouses/{id}/`
- [x] ✅ `create(body: CreateWarehouseBody): Promise<Warehouse>`
  - [x] ✅ POST `/api/warehouses/` — expects 201
- [x] ✅ `update(id: number, body: UpdateWarehouseBody): Promise<Warehouse>`
  - [x] ✅ PATCH `/api/warehouses/{id}/` — partial update, expects 200
- [x] ✅ `remove(id: number): Promise<void>`
  - [x] ✅ DELETE `/api/warehouses/{id}/` — expects 204, returns void
- [x] ✅ `toggleActive(id: number, is_active: boolean): Promise<Warehouse>`
  - [x] ✅ PATCH `/api/warehouses/{id}/` with `{ is_active }` — used by the Switch toggle
  - [x] ✅ Can reuse `update()` internally or be a thin wrapper

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — APPEND new `warehouses` block (do not modify existing keys):
  - [x] ✅ `all: ['warehouses']`
  - [x] ✅ `list: (filters: WarehouseListParams) => ['warehouses', 'list', filters]`
  - [x] ✅ `detail: (id: number) => ['warehouses', 'detail', id]`

---

## Hooks

- [x] ✅ `hooks/warehouses/use-warehouses.ts` — single file exporting all hooks for this module
  - [x] ✅ `useWarehouseList(params: WarehouseListParams)` — `useQuery`
    - [x] ✅ Uses `queryKeys.warehouses.list(params)` as query key
    - [x] ✅ Calls `getList(params)`
    - [x] ✅ Returns `PaginatedResponse<Warehouse>` (count, next, previous, results)
  - [x] ✅ `useWarehouse(id: number)` — `useQuery` for single item
    - [x] ✅ Uses `queryKeys.warehouses.detail(id)` as query key
    - [x] ✅ Calls `getById(id)`
    - [x] ✅ Enabled only when `id` is valid (truthy)
  - [x] ✅ `useCreateWarehouse()` — `useMutation`
    - [x] ✅ Calls `create(body)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.warehouses.all })` + `toast.success('Warehouse created')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback message
  - [x] ✅ `useUpdateWarehouse()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; body: UpdateWarehouseBody }`
    - [x] ✅ Calls `update(id, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.warehouses.all` + `queryKeys.warehouses.detail(id)` + `toast.success('Warehouse updated')`
    - [x] ✅ `onError`: `toast.error` with API error message or fallback
  - [x] ✅ `useDeleteWarehouse()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `remove(id)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.warehouses.all })` + `toast.success('Warehouse deleted')`
    - [x] ✅ `onError`: `toast.error` with API error message or fallback
  - [x] ✅ `useToggleWarehouseActive()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; is_active: boolean }`
    - [x] ✅ Calls `toggleActive(id, is_active)` (PATCH)
    - [x] ✅ `onSuccess`: invalidates `queryKeys.warehouses.all` + `queryKeys.warehouses.detail(id)` + `toast.success` showing new status
    - [x] ✅ `onError`: `toast.error` with API error message

---

## Pages

### `app/(dashboard)/warehouses/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads from `useSearchParams`:
  - [x] ✅ `?page` → number (default 1)
  - [x] ✅ `?search` → string
  - [x] ✅ `?is_active` → boolean string `'true'` | `'false'` | undefined
  - [x] ✅ `?ordering` → `'name' | '-name' | 'created_at' | '-created_at'`
- [x] ✅ Builds `WarehouseListParams` from URL params and passes to `useWarehouseList`
- [x] ✅ Renders `PageHeader` with title "Warehouses" and "New Warehouse" button linking to `/warehouses/new`
- [x] ✅ Renders `WarehousesTable` with data, loading state, pagination
- [x] ✅ Loading state: `LoadingSpinner` or skeleton rows while `isLoading`
- [x] ✅ Empty state: "No warehouses found" message when `results` is empty
- [x] ✅ Error state: error message when query fails

### `app/(dashboard)/warehouses/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ Renders `PageHeader` with title "New Warehouse" and back button → `/warehouses`
- [x] ✅ Renders `WarehouseForm` in `mode="create"`
- [x] ✅ `onSuccess` callback: `router.push('/warehouses')`

### `app/(dashboard)/warehouses/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useWarehouse(Number(id))` for data
- [x] ✅ Loading state: `LoadingSpinner`
- [x] ✅ Not-found state: renders "Warehouse not found" if query returns 404 / data is undefined
- [x] ✅ Displays all fields in a readable layout:
  - [x] ✅ `name`, `address`, `city`, `country`
  - [x] ✅ `latitude`, `longitude` — show "—" if null
  - [x] ✅ `is_active` — shown as a `StatusBadge` (active/inactive)
  - [x] ✅ `created_at`, `updated_at` — formatted as readable date/time
- [x] ✅ Edit button → `/warehouses/[id]/edit`
- [x] ✅ Delete button → opens `ConfirmDialog` → `useDeleteWarehouse()` → on success `router.push('/warehouses')`
- [x] ✅ `ConfirmDialog` message warns: "This action cannot be undone."

### `app/(dashboard)/warehouses/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useWarehouse(Number(id))` to fetch current data
- [x] ✅ Shows `LoadingSpinner` until data is loaded
- [x] ✅ Renders `PageHeader` with title "Edit Warehouse" and back button → `/warehouses/[id]`
- [x] ✅ Renders `WarehouseForm` in `mode="edit"` with `defaultValues` pre-populated from fetched data
- [x] ✅ `onSuccess` callback: `router.push('/warehouses/' + id)`

---

## Components

### `components/warehouses/WarehousesTable.tsx`

- [x] ✅ Props:
  - [x] ✅ `data: PaginatedResponse<Warehouse> | undefined`
  - [x] ✅ `isLoading: boolean`
  - [x] ✅ `params: WarehouseListParams`
  - [x] ✅ `onParamsChange: (p: Partial<WarehouseListParams>) => void` — updates URL params in the page
- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Warehouse>[]`:
  - [x] ✅ `name` — clickable link to `/warehouses/[id]`
  - [x] ✅ `city`
  - [x] ✅ `country`
  - [x] ✅ `is_active` — rendered as `StatusBadge` (green "Active" / red "Inactive")
  - [x] ✅ `created_at` — formatted date string
  - [x] ✅ Actions column: View (`/warehouses/[id]`), Edit (`/warehouses/[id]/edit`), Delete (inline `ConfirmDialog`)
- [x] ✅ Search input:
  - [x] ✅ Controlled by `params.search`
  - [x] ✅ Debounced (300ms) before calling `onParamsChange({ search: value, page: 1 })`
- [x] ✅ `is_active` filter:
  - [x] ✅ Select dropdown: "All", "Active", "Inactive"
  - [x] ✅ Calls `onParamsChange({ is_active: value, page: 1 })`
- [x] ✅ Ordering:
  - [x] ✅ Column headers for `name` and `created_at` are sortable
  - [x] ✅ Clicking toggles `?ordering=name` / `?ordering=-name` (same for `created_at`)
- [x] ✅ Pagination controls:
  - [x] ✅ Shows current page and total count
  - [x] ✅ Previous / Next buttons
  - [x] ✅ Calls `onParamsChange({ page: newPage })`
  - [x] ✅ Previous disabled on page 1; Next disabled when `next` is null
- [x] ✅ Delete per-row: `ConfirmDialog` opens with warehouse name, calls `useDeleteWarehouse` on confirm
- [x] ✅ Loading state: render `LoadingSpinner` or skeleton rows when `isLoading`
- [x] ✅ Empty state: "No warehouses found" when `data?.results` is empty

### `components/warehouses/WarehouseForm.tsx`

- [x] ✅ Props:
  - [x] ✅ `mode: 'create' | 'edit'`
  - [x] ✅ `defaultValues?: Warehouse`
  - [x] ✅ `onSuccess: () => void`
- [x] ✅ Zod schema (`warehouseSchema`):
  - [x] ✅ `name`: `z.string().min(1, 'Name is required').max(200)`
  - [x] ✅ `address`: `z.string().min(1, 'Address is required').max(500)`
  - [x] ✅ `city`: `z.string().min(1, 'City is required').max(100)`
  - [x] ✅ `country`: `z.string().min(1, 'Country is required').max(100)`
  - [x] ✅ `latitude`: `z.string().regex(/^-?(\d+(\.\d+)?)$/).nullable().optional()`
  - [x] ✅ `longitude`: `z.string().regex(/^-?(\d+(\.\d+)?)$/).nullable().optional()`
  - [x] ✅ `.superRefine()` or `.refine()` cross-field validation: if `latitude` is provided and non-empty, `longitude` is required and vice versa — error message: "Both latitude and longitude are required together"
  - [x] ❌ `is_active`: `z.boolean().default(true)` — schema uses `z.boolean()` without `.default(true)` (components/warehouses/WarehouseForm.tsx:41); `is_active` default is applied in `useForm` defaultValues instead, which works but diverges from the spec
- [x] ✅ Uses `react-hook-form` with `zodResolver`
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Fields:
  - [x] ✅ `name`: `Input` type="text"
  - [x] ✅ `address`: `Input` type="text"
  - [x] ✅ `city`: `Input` type="text"
  - [x] ✅ `country`: `Input` type="text"
  - [x] ✅ `latitude`: `Input` type="text", placeholder="e.g. 41.881832", optional label note "(optional)"
  - [x] ✅ `longitude`: `Input` type="text", placeholder="e.g. -87.629799", optional label note "(optional)"
  - [x] ✅ `is_active`: shadcn `Switch` component with label "Active"
- [x] ✅ In edit mode: `defaultValues` pre-populates all fields; `null` lat/lng render as empty string in the input
- [x] ✅ On submit:
  - [x] ✅ `mode === 'create'` → calls `useCreateWarehouse().mutate(body)`, where empty lat/lng strings are converted to `null`
  - [x] ✅ `mode === 'edit'` → calls `useUpdateWarehouse().mutate({ id, body })`
  - [x] ✅ On mutation success: calls `onSuccess()`
- [x] ✅ API `details` field errors mapped to individual form fields via `form.setError`:
  - [x] ✅ Iterates `error.response?.data?.error?.details` and calls `form.setError(field, { message })` for each
  - [x] ✅ Non-field errors: `toast.error` (handled in hook `onError`)
- [x] ✅ Submit button:
  - [x] ✅ Label: "Create Warehouse" in create mode, "Save Changes" in edit mode
  - [x] ✅ `disabled={isPending}`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`

---

## Sidebar Navigation

- [x] ❌ `components/layout/Sidebar.tsx` — add "Warehouses" nav link:
  - [x] ❌ Icon: appropriate icon from lucide-react (e.g., `Warehouse` or `Building2`) — no icons are used in the Sidebar at all; nav items are text-only links (components/layout/Sidebar.tsx:7-16)
  - [x] ✅ href: `/warehouses`
  - [x] ✅ Label: "Warehouses"
  - [x] ✅ Positioned after "Shipments" or in logical order per the nav structure

---

## Error & Edge Cases

- [x] ✅ **lat/lng co-dependency**: if user enters latitude but not longitude (or vice versa), Zod `superRefine` fires and shows field-level error before API is called
- [x] ✅ **lat/lng range validation**: latitude must parse to a float between -90 and 90; longitude between -180 and 180 — Zod regex alone is not sufficient, add `.refine()` numeric range checks
- [x] ✅ **Empty lat/lng string → null**: before submitting, convert empty string `""` to `null` so the API receives `null` not `""`
- [x] ❌ **is_active toggle on list page**: `useToggleWarehouseActive` is invoked from the Switch in the table row — no Switch or `useToggleWarehouseActive` call exists in `WarehousesTable.tsx`; `is_active` is displayed via `StatusBadge` only (components/warehouses/WarehousesTable.tsx:114-123)
- [x] ✅ **Warehouse referenced by other modules**: DELETE may fail if warehouse is referenced by Products, Routes, or Shipments — API will return 400/409; `toast.error` must display the API's `message` field, not a generic string
- [x] ✅ **404 on detail/edit page**: if `useWarehouse` returns a 404 error, render "Warehouse not found" with a back button instead of crashing
- [x] ✅ **Network error**: all mutations handle network errors via `onError` toast — no unhandled promise rejections
- [x] ✅ **Pagination reset on filter change**: when `search`, `is_active`, `city`, or `country` filter changes, reset `page` to 1
- [x] ✅ **Ordering state reflected in column headers**: active sort direction shown with an icon (▲/▼) in the column header
- [x] ✅ **Double-submit prevention**: Submit button is `disabled` while `isPending` — no duplicate POST/PATCH requests
- [x] ✅ **Large decimal precision**: latitude/longitude may have up to 6+ decimal digits — Zod regex must allow arbitrary decimal precision, not restrict it
- [x] ✅ **Form reset in create mode**: after successful creation the form is NOT shown again (page navigates away via `onSuccess`) — no manual reset needed
- [x] ✅ **Edit form pre-population**: `null` latitude/longitude from API must be shown as empty `Input` (not "null" string) — convert `null` to `""` in `defaultValues`
- [x] ✅ **`is_active` default**: new warehouse form defaults `is_active` to `true` (Switch is ON by default)
- [x] ✅ **`useSearchParams` on list page**: use `router.push` with merged URLSearchParams to update filters without full page reload; do NOT use `router.replace` (would break browser back button)
- [x] ✅ **Auth**: all API calls go through `@/services/api` Axios instance which automatically attaches `Authorization: Bearer <token>` — do not manually add headers in the service file
