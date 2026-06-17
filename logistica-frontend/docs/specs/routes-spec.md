# Spec: Routes Module

**Status:** pending approval
**Generated:** 2026-05-30
**Dependencies:** warehouses (done)

---

## Infrastructure Already in Place (Do NOT Recreate)

The following are pre-built and shared across all modules — do not touch:

- `services/api.ts` — Axios singleton with JWT Bearer interceptor and 401 refresh queue
- `stores/auth.store.ts` — Zustand auth state
- `types/api.ts` — `PaginatedResponse<T>`, `ApiError`
- `types/warehouses.ts` — `Warehouse`, `WarehouseListParams` already defined; import `Warehouse` for `WarehouseRef`
- `components/shared/DataTable.tsx` — TanStack Table wrapper
- `components/shared/PageHeader.tsx` — title + action button
- `components/shared/ConfirmDialog.tsx` — delete confirmation modal
- `components/shared/StatusBadge.tsx` — colored badge
- `components/shared/LoadingSpinner.tsx` — spinner
- `components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new `routes` block, never remove existing blocks)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

**Sidebar already has entries for prior modules** — add a "Routes" nav entry only if one is missing.

---

## Types

- [x] ✅ `types/routes.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `type RouteStatus = 'active' | 'inactive'`
  - [x] ✅ `interface WarehouseRef` — inline reference returned inside a Route object:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
    - [x] ✅ `city: string`
  - [x] ✅ `interface RouteStop` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `stop_order: number` — unique within a route; used for ascending sort
    - [x] ✅ `address: string` — max 500 chars
    - [x] ✅ `city: string` — max 100 chars
    - [x] ✅ `latitude: string | null` — decimal string, never number
    - [x] ✅ `longitude: string | null` — decimal string, never number
    - [x] ✅ `created_at: string` — ISO 8601
  - [x] ✅ `interface Route` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string` — max 200 chars
    - [x] ✅ `origin_warehouse: WarehouseRef`
    - [x] ✅ `status: RouteStatus`
    - [x] ✅ `stops: RouteStop[]` — ordered by `stop_order` ascending
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface RouteListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches `name`
    - [x] ✅ `status?: RouteStatus`
    - [x] ✅ `origin_warehouse?: number` — filter by warehouse ID
    - [x] ✅ `ordering?: 'name' | '-name' | 'created_at' | '-created_at'`
  - [x] ✅ `interface CreateRouteBody`:
    - [x] ✅ `name: string` — required
    - [x] ✅ `origin_warehouse: number` — required; warehouse ID (not the full object)
    - [x] ✅ `status: RouteStatus` — required
    - [x] ✅ `stops?: CreateRouteStopBody[]` — optional inline stops on creation
  - [x] ✅ `interface CreateRouteStopBody`:
    - [x] ✅ `stop_order: number` — required; must be unique within the route
    - [x] ✅ `address: string` — required
    - [x] ✅ `city: string` — required
    - [x] ✅ `latitude?: string | null` — decimal string
    - [x] ✅ `longitude?: string | null` — decimal string
  - [x] ✅ `interface UpdateRouteBody` — all fields optional for PATCH:
    - [x] ✅ `name?: string`
    - [x] ✅ `origin_warehouse?: number`
    - [x] ✅ `status?: RouteStatus`
  - [x] ✅ `interface AddStopBody` — body for POST `/api/routes/{id}/stops/`:
    - [x] ✅ `stop_order: number` — required; must be unique within the route
    - [x] ✅ `address: string` — required
    - [x] ✅ `city: string` — required
    - [x] ✅ `latitude?: string | null` — decimal string
    - [x] ✅ `longitude?: string | null` — decimal string

---

## Service Layer

- [x] ✅ `services/routes.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: RouteListParams): Promise<PaginatedResponse<Route>>`
  - [x] ✅ Maps params to query string: `page`, `search`, `status`, `origin_warehouse`, `ordering`
  - [x] ✅ GET `/api/routes/`
- [x] ✅ `getById(id: number): Promise<Route>`
  - [x] ✅ GET `/api/routes/{id}/` — response includes `stops` array
- [x] ✅ `create(body: CreateRouteBody): Promise<Route>`
  - [x] ✅ POST `/api/routes/` — expects 201; stops may be included inline in the body
- [x] ✅ `update(id: number, body: UpdateRouteBody): Promise<Route>`
  - [x] ✅ PATCH `/api/routes/{id}/` — partial update of route fields only (name, origin_warehouse, status); expects 200
  - [x] ✅ Do NOT send stops in this call — stops are managed by separate endpoints
- [x] ✅ `remove(id: number): Promise<void>`
  - [x] ✅ DELETE `/api/routes/{id}/` — expects 204, returns void; cascade deletes all stops
- [x] ✅ `getStops(routeId: number): Promise<RouteStop[]>`
  - [x] ✅ GET `/api/routes/{routeId}/stops/` — returns a plain array (not paginated)
- [x] ✅ `addStop(routeId: number, body: AddStopBody): Promise<RouteStop>`
  - [x] ✅ POST `/api/routes/{routeId}/stops/` — expects 201
- [x] ✅ `removeStop(routeId: number, stopId: number): Promise<void>`
  - [x] ✅ DELETE `/api/routes/{routeId}/stops/{stopId}/` — expects 204, returns void

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — APPEND new `routes` block (do not modify existing `warehouses`, `suppliers`, `customers`, `products`, `drivers`, or `transport` blocks):
  - [x] ✅ Add `import type { RouteListParams } from '@/types/routes'` at the top of the file alongside existing imports
  - [x] ✅ `routes` block:
    - [x] ✅ `all: ['routes'] as const`
    - [x] ✅ `list: (filters: RouteListParams) => ['routes', 'list', filters] as const`
    - [x] ✅ `detail: (id: number) => ['routes', 'detail', id] as const`
    - [x] ✅ `stops: (routeId: number) => ['routes', 'stops', routeId] as const`

---

## Hooks

- [x] ✅ `hooks/routes/use-routes.ts` — single file exporting all hooks for this module
  - [x] ✅ `useRouteList(params: RouteListParams)` — `useQuery`
    - [x] ✅ Uses `queryKeys.routes.list(params)` as query key
    - [x] ✅ Calls `getList(params)` from `@/services/routes`
    - [x] ✅ Returns `PaginatedResponse<Route>` (count, next, previous, results)
  - [x] ✅ `useRoute(id: number)` — `useQuery` for single item
    - [x] ✅ Uses `queryKeys.routes.detail(id)` as query key
    - [x] ✅ Calls `getById(id)`
    - [x] ✅ `enabled: !!id` — prevents querying with `id = 0` or `NaN`
  - [x] ✅ `useRouteStops(routeId: number)` — `useQuery`
    - [x] ✅ Uses `queryKeys.routes.stops(routeId)` as query key
    - [x] ✅ Calls `getStops(routeId)` from `@/services/routes`
    - [x] ✅ Returns `RouteStop[]`
    - [x] ✅ `enabled: !!routeId`
  - [x] ✅ `useCreateRoute()` — `useMutation`
    - [x] ✅ Calls `create(body)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.routes.all })` + `toast.success('Route created')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to create route'`
  - [x] ✅ `useUpdateRoute()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; body: UpdateRouteBody }`
    - [x] ✅ Calls `update(id, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.routes.all` + `queryKeys.routes.detail(id)` + `toast.success('Route updated')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to update route'`
  - [x] ✅ `useDeleteRoute()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `remove(id)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.routes.all })` + `toast.success('Route deleted')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to delete route'`
  - [x] ✅ `useAddStop()` — `useMutation`
    - [x] ✅ Mutation variable: `{ routeId: number; body: AddStopBody }`
    - [x] ✅ Calls `addStop(routeId, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.routes.stops(routeId)` + `queryKeys.routes.detail(routeId)` + `toast.success('Stop added')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to add stop'`
  - [x] ✅ `useRemoveStop()` — `useMutation`
    - [x] ✅ Mutation variable: `{ routeId: number; stopId: number }`
    - [x] ✅ Calls `removeStop(routeId, stopId)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.routes.stops(routeId)` + `queryKeys.routes.detail(routeId)` + `toast.success('Stop removed')`
    - [x] ✅ `onError`: `toast.error` with `error.response?.data?.error?.message` or fallback `'Failed to remove stop'`
  - [x] ✅ All hooks import `toast` from `sonner`
  - [x] ✅ All hooks import `queryKeys` from `@/lib/query-keys`

---

## Pages

### `app/(dashboard)/routes/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads from `useSearchParams`:
  - [x] ✅ `?page` → `Number(param)` (default `1` when absent)
  - [x] ✅ `?search` → defaults to `''`
  - [x] ✅ `?status` → `'active' | 'inactive'` or `undefined` when absent
  - [x] ✅ `?origin_warehouse` → `Number(param)` or `undefined` when absent
  - [x] ✅ `?ordering` → `'name' | '-name' | 'created_at' | '-created_at'` or `undefined` when absent
- [x] ✅ Builds `RouteListParams` from URL params and passes to `useRouteList`
- [x] ✅ Updates URL params via `router.push` with merged `URLSearchParams` (does NOT use `router.replace`)
- [x] ✅ Renders `PageHeader` with title `"Routes"` and `"New Route"` button linking to `/routes/new`
- [x] ✅ Renders `RoutesTable` with data, loading state, params, and `onParamsChange` callback
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading` (delegated to `DataTable` inside `RoutesTable`)
- [x] ✅ Empty state: `"No routes found"` message when `results` is empty and not loading (delegated to `DataTable`)
- [x] ✅ Error state: error message when query fails

### `app/(dashboard)/routes/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ Renders `PageHeader` with title `"New Route"` and back button → `/routes`
- [x] ✅ Renders `RouteForm` in `mode="create"`
- [x] ✅ `onSuccess` callback: `router.push('/routes')`

### `app/(dashboard)/routes/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useRoute(Number(id))` for data
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading`
- [x] ✅ Not-found / error state: renders `"Route not found"` with a back button if query fails or data is undefined
- [x] ✅ Displays all route fields in a readable layout:
  - [x] ✅ `name` — displayed prominently as page sub-title or heading
  - [x] ✅ `status` — rendered as `StatusBadge`
  - [x] ✅ `origin_warehouse` — shows warehouse `name` and `city`; links to `/warehouses/[id]`
  - [x] ✅ `created_at` — formatted as readable date/time string
  - [x] ✅ `updated_at` — formatted as readable date/time string
- [x] ✅ Displays stops section below route fields:
  - [x] ✅ Renders `StopsManager` in `mode="view"` passing `stops` from `useRoute` data (already included in response)
  - [x] ✅ Stops shown ordered by `stop_order` ascending
  - [x] ✅ If no stops: shows `"No stops defined for this route"`
- [x] ✅ Edit button → `/routes/[id]/edit`
- [x] ✅ Delete button → opens `ConfirmDialog` → on confirm calls `useDeleteRoute().mutate(id)` → on success `router.push('/routes')`
- [x] ✅ `ConfirmDialog` message: `"This will permanently delete the route and all its stops. This action cannot be undone."`

### `app/(dashboard)/routes/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useRoute(Number(id))` to fetch current data
- [x] ✅ Shows `LoadingSpinner` until data is loaded
- [x] ✅ Renders `PageHeader` with title `"Edit Route"` and back button → `/routes/[id]`
- [x] ✅ Renders `RouteForm` in `mode="edit"` with `defaultValues` pre-populated from fetched data
- [x] ✅ Below `RouteForm`, renders `StopsManager` in `mode="edit"` passing `routeId={Number(id)}`
- [x] ✅ `onSuccess` callback for `RouteForm`: `router.push('/routes/' + id)`

---

## Components

### `components/routes/RoutesTable.tsx`

- [x] ✅ Props:
  - [x] ✅ `data: PaginatedResponse<Route> | undefined`
  - [x] ✅ `isLoading: boolean`
  - [x] ✅ `params: RouteListParams`
  - [x] ✅ `onParamsChange: (p: Partial<RouteListParams>) => void` — updates URL params in the parent page
- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Route>[]`:
  - [x] ✅ `name` — clickable link to `/routes/[id]`
  - [x] ✅ `origin_warehouse` — shows warehouse `name` and `city` (e.g. `"Central Warehouse – Chicago"`)
  - [x] ✅ `status` — rendered as `StatusBadge` (`active` = green, `inactive` = gray)
  - [x] ✅ `stops` — shows count of stops (e.g. `"3 stops"`)
  - [x] ✅ `created_at` — formatted date string
  - [x] ✅ Actions column: View (`/routes/[id]`), Edit (`/routes/[id]/edit`), Delete (inline `ConfirmDialog`)
- [x] ✅ Search input:
  - [x] ✅ Controlled by `params.search`
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ search: value, page: 1 })`
  - [x] ✅ Placeholder: `"Search by name…"`
- [x] ✅ `status` filter:
  - [x] ✅ Shadcn `Select` with options: `"All"` (clears filter), `"Active"`, `"Inactive"`
  - [x] ✅ Calls `onParamsChange({ status: value || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.status`
- [x] ✅ `origin_warehouse` filter:
  - [x] ✅ Shadcn `Select` populated from `useWarehouseList({ page: 1 })` (no pagination needed for typical small list)
  - [x] ✅ Options: `"All Warehouses"` (clears filter), then each warehouse as `"{name} – {city}"`
  - [x] ✅ Calls `onParamsChange({ origin_warehouse: Number(value) || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.origin_warehouse`
- [x] ✅ Ordering:
  - [x] ✅ Column headers for `name` and `created_at` are sortable
  - [x] ✅ Clicking toggles ascending/descending (e.g. `?ordering=name` / `?ordering=-name`)
  - [x] ✅ Active sort direction shown with icon (▲/▼) in the column header
- [x] ✅ Pagination controls:
  - [x] ✅ Shows current page and total count
  - [x] ✅ Previous / Next buttons
  - [x] ✅ Calls `onParamsChange({ page: newPage })`
  - [x] ✅ Previous disabled on page 1; Next disabled when `next` is `null`
- [x] ✅ Delete per-row: `ConfirmDialog` opens with route name, calls `useDeleteRoute` on confirm
- [x] ✅ Loading state: render `LoadingSpinner` or skeleton rows when `isLoading`
- [x] ✅ Empty state: `"No routes found"` when `data?.results` is empty and not loading

### `components/routes/RouteForm.tsx`

- [x] ✅ Props:
  - [x] ✅ `mode: 'create' | 'edit'`
  - [x] ✅ `defaultValues?: Route`
  - [x] ✅ `onSuccess: () => void`
- [x] ✅ Zod schema:
  - [x] ✅ `routeSchema`:
    - [x] ✅ `name`: `z.string({ required_error: 'Name is required' }).min(1, 'Name is required').max(200)`
    - [x] ✅ `origin_warehouse`: `z.number({ required_error: 'Warehouse is required', invalid_type_error: 'Warehouse is required' })`
    - [x] ✅ `status`: `z.enum(['active', 'inactive'], { required_error: 'Status is required' })`
    - [x] ✅ `stops` (create mode only): `z.array(stopSchema).optional()`
  - [x] ✅ `stopSchema` (used inside `routeSchema` for create mode inline stops):
    - [x] ✅ `stop_order`: `z.number({ required_error: 'Stop order is required', invalid_type_error: 'Must be a number' }).int().min(1)`
    - [x] ✅ `address`: `z.string({ required_error: 'Address is required' }).min(1).max(500)`
    - [x] ✅ `city`: `z.string({ required_error: 'City is required' }).min(1).max(100)`
    - [x] ✅ `latitude`: regex `/^-?\d+(\.\d+)?$/` (allows negatives as required by edge-case spec)
    - [x] ✅ `longitude`: regex `/^-?\d+(\.\d+)?$/` (allows negatives as required by edge-case spec)
- [x] ✅ Uses `react-hook-form` with `zodResolver`
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Route fields rendered in both `create` and `edit` modes:
  - [x] ✅ `name`: `Input` type="text", placeholder="e.g. Downtown Express"
  - [x] ✅ `origin_warehouse`: shadcn `Select` populated from `useWarehouseList({ page: 1 })` (load all active warehouses)
    - [x] ✅ Options: each warehouse shown as `"{name} – {city}"` with value = warehouse `id` (as number)
    - [x] ✅ Shows `LoadingSpinner` while warehouses are loading
    - [x] ✅ On selection, store the warehouse ID as a number in the form field
  - [x] ✅ `status`: shadcn `Select` with options `"Active"` (value `active`), `"Inactive"` (value `inactive`)
- [x] ✅ In `create` mode only — inline stop fields managed with `useFieldArray`:
  - [x] ✅ Uses `useFieldArray` from `react-hook-form` with field name `"stops"`
  - [x] ✅ "Add Stop" button appends a new stop entry with default empty values and `stop_order` auto-incremented (next integer after current max)
  - [x] ✅ Each stop entry renders:
    - [x] ✅ `stop_order`: `Input` type="number", labeled "Stop #"
    - [x] ✅ `address`: `Input` type="text", placeholder="e.g. 123 Oak St"
    - [x] ✅ `city`: `Input` type="text", placeholder="e.g. New York"
    - [x] ✅ `latitude`: `Input` type="text", placeholder="e.g. 40.712776" (optional)
    - [x] ✅ `longitude`: `Input` type="text", placeholder="e.g. -74.005974" (optional)
    - [x] ✅ Remove button (trash icon) — calls `remove(index)` from `useFieldArray`
  - [x] ✅ Stop entries are displayed in order of their position in the array
  - [x] ✅ If no stops added, the stops array is omitted from the create body (not sent as empty array)
- [x] ✅ In `edit` mode: stops section is NOT included in this form — stops are managed separately via `StopsManager`
- [x] ✅ In edit mode: `defaultValues` pre-populates route fields from the fetched `Route` object:
  - [x] ✅ `name` ← `defaultValues.name`
  - [x] ✅ `origin_warehouse` ← `defaultValues.origin_warehouse.id` (extract the number ID from the nested object)
  - [x] ✅ `status` ← `defaultValues.status`
- [x] ✅ On submit:
  - [x] ✅ `mode === 'create'` → calls `useCreateRoute().mutate(body)` with `CreateRouteBody` (includes stops if any were added)
  - [x] ✅ `mode === 'edit'` → calls `useUpdateRoute().mutate({ id, body })` with `UpdateRouteBody` (route fields only)
  - [x] ✅ On mutation success: calls `onSuccess()`
- [x] ✅ API `details` field errors mapped to individual form fields via `form.setError`:
  - [x] ✅ Iterates `error.response?.data?.error?.details` and calls `form.setError(field, { message })` for each key
  - [x] ✅ Non-field / generic errors handled by `toast.error` in the hook's `onError`
- [x] ✅ Submit button:
  - [x] ✅ Label: `"Create Route"` in create mode, `"Save Changes"` in edit mode
  - [x] ✅ `disabled={isPending}`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`

### `components/routes/StopsManager.tsx`

- [x] ✅ Props:
  - [x] ✅ `routeId: number`
  - [x] ✅ `stops: RouteStop[]` — current stops (passed from parent; already sorted by `stop_order`)
  - [x] ✅ `mode: 'view' | 'edit'`
- [x] ✅ In both modes: displays the list of stops sorted by `stop_order` ascending
  - [x] ✅ Each stop shows: stop number (`stop_order`), `address`, `city`, and optionally `latitude`/`longitude`
  - [x] ✅ If `stops` is empty: shows `"No stops defined for this route"`
- [x] ✅ In `view` mode: read-only display only; no add/delete controls shown
- [x] ✅ In `edit` mode:
  - [x] ✅ Shows a delete button (trash icon) on each stop row
    - [x] ✅ Delete button opens an inline `ConfirmDialog` or calls `useRemoveStop` directly with confirmation text `"Remove this stop from the route?"`
    - [x] ✅ On confirm: calls `useRemoveStop().mutate({ routeId, stopId: stop.id })`
    - [x] ✅ Delete button is `disabled` while `useRemoveStop` mutation is pending
  - [x] ✅ Shows an "Add Stop" section below the stops list with a mini-form for adding a new stop:
    - [x] ✅ `stop_order`: `Input` type="number", labeled "Stop Order"
      - [x] ✅ Default value: current max `stop_order + 1` or `1` if no stops exist
    - [x] ✅ `address`: `Input` type="text", placeholder="e.g. 123 Oak St", labeled "Address"
    - [x] ✅ `city`: `Input` type="text", placeholder="e.g. New York", labeled "City"
    - [x] ✅ `latitude`: `Input` type="text", placeholder="e.g. 40.712776", labeled "Latitude (optional)"
    - [x] ✅ `longitude`: `Input` type="text", placeholder="e.g. -74.005974", labeled "Longitude (optional)"
    - [x] ✅ "Add Stop" submit button:
      - [x] ✅ Validates client-side before calling `useAddStop`:
        - [x] ✅ `stop_order` must be a positive integer
        - [x] ✅ `address` must not be empty
        - [x] ✅ `city` must not be empty
        - [x] ✅ `latitude` and `longitude`, if provided, must match `/^\d+(\.\d+)?$/` regex; both optional individually (note: implementation correctly uses `/^-?\d+(\.\d+)?$/` allowing negatives per edge-case requirement)
      - [x] ✅ Calls `useAddStop().mutate({ routeId, body })`
      - [x] ✅ `disabled` while mutation is pending
      - [x] ✅ Shows `LoadingSpinner` inline when pending
      - [x] ✅ On success: resets the add-stop mini-form fields to default values

---

## Sidebar Navigation

- [x] ✅ `components/layout/Sidebar.tsx` — verify a "Routes" nav item exists:
  - [x] ✅ Entry with `href: '/routes'` is present in the `navItems` array — if already present, no changes needed
  - [x] ✅ If missing: add it with an appropriate icon from `lucide-react` (e.g. `MapPin` or `Route`)

---

## Error & Edge Cases

- [x] ✅ **Duplicate `stop_order` within a route**: POST `/stops/` returns 400 with `details.stop_order` — surface via `toast.error` with API message; in `StopsManager` mini-form also show inline validation error under the stop order field when API returns this error
- [x] ✅ **Coordinate dependency (latitude/longitude)**: `latitude` and `longitude` are individually optional in the API — validate only that if a value is provided it is a valid decimal string; do not enforce "both or neither" unless the API documents that constraint
- [x] ✅ **Decimal coordinate fields**: `latitude` and `longitude` on `RouteStop` are typed as `string | null` — never `parseFloat` them; display as-is; Zod regex `/^\d+(\.\d+)?$/` validates format if provided (note: negative coordinates like `-74.005974` — validate with `z.string().regex(/^-?\d+(\.\d+)?$/, ...)` to allow negative values)
- [x] ✅ **`origin_warehouse` select pre-population in edit mode**: `defaultValues.origin_warehouse` is a `WarehouseRef` object; extract `.id` as a number when setting `defaultValues` for the form — do not pass the full object as the select value
- [x] ✅ **Warehouse select loading race**: the `origin_warehouse` select in `RouteForm` depends on `useWarehouseList`; render it as disabled with a loading indicator until warehouses are fetched; do not let the user submit before the select is ready
- [x] ✅ **Stops not included in PATCH body**: `update()` service function sends only route fields (`name`, `origin_warehouse`, `status`) — never include `stops` in the PATCH body; stops are managed via `/stops/` sub-resource endpoints
- [x] ✅ **`stops` response is not paginated**: `GET /api/routes/{id}/stops/` returns a plain `RouteStop[]` array, not a `PaginatedResponse` — type `getStops` return as `Promise<RouteStop[]>` and do not attempt to access `.results`
- [x] ✅ **Route detail already includes stops**: `GET /api/routes/{id}/` returns the full `Route` with `stops` embedded — `useRoute` provides stops directly; `useRouteStops` (which calls the separate `/stops/` endpoint) is used only inside `StopsManager` edit mode to refresh after add/remove operations
- [x] ✅ **Route deletion cascades stops**: `ConfirmDialog` on the detail page must clearly state that all stops will be deleted — message: `"This will permanently delete the route and all its stops. This action cannot be undone."`
- [x] ✅ **Stops sorted by `stop_order`**: render stops ascending on both the detail page and in `StopsManager`; do not rely on API insertion order — always sort by `stop_order` in the component before rendering
- [x] ✅ **`useFieldArray` stop order auto-increment**: when the user clicks "Add Stop" in `RouteForm` (create mode), the new stop's `stop_order` default value should be `max(existing stop_orders) + 1`, or `1` if no stops have been added yet — prevents accidental duplicate `stop_order` values at creation time
- [x] ✅ **Empty stops array on create**: if the user creates a route without adding any stops, send the body without the `stops` key (or as `stops: []` — confirm API behavior); do not send `stops: undefined` which may cause serialization issues
- [x] ✅ **404 on detail/edit page**: if `useRoute` returns a 404 error, render `"Route not found"` with a back button instead of crashing — implement in both `app/(dashboard)/routes/[id]/page.tsx` and `app/(dashboard)/routes/[id]/edit/page.tsx`
- [x] ✅ **`id` param coercion**: `useParams` returns strings — always call `Number(id)` before passing to hooks/services that expect `number`
- [x] ✅ **`enabled` flag on queries**: `useRoute` and `useRouteStops` must set `enabled: !!id` / `enabled: !!routeId` to prevent querying with `0` or `NaN`
- [x] ✅ **Pagination reset on filter change**: when `search`, `status`, or `origin_warehouse` filter changes, reset `page` to 1 — all filter change handlers in `RoutesTable` must pass `page: 1`
- [x] ✅ **Search is debounced**: search input must be debounced (300 ms); `status` and `origin_warehouse` selects do NOT need debounce
- [x] ✅ **Double-submit prevention**: submit button in `RouteForm` and "Add Stop" button in `StopsManager` are `disabled` while their respective mutations are `isPending`
- [x] ✅ **Auth**: all API calls go through `@/services/api` Axios instance which automatically attaches `Authorization: Bearer <token>` — do not manually add headers in the service file
- [x] ✅ **`useSearchParams` on list page**: use `router.push` with merged `URLSearchParams` to update filters without full page reload; do NOT use `router.replace`
- [x] ✅ **`origin_warehouse` filter in RoutesTable**: the warehouse select for filtering loads warehouses via `useWarehouseList`; handle loading state gracefully (show placeholder while loading); if warehouse fetch fails show a disabled select
- [x] ✅ **Network error on stop operations**: `useAddStop` and `useRemoveStop` handle network errors in `onError` — no unhandled promise rejections
- [x] ✅ **StatusBadge color mapping**: `active` (green), `inactive` (gray)
- [x] ✅ **Negative coordinates in stops**: latitude/longitude regex `/^-?\d+(\.\d+)?$/` allows negatives in both `RouteForm` and `StopsManager`
