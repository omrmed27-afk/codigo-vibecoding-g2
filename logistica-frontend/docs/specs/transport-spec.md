# Spec: Transport Module

**Status:** pending approval
**Generated:** 2026-05-28
**Dependencies:** drivers (done)

---

## Infrastructure Already in Place (Do NOT Recreate)

The following are pre-built and shared across all modules — do not touch:

- `services/api.ts` — Axios singleton with JWT Bearer interceptor and 401 refresh queue
- `stores/auth.store.ts` — Zustand auth state
- `types/api.ts` — `PaginatedResponse<T>`, `ApiError`
- `types/drivers.ts` — `Driver`, `DriverStatus`, `DriverRef` already defined; import from here for `DriverRef`
- `components/shared/DataTable.tsx` — TanStack Table wrapper
- `components/shared/PageHeader.tsx` — title + action button
- `components/shared/ConfirmDialog.tsx` — delete confirmation modal
- `components/shared/StatusBadge.tsx` — colored badge
- `components/shared/LoadingSpinner.tsx` — spinner
- `components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new `transport` block, never remove existing blocks)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

**Sidebar already has a "Transport" entry** — do NOT modify `Sidebar.tsx`.

---

## Types

- [x] ✅ `types/transport.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `type VehicleType = 'truck' | 'van' | 'motorcycle' | 'bicycle'`
  - [x] ✅ `type TransportStatus = 'available' | 'in_transit' | 'maintenance'`
  - [x] ✅ `interface DriverRef` — inline reference returned inside a Transport object:
    - [x] ✅ `id: number`
    - [x] ✅ `license_number: string`
    - [x] ✅ `phone: string`
    - [x] ✅ `status: DriverStatus` — import `DriverStatus` from `@/types/drivers`
  - [x] ✅ `interface Transport` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string` — max 200
    - [x] ✅ `type: VehicleType`
    - [x] ✅ `plate_number: string` — unique, max 20
    - [x] ✅ `capacity_kg: string` — decimal, typed as string (never number)
    - [x] ✅ `capacity_m3: string` — decimal, typed as string (never number)
    - [x] ✅ `driver: DriverRef | null`
    - [x] ✅ `status: TransportStatus`
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface TransportListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches `name`, `plate_number`
    - [x] ✅ `status?: TransportStatus`
    - [x] ✅ `type?: VehicleType`
    - [x] ✅ `driver?: number` — filter by driver ID
    - [x] ✅ `ordering?: 'name' | '-name' | 'created_at' | '-created_at' | 'status' | '-status'`
  - [x] ✅ `interface CreateTransportBody`:
    - [x] ✅ `name: string` — required
    - [x] ✅ `type: VehicleType` — required
    - [x] ✅ `plate_number: string` — required, unique
    - [x] ✅ `capacity_kg: string` — required, decimal string
    - [x] ✅ `capacity_m3: string` — required, decimal string
    - [x] ✅ `driver?: number | null` — optional driver ID (not the full object)
    - [x] ✅ `status: TransportStatus` — required
  - [x] ✅ `interface UpdateTransportBody` — all fields optional for PATCH:
    - [x] ✅ `name?: string`
    - [x] ✅ `type?: VehicleType`
    - [x] ✅ `plate_number?: string`
    - [x] ✅ `capacity_kg?: string`
    - [x] ✅ `capacity_m3?: string`
    - [x] ✅ `driver?: number | null`
    - [x] ✅ `status?: TransportStatus`
  - [x] ✅ `interface AssignDriverBody`:
    - [x] ✅ `driver_id: number`

---

## Service Layer

- [x] ✅ `services/transport.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: TransportListParams): Promise<PaginatedResponse<Transport>>`
  - [x] ✅ Maps params to query string: `page`, `search`, `status`, `type`, `driver`, `ordering`
  - [x] ✅ GET `/api/transport/`
- [x] ✅ `getById(id: number): Promise<Transport>`
  - [x] ✅ GET `/api/transport/{id}/`
- [x] ✅ `create(body: CreateTransportBody): Promise<Transport>`
  - [x] ✅ POST `/api/transport/` — expects 201
- [x] ✅ `update(id: number, body: UpdateTransportBody): Promise<Transport>`
  - [x] ✅ PATCH `/api/transport/{id}/` — partial update, expects 200
- [x] ✅ `remove(id: number): Promise<void>`
  - [x] ✅ DELETE `/api/transport/{id}/` — expects 204, returns void
- [x] ✅ `assignDriver(id: number, body: AssignDriverBody): Promise<Transport>`
  - [x] ✅ POST `/api/transport/{id}/assign-driver/` — expects 200; body: `{ driver_id: number }`
- [x] ✅ `unassignDriver(id: number): Promise<Transport>`
  - [x] ✅ POST `/api/transport/{id}/unassign-driver/` — expects 200; body: `{}`

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — APPEND new `transport` block (do not modify existing `warehouses`, `suppliers`, `customers`, `products`, or `drivers` blocks):
  - [x] ✅ Add `import type { TransportListParams } from '@/types/transport'` at the top of the file
  - [x] ✅ `transport` block:
    - [x] ✅ `all: ['transport'] as const`
    - [x] ✅ `list: (filters: TransportListParams) => ['transport', 'list', filters] as const`
    - [x] ✅ `detail: (id: number) => ['transport', 'detail', id] as const`

---

## Hooks

- [x] ✅ `hooks/transport/use-transport.ts` — single file exporting all hooks for this module
  - [x] ✅ `useTransportList(params: TransportListParams)` — `useQuery`
    - [x] ✅ Uses `queryKeys.transport.list(params)` as query key
    - [x] ✅ Calls `getList(params)` from `@/services/transport`
    - [x] ✅ Returns `PaginatedResponse<Transport>` (count, next, previous, results)
  - [x] ✅ `useTransport(id: number)` — `useQuery` for single item
    - [x] ✅ Uses `queryKeys.transport.detail(id)` as query key
    - [x] ✅ Calls `getById(id)`
    - [x] ✅ `enabled: !!id` — prevents querying with `id = 0` or `NaN`
  - [x] ✅ `useCreateTransport()` — `useMutation`
    - [x] ✅ Calls `create(body)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.transport.all })` + `toast.success('Transport created')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to create transport'`
  - [x] ✅ `useUpdateTransport()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; body: UpdateTransportBody }`
    - [x] ✅ Calls `update(id, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.transport.all` + `queryKeys.transport.detail(id)` + `toast.success('Transport updated')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to update transport'`
  - [x] ✅ `useDeleteTransport()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `remove(id)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.transport.all })` + `toast.success('Transport deleted')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to delete transport'`
  - [x] ✅ `useAssignDriver()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; driver_id: number }`
    - [x] ✅ Calls `assignDriver(id, { driver_id })`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.transport.all` + `queryKeys.transport.detail(id)` + `toast.success('Driver assigned')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to assign driver'`
  - [x] ✅ `useUnassignDriver()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `unassignDriver(id)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.transport.all` + `queryKeys.transport.detail(id)` + `toast.success('Driver unassigned')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to unassign driver'`
  - [x] ✅ All hooks import `toast` from `sonner`
  - [x] ✅ All hooks import `queryKeys` from `@/lib/query-keys`

---

## Pages

### `app/(dashboard)/transport/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads from `useSearchParams`:
  - [x] ✅ `?page` → `Number(param)` (default `1` when absent)
  - [x] ✅ `?search` → defaults to `''`
  - [x] ✅ `?status` → `'available' | 'in_transit' | 'maintenance'` or `undefined` when absent
  - [x] ✅ `?type` → `'truck' | 'van' | 'motorcycle' | 'bicycle'` or `undefined` when absent
  - [x] ✅ `?ordering` → `'name' | '-name' | 'created_at' | '-created_at' | 'status' | '-status'` or `undefined` when absent
- [x] ✅ Builds `TransportListParams` from URL params and passes to `useTransportList`
- [x] ✅ Updates URL params via `router.push` with merged `URLSearchParams` (does NOT use `router.replace`)
- [x] ✅ Renders `PageHeader` with title `"Transport"` and `"New Vehicle"` button linking to `/transport/new`
- [x] ✅ Renders `TransportTable` with data, loading state, params, and `onParamsChange` callback
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading` (delegated to `DataTable` inside `TransportTable`)
- [x] ✅ Empty state: `"No vehicles found"` message when `results` is empty and not loading (delegated to `DataTable`)
- [x] ✅ Error state: error message when query fails

### `app/(dashboard)/transport/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ Renders `PageHeader` with title `"New Vehicle"` and back button → `/transport`
- [x] ✅ Renders `TransportForm` in `mode="create"`
- [x] ✅ `onSuccess` callback: `router.push('/transport')`

### `app/(dashboard)/transport/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useTransport(Number(id))` for data
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading`
- [x] ✅ Not-found / error state: renders `"Vehicle not found"` with a back button if query fails or data is undefined
- [x] ✅ Displays all fields in a readable layout:
  - [x] ✅ `name` — displayed prominently as page sub-title or heading
  - [x] ✅ `type` — rendered as `StatusBadge`
  - [x] ✅ `plate_number` — labeled "Plate Number"
  - [x] ✅ `capacity_kg` — labeled "Capacity (kg)"
  - [x] ✅ `capacity_m3` — labeled "Capacity (m³)"
  - [x] ✅ `status` — rendered as `StatusBadge`
  - [x] ✅ `driver` — if assigned: shows `license_number` and `phone` with link to `/drivers/[id]`; if null: shows "No driver assigned"
  - [x] ✅ `created_at` — formatted as readable date/time string
  - [x] ✅ `updated_at` — formatted as readable date/time string
- [x] ✅ Edit button → `/transport/[id]/edit`
- [x] ✅ Delete button → opens `ConfirmDialog` → on confirm calls `useDeleteTransport().mutate(id)` → on success `router.push('/transport')`
- [x] ✅ `ConfirmDialog` message: `"This will permanently delete the vehicle. This action cannot be undone."`
- [x] ✅ "Assign Driver" button → opens `AssignDriverDialog` (only shown when `driver` is `null`)
- [x] ✅ "Unassign Driver" button → opens `ConfirmDialog` → on confirm calls `useUnassignDriver().mutate(id)` (only shown when `driver` is not `null`)
- [x] ✅ `ConfirmDialog` for unassign message: `"This will remove the currently assigned driver from this vehicle."`

### `app/(dashboard)/transport/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useTransport(Number(id))` to fetch current data
- [x] ✅ Shows `LoadingSpinner` until data is loaded
- [x] ✅ Renders `PageHeader` with title `"Edit Vehicle"` and back button → `/transport/[id]`
- [x] ✅ Renders `TransportForm` in `mode="edit"` with `defaultValues` pre-populated from fetched data
- [x] ✅ `onSuccess` callback: `router.push('/transport/' + id)`

---

## Components

### `components/transport/TransportTable.tsx`

- [x] ✅ Props:
  - [x] ✅ `data: PaginatedResponse<Transport> | undefined`
  - [x] ✅ `isLoading: boolean`
  - [x] ✅ `params: TransportListParams`
  - [x] ✅ `onParamsChange: (p: Partial<TransportListParams>) => void` — updates URL params in the parent page
- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Transport>[]`:
  - [x] ✅ `name` — clickable link to `/transport/[id]`
  - [x] ✅ `type` — rendered as `StatusBadge`
  - [x] ✅ `plate_number` — labeled "Plate Number"
  - [x] ✅ `capacity_kg` — labeled "Capacity (kg)"
  - [x] ✅ `capacity_m3` — labeled "Capacity (m³)"
  - [x] ✅ `status` — rendered as `StatusBadge`
  - [x] ✅ `driver` — shows `license_number` if assigned, `"—"` if null
  - [x] ✅ Actions column: View (`/transport/[id]`), Edit (`/transport/[id]/edit`), Delete (inline `ConfirmDialog`)
- [x] ✅ Search input:
  - [x] ✅ Controlled by `params.search`
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ search: value, page: 1 })`
  - [x] ✅ Placeholder: `"Search by name or plate number…"`
- [x] ✅ `status` filter:
  - [x] ✅ Shadcn `Select` with options: `"All"` (clears filter), `"Available"`, `"In Transit"`, `"Maintenance"`
  - [x] ✅ Calls `onParamsChange({ status: value || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.status`
- [x] ✅ `type` filter:
  - [x] ✅ Shadcn `Select` with options: `"All"` (clears filter), `"Truck"`, `"Van"`, `"Motorcycle"`, `"Bicycle"`
  - [x] ✅ Calls `onParamsChange({ type: value || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.type`
- [x] ✅ Ordering:
  - [x] ✅ Column headers for `name`, `created_at`, and `status` are sortable
  - [x] ✅ Clicking toggles ascending/descending (e.g. `?ordering=name` / `?ordering=-name`)
  - [x] ✅ Active sort direction shown with icon (▲/▼) in the column header
- [x] ✅ Pagination controls:
  - [x] ✅ Shows current page and total count
  - [x] ✅ Previous / Next buttons
  - [x] ✅ Calls `onParamsChange({ page: newPage })`
  - [x] ✅ Previous disabled on page 1; Next disabled when `next` is `null`
- [x] ✅ Delete per-row: `ConfirmDialog` opens with vehicle name, calls `useDeleteTransport` on confirm
- [x] ✅ Loading state: render `LoadingSpinner` or skeleton rows when `isLoading`
- [x] ✅ Empty state: `"No vehicles found"` when `data?.results` is empty and not loading

### `components/transport/TransportForm.tsx`

- [x] ✅ Props:
  - [x] ✅ `mode: 'create' | 'edit'`
  - [x] ✅ `defaultValues?: Transport`
  - [x] ✅ `onSuccess: () => void`
- [x] ✅ Zod schema for both modes (same schema, edit uses `defaultValues` to pre-fill):
  - [x] ✅ `transportSchema`:
    - [x] ✅ `name`: `z.string().min(1, 'Name is required').max(200)`
    - [x] ✅ `type`: `z.enum(['truck', 'van', 'motorcycle', 'bicycle'], { required_error: 'Type is required' })`
    - [x] ✅ `plate_number`: `z.string().min(1, 'Plate number is required').max(20)`
    - [x] ✅ `capacity_kg`: `z.string().min(1, ...).regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number')`
    - [x] ✅ `capacity_m3`: `z.string().min(1, ...).regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number')`
    - [x] ✅ `driver`: `z.number().nullable().optional()` — optional driver ID
    - [x] ✅ `status`: `z.enum(['available', 'in_transit', 'maintenance'], { required_error: 'Status is required' })`
- [x] ✅ Uses `react-hook-form` with `zodResolver`
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Fields rendered in both `create` and `edit` modes:
  - [x] ✅ `name`: `Input` type="text", placeholder="e.g. Truck A1"
  - [x] ✅ `type`: shadcn `Select` with options `"Truck"` (value `truck`), `"Van"` (value `van`), `"Motorcycle"` (value `motorcycle`), `"Bicycle"` (value `bicycle`)
  - [x] ✅ `plate_number`: `Input` type="text", placeholder="e.g. ABC-1234"
  - [x] ✅ `capacity_kg`: `Input` type="text", placeholder="e.g. 5000.00"
  - [x] ✅ `capacity_m3`: `Input` type="text", placeholder="e.g. 12.500"
  - [x] ✅ `status`: shadcn `Select` with options `"Available"` (value `available`), `"In Transit"` (value `in_transit`), `"Maintenance"` (value `maintenance`)
- [x] ✅ `driver` field NOT in the form — driver is managed separately via `AssignDriverDialog` and unassign button
- [x] ✅ In edit mode: `defaultValues` pre-populates all fields from the fetched `Transport` object:
  - [x] ✅ `name` ← `defaultValues.name`
  - [x] ✅ `type` ← `defaultValues.type`
  - [x] ✅ `plate_number` ← `defaultValues.plate_number`
  - [x] ✅ `capacity_kg` ← `defaultValues.capacity_kg`
  - [x] ✅ `capacity_m3` ← `defaultValues.capacity_m3`
  - [x] ✅ `status` ← `defaultValues.status`
- [x] ✅ On submit:
  - [x] ✅ `mode === 'create'` → calls `useCreateTransport().mutate(body)` with `CreateTransportBody`
  - [x] ✅ `mode === 'edit'` → calls `useUpdateTransport().mutate({ id, body })` with `UpdateTransportBody`
  - [x] ✅ On mutation success: calls `onSuccess()`
- [x] ✅ API `details` field errors mapped to individual form fields via `form.setError`:
  - [x] ✅ Iterates `error.response?.data?.error?.details` and calls `form.setError(field, { message })` for each key
  - [x] ✅ `plate_number` errors from API mapped to `form.setError('plate_number', { message })`
  - [x] ✅ Non-field / generic errors handled by `toast.error` in the hook's `onError`
- [x] ✅ Submit button:
  - [x] ✅ Label: `"Create Vehicle"` in create mode, `"Save Changes"` in edit mode
  - [x] ✅ `disabled={isPending}`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`

### `components/transport/AssignDriverDialog.tsx`

- [x] ✅ Props:
  - [x] ✅ `transportId: number`
  - [x] ✅ `open: boolean`
  - [x] ✅ `onOpenChange: (open: boolean) => void`
- [x] ✅ Uses shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- [x] ✅ Loads available drivers via `useDriverList({ status: 'available' })` — imports `useDriverList` from `@/hooks/drivers/use-drivers`
- [x] ✅ Shows `LoadingSpinner` while drivers list is loading
- [x] ✅ Renders shadcn `Select` to choose a driver:
  - [x] ✅ Options: each available driver shown as `"{first_name} {last_name} — {license_number}"` (uses `driver.user.first_name`, `driver.user.last_name`, `driver.license_number`)
  - [x] ✅ `value` is the driver `id` as a string (converted to `number` on submit)
  - [x] ✅ If no drivers are available: shows `"No available drivers"` message and disables the confirm button
- [x] ✅ "Confirm" button:
  - [x] ✅ Calls `useAssignDriver().mutate({ id: transportId, driver_id: selectedDriverId })`
  - [x] ✅ `disabled` while no driver is selected or `isPending`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`
  - [x] ✅ On mutation success: calls `onOpenChange(false)` to close the dialog
- [x] ✅ "Cancel" button: calls `onOpenChange(false)`
- [x] ✅ Resets selected driver when dialog opens (controlled by `open` prop)

---

## Sidebar Navigation

- [x] ✅ `components/layout/Sidebar.tsx` — verify "Transport" nav item already exists:
  - [x] ✅ Entry with `href: '/transport'` is already present in the `navItems` array — **no changes needed**
  - [x] ✅ If entry is missing for any reason, add it with an appropriate icon from `lucide-react` (e.g. `Truck`)

---

## Error & Edge Cases

- [x] ✅ **Duplicate `plate_number`**: POST/PATCH returns 400 with `details.plate_number` — must be surfaced via `form.setError('plate_number', { message })`, not just `toast.error` — `handleFieldErrors` in `TransportForm.tsx` iterates `error.response?.data?.error?.details` and calls `form.setError` for each key including `plate_number`
- [x] ✅ **Decimal field format**: `capacity_kg` and `capacity_m3` must be sent as strings (e.g. `"5000.00"`) — never `parseFloat` them before sending; Zod regex `/^\d+(\.\d+)?$/` validates client-side — both fields are typed as `string` in `types/transport.ts` and passed as-is in `TransportForm.tsx:122-132`
- [x] ✅ **Driver field in form**: driver assignment is handled exclusively through `AssignDriverDialog` and the unassign confirm button — the `TransportForm` does NOT include a driver select; do not add one
- [x] ✅ **Assign driver — only available drivers shown**: `AssignDriverDialog` calls `useDriverList({ status: 'available' })`; drivers with `busy` or `off_duty` status must not appear in the select — confirmed at `AssignDriverDialog.tsx:32-34`
- [x] ✅ **Assign driver — driver already assigned to another vehicle**: the API may return 409 conflict — `toast.error` must display the API's `message` field — `useAssignDriver` onError calls `toast.error(getErrorMessage(error, 'Failed to assign driver'))` which reads `error.response?.data?.error?.message` (`hooks/transport/use-transport.ts:101-103`)
- [x] ✅ **Unassign driver when none assigned**: the "Unassign Driver" button must only be rendered when `driver !== null`; the "Assign Driver" button must only be rendered when `driver === null` — correctly gated in `app/(dashboard)/transport/[id]/page.tsx:132-159`
- [x] ✅ **`in_transit` vehicle deletion**: the API may reject DELETE if the vehicle is currently assigned to an active shipment — `toast.error` must display the API's `message` field — `useDeleteTransport` onError calls `toast.error(getErrorMessage(error, 'Failed to delete transport'))` which reads `error.response?.data?.error?.message` (`hooks/transport/use-transport.ts:83-85`)
- [x] ✅ **`status` filter `in_transit` display**: the raw API value `in_transit` contains an underscore — render as `"In Transit"` in the Select filter and as a properly labeled `StatusBadge` in the table and detail view; never display the raw value — `STATUS_LABELS` map and SelectItem with label "In Transit" confirmed in `TransportTable.tsx:33-37` and `app/(dashboard)/transport/[id]/page.tsx:15-19`
- [x] ✅ **StatusBadge color mapping**: use consistent, distinct color mapping — `available` (green), `in_transit` (blue), `maintenance` (yellow/amber); `type` badge: `truck` (gray), `van` (blue), `motorcycle` (orange), `bicycle` (green) — all entries confirmed in `components/shared/StatusBadge.tsx:3-22`
- [x] ✅ **404 on detail/edit page**: if `useTransport` returns a 404 error, render `"Vehicle not found"` with a back button instead of crashing — implemented in both `app/(dashboard)/transport/[id]/page.tsx:41-63` and `app/(dashboard)/transport/[id]/edit/page.tsx:19-41`
- [x] ✅ **`id` param coercion**: `useParams` returns strings — always call `Number(id)` before passing to hooks/services that expect `number` — `Number(params.id)` used in both detail and edit pages
- [x] ✅ **`enabled` flag on detail query**: `useTransport` must set `enabled: !!id` to prevent querying with `id = 0` or `NaN` — confirmed at `hooks/transport/use-transport.ts:39`
- [x] ✅ **Pagination reset on filter change**: when `search`, `status`, or `type` filter changes, reset `page` to 1 — all three handlers pass `page: 1` in `TransportTable.tsx:63`, `69`, `76`
- [x] ✅ **Search is debounced**: search input must be debounced (300 ms); `status` and `type` selects do NOT need debounce — `setTimeout(..., 300)` at `TransportTable.tsx:62`; status/type handlers call `onParamsChange` directly
- [x] ✅ **Double-submit prevention**: Submit button is `disabled` while `isPending` — no duplicate POST/PATCH requests sent — `disabled={isPending}` at `TransportForm.tsx:268`
- [x] ✅ **Auth**: all API calls go through `@/services/api` Axios instance which automatically attaches `Authorization: Bearer <token>` — do not manually add headers in the service file — confirmed, `services/transport.ts:1` imports from `@/services/api` only
- [x] ✅ **`useSearchParams` on list page**: use `router.push` with merged `URLSearchParams` to update filters without full page reload; do NOT use `router.replace` (would break browser back button) — `router.push(...)` used at `app/(dashboard)/transport/page.tsx:84`
- [x] ✅ **Ordering state reflected in column headers**: active sort direction shown with an icon (▲/▼); toggling the same column reverses direction; clicking a different column resets to ascending — `SortIcon` component at `TransportTable.tsx:27-31`; `handleOrderingToggle` at `TransportTable.tsx:83-94` resets to ascending when switching columns
- [x] ✅ **Network error**: all mutations handle network errors in `onError` — no unhandled promise rejections — all six mutations in `hooks/transport/use-transport.ts` have `onError` handlers
- [x] ✅ **`AssignDriverDialog` driver label**: driver options must show a human-readable label (`first_name last_name — license_number`) not just the raw ID; requires `useDriverList` which returns the `user` nested object — confirmed at `AssignDriverDialog.tsx:87`
- [x] ✅ **Capacity fields display**: on the detail page, display `capacity_kg` and `capacity_m3` as-is from the API (string) — do not convert to number for display; add units in the label — `{data.capacity_kg}` and `{data.capacity_m3}` rendered as strings at `app/(dashboard)/transport/[id]/page.tsx:114,118`
