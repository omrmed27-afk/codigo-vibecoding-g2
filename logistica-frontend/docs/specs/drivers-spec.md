# Spec: Drivers Module

**Status:** pending approval
**Generated:** 2026-05-28
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
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new `drivers` block, never remove existing blocks)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

**Sidebar already has a "Drivers" entry** — do NOT modify `Sidebar.tsx`.

---

## Types

- [x] ✅ `types/drivers.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `type DriverStatus = 'available' | 'busy' | 'off_duty'`
  - [x] ✅ `interface UserInfo`:
    - [x] ✅ `id: number`
    - [x] ✅ `username: string`
    - [x] ✅ `email: string`
    - [x] ✅ `first_name: string`
    - [x] ✅ `last_name: string`
  - [x] ✅ `interface Driver` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `user: UserInfo`
    - [x] ✅ `license_number: string` — unique, max 50
    - [x] ✅ `license_expiry: string` — YYYY-MM-DD date string
    - [x] ✅ `phone: string` — max 30
    - [x] ✅ `status: DriverStatus`
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface DriverListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches `user__username`, `user__email`, `license_number`
    - [x] ✅ `status?: DriverStatus`
    - [x] ✅ `ordering?: 'created_at' | '-created_at' | 'status' | '-status'`
  - [x] ✅ `interface CreateDriverBody`:
    - [x] ✅ `username: string` — required, unique
    - [x] ✅ `password: string` — required, min 8 chars
    - [x] ✅ `email: string` — required
    - [x] ✅ `first_name: string` — required
    - [x] ✅ `last_name: string` — required
    - [x] ✅ `license_number: string` — required, unique
    - [x] ✅ `license_expiry: string` — required, YYYY-MM-DD
    - [x] ✅ `phone: string` — required
    - [x] ✅ `status: DriverStatus` — required
  - [x] ✅ `interface UpdateDriverBody` — fields editable via PATCH (no username, no password):
    - [x] ✅ `email?: string`
    - [x] ✅ `first_name?: string`
    - [x] ✅ `last_name?: string`
    - [x] ✅ `license_number?: string`
    - [x] ✅ `license_expiry?: string`
    - [x] ✅ `phone?: string`
    - [x] ✅ `status?: DriverStatus`
  - [x] ✅ No decimal fields in this module — no string-typed numeric fields required

---

## Service Layer

- [x] ✅ `services/drivers.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: DriverListParams): Promise<PaginatedResponse<Driver>>`
  - [x] ✅ Maps params to query string: `page`, `search`, `status`, `ordering`
  - [x] ✅ GET `/api/drivers/`
- [x] ✅ `getById(id: number): Promise<Driver>`
  - [x] ✅ GET `/api/drivers/{id}/`
- [x] ✅ `create(body: CreateDriverBody): Promise<Driver>`
  - [x] ✅ POST `/api/drivers/` — expects 201; also creates Django user automatically
- [x] ✅ `update(id: number, body: UpdateDriverBody): Promise<Driver>`
  - [x] ✅ PATCH `/api/drivers/{id}/` — partial update, expects 200; does NOT accept username or password
- [x] ✅ `remove(id: number): Promise<void>`
  - [x] ✅ DELETE `/api/drivers/{id}/` — expects 204, returns void; also deletes associated Django user

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — APPEND new `drivers` block (do not modify existing `warehouses`, `suppliers`, `customers`, or `products` blocks):
  - [x] ✅ `all: ['drivers']`
  - [x] ✅ `list: (filters: DriverListParams) => ['drivers', 'list', filters]`
  - [x] ✅ `detail: (id: number) => ['drivers', 'detail', id]`
- [x] ✅ Import `DriverListParams` from `@/types/drivers` at the top of `query-keys.ts`

---

## Hooks

- [x] ✅ `hooks/drivers/use-drivers.ts` — single file exporting all hooks for this module
  - [x] ✅ `useDriverList(params: DriverListParams)` — `useQuery`
    - [x] ✅ Uses `queryKeys.drivers.list(params)` as query key
    - [x] ✅ Calls `getList(params)` from `@/services/drivers`
    - [x] ✅ Returns `PaginatedResponse<Driver>` (count, next, previous, results)
  - [x] ✅ `useDriver(id: number)` — `useQuery` for single item
    - [x] ✅ Uses `queryKeys.drivers.detail(id)` as query key
    - [x] ✅ Calls `getById(id)`
    - [x] ✅ Enabled only when `id` is truthy (`enabled: !!id`)
  - [x] ✅ `useCreateDriver()` — `useMutation`
    - [x] ✅ Calls `create(body)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.drivers.all })` + `toast.success('Driver created')`
    - [x] ✅ `onError`: `toast.error` with API `error.response?.data?.error?.message` or fallback `'Failed to create driver'`
  - [x] ✅ `useUpdateDriver()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; body: UpdateDriverBody }`
    - [x] ✅ Calls `update(id, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.drivers.all` + `queryKeys.drivers.detail(id)` + `toast.success('Driver updated')`
    - [x] ✅ `onError`: `toast.error` with API `error.response?.data?.error?.message` or fallback `'Failed to update driver'`
  - [x] ✅ `useDeleteDriver()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `remove(id)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.drivers.all })` + `toast.success('Driver deleted')`
    - [x] ✅ `onError`: `toast.error` with API `error.response?.data?.error?.message` or fallback `'Failed to delete driver'`
  - [x] ✅ All hooks import `toast` from `sonner`
  - [x] ✅ All hooks import `queryKeys` from `@/lib/query-keys`

---

## Pages

### `app/(dashboard)/drivers/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads from `useSearchParams`:
  - [x] ✅ `?page` → `Number(param)` (default `1` when absent)
  - [x] ✅ `?search` → defaults to `''`
  - [x] ✅ `?status` → `'available' | 'busy' | 'off_duty'` or `undefined` when absent
  - [x] ✅ `?ordering` → `'created_at' | '-created_at' | 'status' | '-status'` or `undefined` when absent
- [x] ✅ Builds `DriverListParams` from URL params and passes to `useDriverList`
- [x] ✅ Updates URL params via `router.push` with merged `URLSearchParams` (does NOT use `router.replace`)
- [x] ✅ Renders `PageHeader` with title `"Drivers"` and `"New Driver"` button linking to `/drivers/new`
- [x] ✅ Renders `DriversTable` with data, loading state, params, and `onParamsChange` callback
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading` (delegated to `DataTable` inside `DriversTable`)
- [x] ✅ Empty state: `"No drivers found"` message when `results` is empty and not loading (delegated to `DataTable`)
- [x] ✅ Error state: error message when query fails

### `app/(dashboard)/drivers/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ Renders `PageHeader` with title `"New Driver"` and back button → `/drivers`
- [x] ✅ Renders `DriverForm` in `mode="create"`
- [x] ✅ `onSuccess` callback: `router.push('/drivers')`

### `app/(dashboard)/drivers/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useDriver(Number(id))` for data
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading`
- [x] ✅ Not-found / error state: renders `"Driver not found"` with a back button if query fails or data is undefined
- [x] ✅ Displays all fields in a readable layout:
  - [x] ✅ `user.first_name` + `user.last_name` — displayed prominently as page sub-title or heading
  - [x] ✅ `user.username` — labeled "Username"
  - [x] ✅ `user.email` — labeled "Email"
  - [x] ✅ `license_number` — labeled "License Number"
  - [x] ✅ `license_expiry` — labeled "License Expiry"; formatted as a readable date (e.g. "Jun 15, 2028")
  - [x] ✅ `phone` — labeled "Phone"
  - [x] ✅ `status` — rendered as `StatusBadge`
  - [x] ✅ `created_at` — formatted as readable date/time string
  - [x] ✅ `updated_at` — formatted as readable date/time string
- [x] ✅ Edit button → `/drivers/[id]/edit`
- [x] ✅ Delete button → opens `ConfirmDialog` with warning that deleting the driver also deletes the associated Django user account → on confirm calls `useDeleteDriver().mutate(id)` → on success `router.push('/drivers')`
- [x] ✅ `ConfirmDialog` message: `"This will permanently delete the driver and their associated user account. This action cannot be undone."`

### `app/(dashboard)/drivers/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useDriver(Number(id))` to fetch current data
- [x] ✅ Shows `LoadingSpinner` until data is loaded
- [x] ✅ Renders `PageHeader` with title `"Edit Driver"` and back button → `/drivers/[id]`
- [x] ✅ Renders `DriverForm` in `mode="edit"` with `defaultValues` pre-populated from fetched data
- [x] ✅ `onSuccess` callback: `router.push('/drivers/' + id)`

---

## Components

### `components/drivers/DriversTable.tsx`

- [x] ✅ Props:
  - [x] ✅ `data: PaginatedResponse<Driver> | undefined`
  - [x] ✅ `isLoading: boolean`
  - [x] ✅ `params: DriverListParams`
  - [x] ✅ `onParamsChange: (p: Partial<DriverListParams>) => void` — updates URL params in the parent page
- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Driver>[]`:
  - [x] ✅ Full name (`user.first_name` + `user.last_name`) — clickable link to `/drivers/[id]`
  - [x] ✅ `user.username` — labeled "Username"
  - [x] ✅ `license_number` — labeled "License Number"
  - [x] ✅ `license_expiry` — labeled "License Expiry"; formatted as readable date
  - [x] ✅ `phone`
  - [x] ✅ `status` — rendered as `StatusBadge`
  - [x] ✅ Actions column: View (`/drivers/[id]`), Edit (`/drivers/[id]/edit`), Delete (inline `ConfirmDialog`)
- [x] ✅ Search input:
  - [x] ✅ Controlled by `params.search`
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ search: value, page: 1 })`
  - [x] ✅ Placeholder: `"Search by username, email, license…"`
- [x] ✅ `status` filter:
  - [x] ✅ Shadcn `Select` with options: `"All"` (clears filter), `"Available"`, `"Busy"`, `"Off Duty"`
  - [x] ✅ Calls `onParamsChange({ status: value || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.status`
- [x] ✅ Ordering:
  - [x] ✅ Column headers for `created_at` and `status` are sortable
  - [x] ✅ Clicking toggles `?ordering=created_at` / `?ordering=-created_at` (same for `status`)
  - [x] ✅ Active sort direction shown with icon (▲/▼) in the column header
- [x] ✅ Pagination controls:
  - [x] ✅ Shows current page and total count
  - [x] ✅ Previous / Next buttons
  - [x] ✅ Calls `onParamsChange({ page: newPage })`
  - [x] ✅ Previous disabled on page 1; Next disabled when `next` is `null`
- [x] ✅ Delete per-row: `ConfirmDialog` opens with driver name, warns that deleting also removes the user account, calls `useDeleteDriver` on confirm
- [x] ✅ Loading state: render `LoadingSpinner` or skeleton rows when `isLoading`
- [x] ✅ Empty state: `"No drivers found"` when `data?.results` is empty and not loading

### `components/drivers/DriverForm.tsx`

- [x] ✅ Props:
  - [x] ✅ `mode: 'create' | 'edit'`
  - [x] ✅ `defaultValues?: Driver`
  - [x] ✅ `onSuccess: () => void`
- [x] ✅ Zod schema — two separate schemas for create and edit:
  - [x] ✅ `createDriverSchema`:
    - [x] ✅ `username`: `z.string().min(1, 'Username is required')`
    - [x] ✅ `password`: `z.string().min(8, 'Password must be at least 8 characters')`
    - [x] ✅ `email`: `z.string().min(1, 'Email is required').email('Must be a valid email')`
    - [x] ✅ `first_name`: `z.string().min(1, 'First name is required')`
    - [x] ✅ `last_name`: `z.string().min(1, 'Last name is required')`
    - [x] ✅ `license_number`: `z.string().min(1, 'License number is required').max(50)`
    - [x] ✅ `license_expiry`: `z.string().min(1, 'License expiry is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)')`
    - [x] ✅ `phone`: `z.string().min(1, 'Phone is required').max(30)`
    - [x] ✅ `status`: `z.enum(['available', 'busy', 'off_duty'], { required_error: 'Status is required' })`
  - [x] ✅ `editDriverSchema` — same as `createDriverSchema` but without `username` and `password` fields; all remaining fields are `.optional()` for PATCH
- [x] ✅ Uses `react-hook-form` with `zodResolver`; selects the correct schema based on `mode`
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Fields rendered in `create` mode only (absent in `edit` mode):
  - [x] ✅ `username`: `Input` type="text", placeholder="e.g. jsmith"
  - [x] ✅ `password`: `Input` type="password", placeholder="Min. 8 characters"
- [x] ✅ Fields rendered in both `create` and `edit` modes:
  - [x] ✅ `email`: `Input` type="email", placeholder="e.g. jsmith@example.com"
  - [x] ✅ `first_name`: `Input` type="text", placeholder="e.g. John"
  - [x] ✅ `last_name`: `Input` type="text", placeholder="e.g. Smith"
  - [x] ✅ `license_number`: `Input` type="text", placeholder="e.g. DL-2026-00001"
  - [x] ✅ `license_expiry`: `Input` type="date" — renders a native date picker; value must be in YYYY-MM-DD format compatible with the API
  - [x] ✅ `phone`: `Input` type="tel", placeholder="e.g. +19876543210"
  - [x] ✅ `status`: shadcn `Select` with options `"Available"` (value `available`), `"Busy"` (value `busy`), `"Off Duty"` (value `off_duty`); uses `Controller`-compatible shadcn `FormField`
- [x] ✅ In edit mode: `defaultValues` pre-populates editable fields from the fetched `Driver` object:
  - [x] ✅ `email` ← `defaultValues.user.email`
  - [x] ✅ `first_name` ← `defaultValues.user.first_name`
  - [x] ✅ `last_name` ← `defaultValues.user.last_name`
  - [x] ✅ `license_number` ← `defaultValues.license_number`
  - [x] ✅ `license_expiry` ← `defaultValues.license_expiry`
  - [x] ✅ `phone` ← `defaultValues.phone`
  - [x] ✅ `status` ← `defaultValues.status`
- [x] ✅ On submit:
  - [x] ✅ `mode === 'create'` → calls `useCreateDriver().mutate(body)` with full `CreateDriverBody`
  - [x] ✅ `mode === 'edit'` → calls `useUpdateDriver().mutate({ id, body })` with `UpdateDriverBody` (no username/password)
  - [x] ✅ On mutation success: calls `onSuccess()`
- [x] ✅ API `details` field errors mapped to individual form fields via `form.setError`:
  - [x] ✅ Iterates `error.response?.data?.error?.details` and calls `form.setError(field, { message })` for each key
  - [x] ✅ `username` errors from API mapped to `form.setError('username', { message })` (create mode only)
  - [x] ✅ `license_number` errors from API mapped to `form.setError('license_number', { message })`
  - [x] ✅ Non-field / generic errors handled by `toast.error` in the hook's `onError`
- [x] ✅ Submit button:
  - [x] ✅ Label: `"Create Driver"` in create mode, `"Save Changes"` in edit mode
  - [x] ✅ `disabled={isPending}`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`

---

## Sidebar Navigation

- [x] ✅ `components/layout/Sidebar.tsx` — verify "Drivers" nav item already exists:
  - [x] ✅ Entry with `href: '/drivers'` is already present in the `navItems` array — **no changes needed**
  - [x] ✅ If entry is missing for any reason, add it with an appropriate icon from `lucide-react` (e.g. `Truck` or `User`)

---

## Error & Edge Cases

- [x] ✅ **POST creates Django user**: the API creates a Django user automatically when a driver is created; if `username` is already taken the API returns 400 with `details.username` — must be surfaced via `form.setError('username', { message })`, not just `toast.error`
- [x] ✅ **Duplicate license_number**: POST/PATCH returns 400 with `details.license_number` — must be surfaced via `form.setError('license_number', { message })`
- [x] ✅ **Password minimum length**: Zod enforces `min(8)` client-side; API also validates and returns 400 with `details.password` if the backend rejects it — map to `form.setError('password', { message })`
- [x] ✅ **DELETE also deletes Django user**: `ConfirmDialog` must explicitly warn `"This will permanently delete the driver and their associated user account."` — a generic `"This action cannot be undone."` message alone is insufficient
- [x] ✅ **username/password fields absent in edit mode**: the edit form must not render or submit `username` or `password`; the PATCH endpoint does not accept these fields; sending them would cause an API error
- [x] ✅ **edit mode default value mapping**: `defaultValues.user.email`, `.first_name`, `.last_name` are nested under `user` — these must be explicitly mapped to flat form fields; do not pass the whole `Driver` object as `defaultValues` without flattening
- [x] ✅ **license_expiry date input**: `Input type="date"` returns a string in `YYYY-MM-DD` format — no transformation is needed before sending to the API; Zod regex `^\d{4}-\d{2}-\d{2}$` validates the format
- [x] ✅ **license_expiry past date**: no client-side future-date enforcement is specified; do not add a `refine` to reject past dates — the API does not document this constraint
- [x] ✅ **status filter "All" clears the filter**: selecting "All" in the table filter sends `status: undefined` (not an empty string) to the API
- [x] ✅ **status Select in form**: controlled shadcn `Select`; `z.enum(['available', 'busy', 'off_duty'], { required_error: 'Status is required' })`
- [x] ✅ **Driver with status `busy` is in use**: the API may reject DELETE if the driver is currently assigned to an in-transit transport — `toast.error` must display the API's `message` field
- [x] ✅ **404 on detail/edit page**: if `useDriver` returns a 404 error, render `"Driver not found"` with a back button instead of crashing
- [x] ✅ **Network error**: all mutations handle network errors in `onError` — no unhandled promise rejections
- [x] ✅ **Pagination reset on filter change**: when `search` or `status` filter changes, reset `page` to 1
- [x] ✅ **Double-submit prevention**: Submit button is `disabled` while `isPending` — no duplicate POST/PATCH requests sent
- [x] ✅ **`id` param coercion**: `useParams` returns strings — always call `Number(id)` before passing to hooks/services that expect `number`
- [x] ✅ **`enabled` flag on detail query**: `useDriver` must set `enabled: !!id` to prevent querying with `id = 0` or `NaN`
- [x] ✅ **StatusBadge for driver status**: use consistent, distinct color mapping — `available` (green), `busy` (yellow/amber), `off_duty` (gray); never show the raw underscore string without the badge in the table
- [x] ✅ **Auth**: all API calls go through `@/services/api` Axios instance which automatically attaches `Authorization: Bearer <token>` — do not manually add headers in the service file
- [x] ✅ **`useSearchParams` on list page**: use `router.push` with merged `URLSearchParams` to update filters without full page reload; do NOT use `router.replace` (would break browser back button)
- [x] ✅ **Ordering state reflected in column headers**: active sort direction shown with an icon (▲/▼); toggling the same column reverses direction; clicking a different column resets to ascending
- [x] ✅ **Search is debounced**: search input must be debounced (300 ms) to avoid firing a new API request on every keystroke; `status` Select does NOT need debounce
