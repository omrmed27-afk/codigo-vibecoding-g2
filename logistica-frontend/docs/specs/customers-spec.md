# Spec: Customers Module

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
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new `customers` block, never remove existing `warehouses` or `suppliers` blocks)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

**Sidebar already has "Customers" entry** (`Users` icon, `/customers` href) — do NOT modify `Sidebar.tsx`.

---

## Types

- [x] ✅ `types/customers.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `type CustomerType = 'company' | 'individual'`
  - [x] ✅ `interface Customer` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string` — max 200
    - [x] ✅ `customer_type: CustomerType`
    - [x] ✅ `email: string` — unique
    - [x] ✅ `phone: string` — max 30
    - [x] ✅ `address: string` — max 500
    - [x] ✅ `city: string` — max 100
    - [x] ✅ `country: string` — max 100
    - [x] ✅ `tax_id: string | null` — unique when present
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface CustomerListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches `name`, `email`, `phone`
    - [x] ✅ `customer_type?: CustomerType`
    - [x] ✅ `city?: string`
    - [x] ✅ `country?: string`
    - [x] ✅ `ordering?: 'name' | '-name' | 'created_at' | '-created_at'`
  - [x] ✅ `interface CreateCustomerBody`:
    - [x] ✅ `name: string`
    - [x] ✅ `customer_type: CustomerType`
    - [x] ✅ `email: string`
    - [x] ✅ `phone: string`
    - [x] ✅ `address: string`
    - [x] ✅ `city: string`
    - [x] ✅ `country: string`
    - [x] ✅ `tax_id?: string | null`
  - [x] ✅ `interface UpdateCustomerBody` — same shape as `CreateCustomerBody` but all fields optional (for PATCH)
  - [x] ✅ No decimal fields in this module — no string-typed numeric fields required

---

## Service Layer

- [x] ✅ `services/customers.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: CustomerListParams): Promise<PaginatedResponse<Customer>>`
  - [x] ✅ Maps params to query string: `page`, `search`, `customer_type`, `city`, `country`, `ordering`
  - [x] ✅ GET `/api/customers/`
- [x] ✅ `getById(id: number): Promise<Customer>`
  - [x] ✅ GET `/api/customers/{id}/`
- [x] ✅ `create(body: CreateCustomerBody): Promise<Customer>`
  - [x] ✅ POST `/api/customers/` — expects 201
- [x] ✅ `update(id: number, body: UpdateCustomerBody): Promise<Customer>`
  - [x] ✅ PATCH `/api/customers/{id}/` — partial update, expects 200
- [x] ✅ `remove(id: number): Promise<void>`
  - [x] ✅ DELETE `/api/customers/{id}/` — expects 204, returns void

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — APPEND new `customers` block (do not modify existing `warehouses` or `suppliers` blocks):
  - [x] ✅ `all: ['customers']`
  - [x] ✅ `list: (filters: CustomerListParams) => ['customers', 'list', filters]`
  - [x] ✅ `detail: (id: number) => ['customers', 'detail', id]`
- [x] ✅ Import `CustomerListParams` from `@/types/customers` at the top of `query-keys.ts`

---

## Hooks

- [x] ✅ `hooks/customers/use-customers.ts` — single file exporting all hooks for this module
  - [x] ✅ `useCustomerList(params: CustomerListParams)` — `useQuery`
    - [x] ✅ Uses `queryKeys.customers.list(params)` as query key
    - [x] ✅ Calls `getList(params)` from `@/services/customers`
    - [x] ✅ Returns `PaginatedResponse<Customer>` (count, next, previous, results)
  - [x] ✅ `useCustomer(id: number)` — `useQuery` for single item
    - [x] ✅ Uses `queryKeys.customers.detail(id)` as query key
    - [x] ✅ Calls `getById(id)`
    - [x] ✅ Enabled only when `id` is truthy (`enabled: !!id`)
  - [x] ✅ `useCreateCustomer()` — `useMutation`
    - [x] ✅ Calls `create(body)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.customers.all })` + `toast.success('Customer created')`
    - [x] ✅ `onError`: `toast.error` with fallback `'Failed to create customer'`
  - [x] ✅ `useUpdateCustomer()` — `useMutation`
    - [x] ✅ Mutation variable: `{ id: number; body: UpdateCustomerBody }`
    - [x] ✅ Calls `update(id, body)`
    - [x] ✅ `onSuccess`: invalidates `queryKeys.customers.all` + `queryKeys.customers.detail(id)` + `toast.success('Customer updated')`
    - [x] ✅ `onError`: `toast.error` with fallback `'Failed to update customer'`
  - [x] ✅ `useDeleteCustomer()` — `useMutation`
    - [x] ✅ Mutation variable: `id: number`
    - [x] ✅ Calls `remove(id)`
    - [x] ✅ `onSuccess`: `invalidateQueries({ queryKey: queryKeys.customers.all })` + `toast.success('Customer deleted')`
    - [x] ✅ `onError`: `toast.error` with fallback `'Failed to delete customer'`
  - [x] ✅ All hooks import `toast` from `sonner`
  - [x] ✅ All hooks import `queryKeys` from `@/lib/query-keys`

---

## Pages

### `app/(dashboard)/customers/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads from `useSearchParams`:
  - [x] ✅ `?page` → `Number(param)` (default `1` when absent)
  - [x] ✅ `?search` → defaults to `''`
  - [x] ✅ `?customer_type` → `'company' | 'individual'` or `undefined` when absent
  - [x] ✅ `?city` → defaults to `''`
  - [x] ✅ `?country` → defaults to `''`
  - [x] ✅ `?ordering` → `'name' | '-name' | 'created_at' | '-created_at'` (default undefined)
- [x] ✅ Builds `CustomerListParams` from URL params and passes to `useCustomerList`
- [x] ✅ Updates URL params via `router.push` with merged `URLSearchParams` (does NOT use `router.replace`)
- [x] ✅ Renders `PageHeader` with title `"Customers"` and `"New Customer"` button linking to `/customers/new`
- [x] ✅ Renders `CustomersTable` with data, loading state, params, and `onParamsChange` callback
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading` (delegated to `DataTable` inside `CustomersTable`)
- [x] ✅ Empty state: `"No customers found"` message when `results` is empty and not loading (delegated to `DataTable`)
- [x] ✅ Error state: error message when query fails

### `app/(dashboard)/customers/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ Renders `PageHeader` with title `"New Customer"` and back button → `/customers`
- [x] ✅ Renders `CustomerForm` in `mode="create"`
- [x] ✅ `onSuccess` callback: `router.push('/customers')`

### `app/(dashboard)/customers/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useCustomer(Number(id))` for data
- [x] ✅ Loading state: `LoadingSpinner` while `isLoading`
- [x] ✅ Not-found / error state: renders `"Customer not found"` with a back button if query fails or data is undefined
- [x] ✅ Displays all fields in a readable layout:
  - [x] ✅ `name` — displayed prominently as page sub-title or heading
  - [x] ✅ `customer_type` — rendered as `StatusBadge` (`company` → blue or neutral; `individual` → green or purple)
  - [x] ✅ `email` — labeled "Email"
  - [x] ✅ `phone` — labeled "Phone"
  - [x] ✅ `address` — labeled "Address"
  - [x] ✅ `city` — labeled "City"
  - [x] ✅ `country` — labeled "Country"
  - [x] ✅ `tax_id` — labeled "Tax ID"; show `"—"` (em dash) when `null`
  - [x] ✅ `created_at` — formatted as readable date/time string
  - [x] ✅ `updated_at` — formatted as readable date/time string
- [x] ✅ Edit button → `/customers/[id]/edit`
- [x] ✅ Delete button → opens `ConfirmDialog` → on confirm calls `useDeleteCustomer().mutate(id)` → on success `router.push('/customers')`
- [x] ✅ `ConfirmDialog` message warns: `"This action cannot be undone."`

### `app/(dashboard)/customers/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `id` from route params via `useParams`
- [x] ✅ Calls `useCustomer(Number(id))` to fetch current data
- [x] ✅ Shows `LoadingSpinner` until data is loaded
- [x] ✅ Renders `PageHeader` with title `"Edit Customer"` and back button → `/customers/[id]`
- [x] ✅ Renders `CustomerForm` in `mode="edit"` with `defaultValues` pre-populated from fetched data
- [x] ✅ `onSuccess` callback: `router.push('/customers/' + id)`

---

## Components

### `components/customers/CustomersTable.tsx`

- [x] ✅ Props:
  - [x] ✅ `data: PaginatedResponse<Customer> | undefined`
  - [x] ✅ `isLoading: boolean`
  - [x] ✅ `params: CustomerListParams`
  - [x] ✅ `onParamsChange: (p: Partial<CustomerListParams>) => void` — updates URL params in the parent page
- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Customer>[]`:
  - [x] ✅ `name` — clickable link to `/customers/[id]`
  - [x] ✅ `customer_type` — rendered as `StatusBadge`
  - [x] ✅ `email`
  - [x] ✅ `phone`
  - [x] ✅ `city`
  - [x] ✅ `country`
  - [x] ✅ Actions column: View (`/customers/[id]`), Edit (`/customers/[id]/edit`), Delete (inline `ConfirmDialog`)
- [x] ✅ Search input:
  - [x] ✅ Controlled by `params.search`
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ search: value, page: 1 })`
  - [x] ✅ Placeholder: `"Search by name, email, phone…"`
- [x] ✅ `customer_type` filter:
  - [x] ✅ Shadcn `Select` with options: `"All"` (clears filter), `"Company"`, `"Individual"`
  - [x] ✅ Calls `onParamsChange({ customer_type: value || undefined, page: 1 })` on change
  - [x] ✅ Controlled by `params.customer_type`
- [x] ✅ `city` filter:
  - [x] ✅ Text input (free-form — API does not provide enum)
  - [x] ✅ Debounced (300 ms) before calling `onParamsChange({ city: value, page: 1 })`
- [x] ✅ `country` filter:
  - [x] ✅ Text input (free-form — API does not provide enum)
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
- [x] ✅ Delete per-row: `ConfirmDialog` opens with customer name, calls `useDeleteCustomer` on confirm
- [x] ✅ Loading state: render `LoadingSpinner` or skeleton rows when `isLoading`
- [x] ✅ Empty state: `"No customers found"` when `data?.results` is empty and not loading

### `components/customers/CustomerForm.tsx`

- [x] ✅ Props:
  - [x] ✅ `mode: 'create' | 'edit'`
  - [x] ✅ `defaultValues?: Customer`
  - [x] ✅ `onSuccess: () => void`
- [x] ✅ Zod schema (`customerSchema`):
  - [x] ✅ `name`: `z.string().min(1, 'Name is required').max(200)`
  - [x] ✅ `customer_type`: `z.enum(['company', 'individual'], { required_error: 'Customer type is required' })`
  - [x] ✅ `email`: `z.string().min(1, 'Email is required').email('Must be a valid email')`
  - [x] ✅ `phone`: `z.string().min(1, 'Phone is required').max(30)`
  - [x] ✅ `address`: `z.string().min(1, 'Address is required').max(500)`
  - [x] ✅ `city`: `z.string().min(1, 'City is required').max(100)`
  - [x] ✅ `country`: `z.string().min(1, 'Country is required').max(100)`
  - [x] ✅ `tax_id`: `z.string().max(100).optional().nullable()` — optional field; empty string sent as `null`
- [x] ✅ Uses `react-hook-form` with `zodResolver`
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Fields:
  - [x] ✅ `name`: `Input` type="text", placeholder="e.g. Acme Corp"
  - [x] ✅ `customer_type`: shadcn `Select` with options `"Company"` (value `company`) and `"Individual"` (value `individual`); uses `Controller`-compatible shadcn `FormField`
  - [x] ✅ `email`: `Input` type="email", placeholder="e.g. contact@acme.com"
  - [x] ✅ `phone`: `Input` type="tel", placeholder="e.g. +1234567890"
  - [x] ✅ `address`: `Input` type="text", placeholder="e.g. 123 Main St"
  - [x] ✅ `city`: `Input` type="text", placeholder="e.g. New York"
  - [x] ✅ `country`: `Input` type="text", placeholder="e.g. USA"
  - [x] ✅ `tax_id`: `Input` type="text", placeholder="e.g. US12345678" — optional, labeled "Tax ID (optional)"
- [x] ✅ In edit mode: `defaultValues` pre-populates all fields from the fetched `Customer` object; `tax_id` renders as `''` (empty string) when `null` so the input is not uncontrolled
- [x] ✅ On submit:
  - [x] ✅ Transforms empty `tax_id` string to `null` before sending to API
  - [x] ✅ `mode === 'create'` → calls `useCreateCustomer().mutate(body)`
  - [x] ✅ `mode === 'edit'` → calls `useUpdateCustomer().mutate({ id, body })`
  - [x] ✅ On mutation success: calls `onSuccess()`
- [x] ✅ API `details` field errors mapped to individual form fields via `form.setError`:
  - [x] ✅ Iterates `error.response?.data?.error?.details` and calls `form.setError(field, { message })` for each key
  - [x] ✅ Non-field / generic errors handled by `toast.error` in the hook's `onError`
- [x] ✅ Submit button:
  - [x] ✅ Label: `"Create Customer"` in create mode, `"Save Changes"` in edit mode
  - [x] ✅ `disabled={isPending}`
  - [x] ✅ Shows `LoadingSpinner` inline when `isPending`

---

## Sidebar Navigation

- [x] ✅ `components/layout/Sidebar.tsx` — verify "Customers" nav item already exists:
  - [x] ✅ Entry `{ label: 'Customers', href: '/customers', icon: Users }` is already present in the `navItems` array — **no changes needed**
  - [x] ✅ If entry is missing for any reason, add it with `Users` icon from `lucide-react`

---

## Error & Edge Cases

- [x] ✅ **Duplicate email**: POST/PATCH returns 400 with `details.email` — must be surfaced via `form.setError('email', { message })`, not just `toast.error`
- [x] ✅ **Duplicate tax_id**: POST/PATCH returns 400 with `details.tax_id` — must be surfaced via `form.setError('tax_id', { message })`
- [x] ✅ **tax_id is optional**: form allows empty `tax_id`; empty string must be converted to `null` before sending to API (not sent as `""`)
- [x] ✅ **tax_id renders as `""` in edit mode when null**: `defaultValues` must map `tax_id: null` → `tax_id: ''` so the Input stays controlled
- [x] ✅ **customer_type Select**: must be a controlled shadcn `Select`, not a plain HTML `<select>`; Zod `z.enum` validates the value; form cannot be submitted without selecting a type
- [x] ✅ **customer_type filter "All" clears the filter**: selecting "All" in the table filter sends `customer_type: undefined` (not an empty string) to the API
- [x] ✅ **Email format validation**: Zod `z.string().email()` runs client-side before the API is called — prevents unnecessary network requests
- [x] ✅ **Phone field is text, not numeric**: `Input type="tel"` — accept any phone format; no Zod numeric validation
- [x] ✅ **DELETE on customer referenced by Shipments**: API may return 400/409 if the customer has linked Shipments — `toast.error` must display the API's `message` field, not a generic string
- [x] ✅ **404 on detail/edit page**: if `useCustomer` returns a 404 error, render `"Customer not found"` with a back button instead of crashing
- [x] ✅ **Network error**: all mutations handle network errors in `onError` — no unhandled promise rejections
- [x] ✅ **Pagination reset on filter change**: when `search`, `customer_type`, `city`, or `country` filter changes, reset `page` to 1
- [x] ✅ **Ordering state reflected in column headers**: active sort direction shown with an icon (▲/▼); toggling the same column reverses direction; clicking a different column resets to ascending
- [x] ✅ **Double-submit prevention**: Submit button is `disabled` while `isPending` — no duplicate POST/PATCH requests sent
- [x] ✅ **Form reset in create mode**: after successful creation the form is NOT shown again (page navigates away via `onSuccess`) — no manual `form.reset()` needed
- [x] ✅ **Edit form pre-population**: all fields must match the API response exactly; no field should render as `"null"` or `"undefined"` string
- [x] ✅ **`useSearchParams` on list page**: use `router.push` with merged `URLSearchParams` to update filters without full page reload; do NOT use `router.replace` (would break browser back button)
- [x] ✅ **Auth**: all API calls go through `@/services/api` Axios instance which automatically attaches `Authorization: Bearer <token>` — do not manually add headers in the service file
- [x] ✅ **`city` / `country` filters are freeform text inputs**: do not use Select dropdowns since the API does not provide an enum or a distinct values endpoint for these fields
- [x] ✅ **Debounce on text filter inputs**: search, city, and country filter inputs must be debounced (300 ms) to avoid firing a new API request on every keystroke; `customer_type` Select does NOT need debounce (immediate change is expected)
- [x] ✅ **`id` param coercion**: `useParams` returns strings — always call `Number(id)` before passing to hooks/services that expect `number`
- [x] ✅ **`enabled` flag on detail query**: `useCustomer` must set `enabled: !!id` to prevent querying with `id = 0` or `NaN`
- [x] ✅ **StatusBadge for customer_type**: use consistent color mapping — `company` and `individual` must each have a distinct, readable badge color; never show the raw string without the badge in the table
