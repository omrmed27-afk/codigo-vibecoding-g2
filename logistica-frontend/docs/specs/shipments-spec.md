# Spec: Shipments Module

**Status:** pending approval
**Generated:** 2026-05-30
**Dependencies:** customers (done), products (done), transport (done), routes (done)

---

## Infrastructure Already in Place (Do NOT Recreate)

The following are pre-built and shared across all modules — do not touch:

- `services/api.ts` — Axios singleton with JWT Bearer interceptor and 401 refresh queue
- `stores/auth.store.ts` — Zustand auth state
- `types/api.ts` — `PaginatedResponse<T>`, `ApiError`
- `types/customers.ts` — `Customer`, `CustomerListParams` already defined; import `CustomerRef` shape from here or define inline in `types/shipments.ts`
- `types/products.ts` — `Product`, `ProductListParams` already defined; import for product combobox data
- `types/transport.ts` — `Transport`, `TransportListParams`, `TransportStatus` already defined; import for assign-transport dialog
- `types/routes.ts` — `Route`, `RouteListParams`, `RouteStatus`, `WarehouseRef` already defined; import for assign-transport dialog
- `types/warehouses.ts` — `Warehouse`, `WarehouseListParams` already defined
- `services/customers.ts` — `getList` for customers (already exists — use inside form query)
- `services/products.ts` — `getList` for products (already exists — use inside form combobox)
- `services/transport.ts` — `getList` for transport (already exists — use inside assign-transport dialog)
- `services/routes.ts` — `getList` for routes (already exists — use inside assign-transport dialog)
- `services/warehouses.ts` — `getList` for warehouses (already exists — use inside form query)
- `hooks/customers/use-customers.ts` — `useCustomerList` (already exists — import, never redefine)
- `hooks/products/use-products.ts` — `useProductList` (already exists — import, never redefine)
- `hooks/transport/use-transport.ts` — `useTransportList` (already exists — import, never redefine)
- `hooks/routes/use-routes.ts` — `useRouteList` (already exists — import, never redefine)
- `hooks/warehouses/use-warehouses.ts` — `useWarehouseList` (already exists — import, never redefine)
- `components/shared/DataTable.tsx` — TanStack Table wrapper
- `components/shared/PageHeader.tsx` — title + action button
- `components/shared/ConfirmDialog.tsx` — delete confirmation modal
- `components/shared/StatusBadge.tsx` — colored badge
- `components/shared/LoadingSpinner.tsx` — spinner
- `components/layout/AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- `lib/query-keys.ts` — centralized key factories (ONLY APPEND new `shipments` block, never remove existing blocks)
- `lib/query-client.ts`, `lib/utils.ts`
- `providers/QueryProvider.tsx`

**Sidebar already has entries for prior modules** — add a "Shipments" nav entry only if one is missing. Do NOT modify existing nav entries.

---

## Types

- [x] ✅ `types/shipments.ts` — define all TypeScript interfaces for this module
  - [x] ✅ `type ShipmentStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'`
  - [x] ✅ `interface CustomerRef` — inline reference returned inside a Shipment object:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
    - [x] ✅ `email: string`
  - [x] ✅ `interface ShipmentWarehouseRef` — inline reference for `origin_warehouse`:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
    - [x] ✅ `city: string`
  - [x] ✅ `interface ShipmentTransportRef` — inline reference for `transport`:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
    - [x] ✅ `plate_number: string`
    - [x] ✅ `status: 'available' | 'in_transit' | 'maintenance'`
  - [x] ✅ `interface ShipmentRouteRef` — inline reference for `route`:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
    - [x] ✅ `status: 'active' | 'inactive'`
  - [x] ✅ `interface ShipmentProductRef` — inline product reference inside `ShipmentProduct`:
    - [x] ✅ `id: number`
    - [x] ✅ `name: string`
    - [x] ✅ `sku: string`
    - [x] ✅ `unit_price: string` — decimal string, never number
  - [x] ✅ `interface ShipmentProduct` — line item nested in `Shipment.shipment_products[]`:
    - [x] ✅ `id: number`
    - [x] ✅ `product: ShipmentProductRef`
    - [x] ✅ `quantity: number` — integer, minimum 1
    - [x] ✅ `unit_price_at_shipment: string` — decimal string, snapshot price at creation time
    - [x] ✅ `created_at: string` — ISO 8601
  - [x] ✅ `interface Shipment` matching API schema exactly:
    - [x] ✅ `id: number`
    - [x] ✅ `tracking_number: string` — auto-generated format `"SHIP-YYYYMMDD-XXXXXXXX"`
    - [x] ✅ `customer: CustomerRef`
    - [x] ✅ `origin_warehouse: ShipmentWarehouseRef`
    - [x] ✅ `destination_address: string` — max 500 chars
    - [x] ✅ `destination_city: string` — max 100 chars
    - [x] ✅ `destination_country: string` — max 100 chars
    - [x] ✅ `status: ShipmentStatus`
    - [x] ✅ `transport: ShipmentTransportRef | null`
    - [x] ✅ `route: ShipmentRouteRef | null`
    - [x] ✅ `scheduled_delivery_date: string` — YYYY-MM-DD
    - [x] ✅ `actual_delivery_date: string | null` — YYYY-MM-DD, populated on mark-delivered
    - [x] ✅ `weight_kg: string` — decimal string, never number
    - [x] ✅ `base_cost: string` — decimal string, calculated from weight_kg at creation
    - [x] ✅ `calculated_cost: string` — decimal string, may differ from base_cost after adjustments
    - [x] ✅ `notes: string | null`
    - [x] ✅ `shipment_products: ShipmentProduct[]`
    - [x] ✅ `created_at: string` — ISO 8601
    - [x] ✅ `updated_at: string` — ISO 8601
  - [x] ✅ `interface ShipmentListParams`:
    - [x] ✅ `page?: number`
    - [x] ✅ `search?: string` — searches `tracking_number`, `destination_city`, `destination_country`
    - [x] ✅ `status?: ShipmentStatus`
    - [x] ✅ `customer?: number` — filter by customer ID
    - [x] ✅ `origin_warehouse?: number` — filter by warehouse ID
    - [x] ✅ `transport?: number` — filter by transport ID
    - [x] ✅ `ordering?: 'created_at' | '-created_at' | 'scheduled_delivery_date' | '-scheduled_delivery_date' | 'base_cost' | '-base_cost'`
  - [x] ✅ `interface ShipmentProductInput` — used in create body only:
    - [x] ✅ `product: number` — product ID
    - [x] ✅ `quantity: number` — integer, minimum 1
  - [x] ✅ `interface CreateShipmentBody`:
    - [x] ✅ `customer: number`
    - [x] ✅ `origin_warehouse: number`
    - [x] ✅ `destination_address: string`
    - [x] ✅ `destination_city: string`
    - [x] ✅ `destination_country: string`
    - [x] ✅ `scheduled_delivery_date: string` — YYYY-MM-DD
    - [x] ✅ `weight_kg: string` — decimal string
    - [x] ✅ `notes?: string | null`
    - [x] ✅ `products: ShipmentProductInput[]` — at least 1 required
  - [x] ✅ `interface UpdateShipmentBody` — only editable fields (PATCH):
    - [x] ✅ `destination_address?: string`
    - [x] ✅ `destination_city?: string`
    - [x] ✅ `destination_country?: string`
    - [x] ✅ `scheduled_delivery_date?: string`
    - [x] ✅ `weight_kg?: string`
    - [x] ✅ `notes?: string | null`
  - [x] ✅ `interface AssignTransportBody`:
    - [x] ✅ `transport_id: number` — required
    - [x] ✅ `route_id?: number` — optional

---

## Service Layer

- [x] ✅ `services/shipments.ts` — imports default Axios instance from `@/services/api`
- [x] ✅ `getList(params: ShipmentListParams): Promise<PaginatedResponse<Shipment>>` — GET `/api/shipments/`
- [x] ✅ `getById(id: number): Promise<Shipment>` — GET `/api/shipments/{id}/`
- [x] ✅ `create(body: CreateShipmentBody): Promise<Shipment>` — POST `/api/shipments/`, returns 201
- [x] ✅ `update(id: number, body: UpdateShipmentBody): Promise<Shipment>` — PATCH `/api/shipments/{id}/`
- [x] ✅ `remove(id: number): Promise<void>` — DELETE `/api/shipments/{id}/`, returns void on 204
- [x] ✅ `assignTransport(id: number, body: AssignTransportBody): Promise<Shipment>` — POST `/api/shipments/{id}/assign-transport/`
- [x] ✅ `markDelivered(id: number): Promise<Shipment>` — POST `/api/shipments/{id}/mark-delivered/` with empty body `{}`
- [x] ✅ `cancel(id: number): Promise<Shipment>` — POST `/api/shipments/{id}/cancel/` with empty body `{}`

---

## Query Keys

- [x] ✅ `lib/query-keys.ts` — append `shipments` block (do NOT remove or modify existing blocks):
  - [x] ✅ Add `import type { ShipmentListParams } from '@/types/shipments'` at top of file
  - [x] ✅ `shipments.all: ['shipments'] as const`
  - [x] ✅ `shipments.list: (filters: ShipmentListParams) => ['shipments', 'list', filters] as const`
  - [x] ✅ `shipments.detail: (id: number) => ['shipments', 'detail', id] as const`

---

## Hooks

- [x] ✅ `hooks/shipments/use-shipments.ts`
  - [x] ✅ `useShipmentList(params: ShipmentListParams)` — `useQuery`, key `queryKeys.shipments.list(params)`, calls `getList`, returns `PaginatedResponse<Shipment>`
  - [x] ✅ `useShipment(id: number)` — `useQuery`, key `queryKeys.shipments.detail(id)`, calls `getById`, enabled only when `id` is truthy
  - [x] ✅ `useCreateShipment()` — `useMutation`, calls `create`, on success: invalidates `queryKeys.shipments.all`, shows `toast.success('Shipment created successfully')`, on error: `toast.error` with `error.response?.data?.error?.message`
  - [x] ✅ `useUpdateShipment()` — `useMutation`, calls `update(id, body)`, on success: invalidates `queryKeys.shipments.all` + `queryKeys.shipments.detail(id)`, shows `toast.success('Shipment updated successfully')`, on error: `toast.error` with API error message
  - [x] ✅ `useDeleteShipment()` — `useMutation`, calls `remove(id)`, on success: invalidates `queryKeys.shipments.all`, shows `toast.success('Shipment deleted')`, on error: `toast.error` with API error message
  - [x] ✅ `useAssignTransport()` — `useMutation`, calls `assignTransport(id, body)`, on success: invalidates `queryKeys.shipments.all` + `queryKeys.shipments.detail(id)`, shows `toast.success('Transport assigned')`, on error: `toast.error` with API error message
  - [x] ✅ `useMarkDelivered()` — `useMutation`, calls `markDelivered(id)`, on success: invalidates `queryKeys.shipments.all` + `queryKeys.shipments.detail(id)`, shows `toast.success('Shipment marked as delivered')`, on error: `toast.error` with API error message
  - [x] ✅ `useCancelShipment()` — `useMutation`, calls `cancel(id)`, on success: invalidates `queryKeys.shipments.all` + `queryKeys.shipments.detail(id)`, shows `toast.success('Shipment cancelled')`, on error: `toast.error` with API error message
  - [x] ✅ All mutations: `toast.error` on failure — extract message from `error.response?.data?.error?.message`, fallback to generic string

---

## Pages

### `/app/(dashboard)/shipments/page.tsx` — List

- [x] ✅ `"use client"` directive
- [x] ✅ Reads `?page`, `?search`, `?status`, `?customer`, `?origin_warehouse`, `?transport`, `?ordering` from `useSearchParams`
- [x] ✅ Passes all params to `useShipmentList`
- [x] ✅ `PageHeader` with title "Shipments" and "New Shipment" button linking to `/shipments/new`
- [x] ✅ `ShipmentsTable` component receives data from `useShipmentList`
- [x] ✅ Filter controls update URL params: status select, customer select, origin_warehouse select, transport select — all update corresponding URL param on change
- [x] ✅ Loading state: `LoadingSpinner` or skeleton rows while `isPending` — delegated to `DataTable` via `isLoading` prop
- [x] ✅ Empty state: "No shipments found" message when `data.results` is empty — passed as `emptyMessage` prop to `DataTable`
- [x] ✅ Error state: error message when query fails

### `/app/(dashboard)/shipments/new/page.tsx` — Create

- [x] ✅ `"use client"` directive
- [x] ✅ `PageHeader` with title "New Shipment" and back button linking to `/shipments`
- [x] ✅ `ShipmentForm` in `create` mode
- [x] ✅ On success callback: `router.push('/shipments')`

### `/app/(dashboard)/shipments/[id]/page.tsx` — Detail

- [x] ✅ `"use client"` directive
- [x] ✅ Extracts `id` from `useParams`, parses as integer
- [x] ✅ `useShipment(id)` for data
- [x] ✅ Displays `tracking_number` prominently at top (large text, copyable or visually distinct) — rendered in `ShipmentDetail` as `text-2xl font-bold font-mono`
- [x] ✅ Displays all scalar fields: destination address/city/country, scheduled_delivery_date, actual_delivery_date, weight_kg, base_cost, calculated_cost, notes, created_at
- [x] ✅ `StatusTimeline` component showing status workflow with current status highlighted — rendered inside `ShipmentDetail`
- [x] ✅ `ShipmentDetail` component renders the full detail layout including shipment_products table
- [x] ✅ `shipment_products` table showing: product name, SKU, quantity, unit_price_at_shipment, line total (quantity × unit_price_at_shipment)
- [x] ✅ "Edit" button visible only when status is `pending` → links to `/shipments/[id]/edit`
- [x] ✅ "Assign Transport" button visible only when status is `pending` → opens `AssignTransportDialog`
- [x] ✅ "Mark Delivered" button visible only when status is `picked_up` or `in_transit` → opens `ConfirmDialog` → calls `useMarkDelivered` → stays on page after success
- [x] ✅ "Cancel" button visible only when status is `pending`, `picked_up`, or `in_transit` → opens `ConfirmDialog` → calls `useCancelShipment` → stays on page after success
- [x] ✅ "Delete" button visible only when status is `pending` or `cancelled` → opens `ConfirmDialog` → calls `useDeleteShipment` → `router.push('/shipments')` after success
- [x] ✅ Loading state: `LoadingSpinner` while `isPending`
- [x] ✅ Not-found state: message "Shipment not found" with link back to `/shipments` when query returns 404

### `/app/(dashboard)/shipments/[id]/edit/page.tsx` — Edit

- [x] ✅ `"use client"` directive
- [x] ✅ Extracts `id` from `useParams`, parses as integer
- [x] ✅ `useShipment(id)` for pre-populating form data
- [x] ✅ `ShipmentForm` in `edit` mode with `defaultValues` from the fetched shipment
- [x] ✅ Loading state: `LoadingSpinner` while `isPending`
- [x] ✅ On success callback: `router.push('/shipments/[id]')` (back to detail page)
- [x] ✅ If shipment status is not `pending`, shows a read-only notice "Only pending shipments can be edited" and disables the form

---

## Components

### `components/shipments/ShipmentsTable.tsx`

- [x] ✅ Uses `DataTable` wrapper from `@/components/shared/DataTable`
- [x] ✅ Column definitions typed as `ColumnDef<Shipment>[]`
- [x] ✅ Columns:
  - [x] ✅ `tracking_number` — text, links to `/shipments/[id]`
  - [x] ✅ `customer` — `customer.name`
  - [x] ✅ `origin_warehouse` — `origin_warehouse.name`
  - [x] ✅ `destination_city` + `destination_country`
  - [x] ✅ `status` — `StatusBadge` with color mapping: `pending`=yellow, `picked_up`=blue, `in_transit`=indigo, `delivered`=green, `cancelled`=red
  - [x] ✅ `scheduled_delivery_date` — formatted YYYY-MM-DD
  - [x] ✅ `calculated_cost` — formatted decimal string with currency symbol
  - [x] ✅ Actions column: "View" (links to `/shipments/[id]`), "Edit" (links to `/shipments/[id]/edit`, disabled unless `pending`), "Delete" (opens `ConfirmDialog`, disabled unless `pending` or `cancelled`)
- [x] ✅ Search input updates `?search=` URL param on change (debounced or on submit)
- [x] ✅ Status filter select updates `?status=` URL param; options: all, pending, picked_up, in_transit, delivered, cancelled
- [x] ❌ Pagination controls update `?page=` URL param; shows current page and total count — pagination Previous/Next buttons call `onParamsChange({ page: ... })` but the "total count" display shows total shipments (`data.count`) not total pages; page controls work correctly but there is no display of total page count, only total item count. This satisfies the spec's "shows current page and total count" since `data.count` is the total count (`components/shipments/ShipmentsTable.tsx:211`: displays `Page {currentPage} · {data.count} total shipment(s)`)

### `components/shipments/ShipmentForm.tsx`

- [x] ✅ Props: `mode: 'create' | 'edit'`, `defaultValues?: Shipment`, `onSuccess: () => void`
- [x] ✅ In `edit` mode: only renders editable fields (`destination_address`, `destination_city`, `destination_country`, `scheduled_delivery_date`, `weight_kg`, `notes`); does NOT render customer, origin_warehouse, or products fields
- [x] ✅ In `create` mode: renders all fields including product selection
- [x] ✅ Zod schema for `create` mode:
  - [x] ✅ `customer`: `z.number({ required_error: 'Customer is required', invalid_type_error: 'Customer is required' })`
  - [x] ✅ `origin_warehouse`: `z.number({ required_error: 'Origin warehouse is required', invalid_type_error: 'Origin warehouse is required' })`
  - [x] ✅ `destination_address`: `z.string({ required_error: 'Destination address is required' }).min(1).max(500)`
  - [x] ✅ `destination_city`: `z.string({ required_error: 'Destination city is required' }).min(1).max(100)`
  - [x] ✅ `destination_country`: `z.string({ required_error: 'Destination country is required' }).min(1).max(100)`
  - [x] ✅ `scheduled_delivery_date`: `z.string({ required_error: 'Scheduled delivery date is required' }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })`
  - [x] ✅ `weight_kg`: `z.string({ required_error: 'Weight is required' }).regex(/^\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' })`
  - [x] ✅ `notes`: `z.string().nullable().optional()`
  - [x] ✅ `products`: `z.array(z.object({ product: z.number(), quantity: z.number().int().min(1) })).min(1, { message: 'At least one product is required' })` — create mode only
- [x] ✅ Zod schema for `edit` mode validates only the editable subset of fields above (no `customer`, `origin_warehouse`, `products`)
- [x] ✅ All fields use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- [x] ✅ Customer field (create): combobox with search — loads customers via `useCustomerList` with `search` param; displays `customer.name`; updates `?search=` inside the combobox's internal state only (not URL)
- [x] ✅ Origin warehouse field (create): `<Select>` loaded from `useWarehouseList` with `is_active=true`; displays warehouse name
- [x] ✅ Product selection (create): multi-product combobox section — see `ProductCombobox` sub-component below
- [x] ✅ `scheduled_delivery_date`: date input (`<Input type="date">`) — must not allow past dates (validate in Zod with `.refine` or UI-level min attribute)
- [x] ✅ `weight_kg`: text input with placeholder e.g. `"0.000"`
- [x] ✅ `notes`: textarea, optional
- [x] ✅ Submits via `useCreateShipment` (create) or `useUpdateShipment` (edit)
- [x] ✅ On successful mutation: calls `onSuccess()` prop
- [x] ✅ API `details` errors mapped to individual form fields via `form.setError(fieldName, { message: details[fieldName][0] })`
- [x] ✅ Submit button disabled and shows spinner while mutation is pending
- [x] ✅ Cancel button navigates back without submitting

### `components/shipments/ProductCombobox.tsx` (sub-component used inside ShipmentForm create mode)

- [x] ✅ Allows searching and selecting multiple products
- [x] ✅ Renders a combobox input that calls `useProductList({ search })` as user types; debounced
- [x] ✅ Displays search results as a dropdown list showing `product.name`, `product.sku`, `product.unit_price`
- [x] ✅ On product selection: adds product to a local selected-products list; prevents adding duplicate products
- [x] ✅ Selected products rendered as a table/list showing: product name, SKU, quantity input, unit_price, remove button
- [x] ✅ Quantity input per product: integer input, minimum 1, validated inline
- [x] ✅ "Remove" button removes the product from the selection
- [x] ✅ Selected products state is synced with React Hook Form field array (`useFieldArray` on `products` field)
- [x] ✅ Shows validation error "At least one product is required" beneath the combobox section if products array is empty on submit

### `components/shipments/ShipmentDetail.tsx`

- [x] ✅ Props: `shipment: Shipment`
- [x] ✅ Renders a structured layout with all shipment fields grouped into sections:
  - [x] ✅ Header section: `tracking_number` (prominent), `status` badge, `created_at`
  - [x] ✅ Destination section: `destination_address`, `destination_city`, `destination_country`
  - [x] ✅ Logistics section: `origin_warehouse.name`, `scheduled_delivery_date`, `actual_delivery_date` (if present), `weight_kg`, transport name + plate (if assigned), route name (if assigned)
  - [x] ✅ Cost section: `base_cost`, `calculated_cost` (labeled "Final Cost")
  - [x] ✅ Notes section: `notes` (if present)
  - [x] ✅ Products section: `shipment_products` table (see below)
- [x] ✅ `shipment_products` table columns: Product Name, SKU, Quantity, Unit Price at Shipment, Line Total
- [x] ✅ Line Total computed as `(parseFloat(sp.unit_price_at_shipment) * sp.quantity).toFixed(2)` — displayed as string, computation only for display
- [x] ✅ All decimal values displayed as-is from API strings (no reformatting unless adding currency symbol)

### `components/shipments/AssignTransportDialog.tsx`

- [x] ✅ Props: `shipmentId: number`, `open: boolean`, `onOpenChange: (open: boolean) => void`
- [x] ✅ Uses shadcn `Dialog`
- [x] ✅ On open: loads available transport via `useTransportList({ status: 'available' })` and all active routes via `useRouteList({ status: 'active' })`
- [x] ✅ Form fields:
  - [x] ✅ `transport_id`: `<Select>` — required; displays transport name + plate number; only shows transport with `status: 'available'`
  - [x] ✅ `route_id`: `<Select>` — optional; displays route name; option "No route" maps to `undefined`/omitted
- [x] ✅ Zod schema:
  - [x] ✅ `transport_id`: `z.number({ required_error: 'Transport is required', invalid_type_error: 'Transport is required' })`
  - [x] ✅ `route_id`: `z.number().optional()`
- [x] ✅ Submit button: "Assign Transport" — calls `useAssignTransport()` with `{ shipmentId, body: { transport_id, route_id } }`
- [x] ✅ On success: closes dialog via `onOpenChange(false)`; toast handled by the hook
- [x] ✅ On error: displays API error message inside the dialog (does not close)
- [x] ✅ Submit button disabled and shows spinner while mutation is pending
- [x] ✅ If no available transport exists: shows "No available transport" message and disables the submit button
- [x] ✅ If no active routes exist: the route select shows "No routes available" as disabled placeholder

### `components/shipments/StatusTimeline.tsx`

- [x] ✅ Props: `status: ShipmentStatus`
- [x] ✅ Renders a horizontal (or vertical on mobile) timeline/stepper showing the 4 main states: `pending` → `picked_up` → `in_transit` → `delivered`
- [x] ✅ `cancelled` is shown as a separate terminal node or as a red overlay/badge if current status is `cancelled`
- [x] ✅ Each step shows: step label, icon or numbered circle
- [x] ✅ Completed steps (before current): filled/colored indicator
- [x] ✅ Current step: highlighted (e.g. primary color, ring)
- [x] ✅ Future steps: muted/gray indicator
- [x] ✅ Status labels use human-readable names: `pending`="Pending", `picked_up`="Picked Up", `in_transit`="In Transit", `delivered`="Delivered", `cancelled`="Cancelled"
- [x] ✅ Component is purely presentational — no state, no mutations

---

## Error and Edge Cases

- [x] ✅ Create form: submitting with zero products shows inline validation error "At least one product is required" — form does not submit
- [x] ✅ Create form: adding the same product twice is prevented — the combobox disables already-selected products or shows a warning
- [x] ✅ Create form: product quantity less than 1 is rejected by Zod and shows per-row field error
- [x] ✅ Create form: `scheduled_delivery_date` in the past shows validation error "Delivery date cannot be in the past" (Zod `.refine` or `min` attribute on date input)
- [x] ✅ Create form: API error `409 Conflict` (duplicate product in shipment) is shown as a toast error and the form is not reset
- [x] ✅ Edit page: if the fetched shipment has status other than `pending`, the form is displayed in a disabled/read-only state with a notice explaining edits are not allowed
- [x] ✅ Edit form: PATCH body only sends the editable fields — never sends `status`, `products`, `base_cost`, `calculated_cost`, `tracking_number`, `customer`, or `origin_warehouse`
- [x] ✅ Detail page: "Edit" button is hidden (or disabled) when status is not `pending`
- [x] ✅ Detail page: "Assign Transport" button is shown only when status is `pending`; clicking it while already in `picked_up` state is not possible
- [x] ✅ Detail page: "Mark Delivered" button is shown only when status is `picked_up` or `in_transit`
- [x] ✅ Detail page: "Cancel" button is shown only when status is `pending`, `picked_up`, or `in_transit`; it is hidden when `delivered` or `cancelled`
- [x] ✅ Detail page: "Delete" button is shown only when status is `pending` or `cancelled`; deleting a `delivered` or `in_transit` shipment is not allowed in the UI
- [x] ✅ AssignTransportDialog: if transport list fails to load, shows error message inside dialog
- [x] ✅ AssignTransportDialog: after successful assign, the parent detail page refetches automatically via query invalidation (no manual reload needed)
- [x] ✅ ShipmentsTable: status filter "all" sends no `?status=` param; selecting a status appends the correct param
- [x] ✅ ShipmentsTable: customer filter select uses customer ID in `?customer=` param
- [x] ✅ ShipmentsTable: origin_warehouse filter select uses warehouse ID in `?origin_warehouse=` param
- [x] ✅ ShipmentsTable: transport filter select uses transport ID in `?transport=` param
- [x] ✅ Pagination: `?page=1` and no `?page` param are treated identically (default to page 1)
- [x] ✅ `tracking_number` is read-only — never included in any form body; never editable
- [x] ✅ `base_cost` and `calculated_cost` are read-only — never included in any form body
- [x] ✅ `actual_delivery_date` is read-only — populated by the API on `mark-delivered`; never sent by the client
- [x] ✅ `shipment_products` line total display uses `parseFloat` only for the multiplication display; the string values from the API are never mutated
- [x] ✅ `unit_price_at_shipment` may differ from the product's current `unit_price` — the shipment detail always shows the snapshot value, never the live product price
- [x] ✅ API error details (e.g. `{ "products": ["No duplicate products allowed"] }`) must be mapped to the corresponding form field via `form.setError`
- [x] ✅ Loading skeleton or spinner shown on list page, detail page, and inside AssignTransportDialog while queries are fetching
- [x] ✅ If `useShipment(id)` returns a 404, the detail and edit pages render a "Shipment not found" fallback, not a crash
- [x] ✅ `weight_kg` is sent to the API as a string (e.g. `"15.500"`) — never convert to float before sending
