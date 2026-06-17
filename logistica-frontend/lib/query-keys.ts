import type { WarehouseListParams } from '@/types/warehouses'
import type { SupplierListParams } from '@/types/suppliers'
import type { CustomerListParams } from '@/types/customers'
import type { ProductListParams } from '@/types/products'
import type { DriverListParams } from '@/types/drivers'
import type { TransportListParams } from '@/types/transport'
import type { RouteListParams } from '@/types/routes'
import type { ShipmentListParams } from '@/types/shipments'
import type { UserListParams } from '@/types/users'

// Implement agent adds one block per module — never remove existing keys
export const queryKeys = {
  warehouses: {
    all: ['warehouses'] as const,
    list: (filters: WarehouseListParams) => ['warehouses', 'list', filters] as const,
    detail: (id: number) => ['warehouses', 'detail', id] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    list: (filters: SupplierListParams) => ['suppliers', 'list', filters] as const,
    detail: (id: number) => ['suppliers', 'detail', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (filters: CustomerListParams) => ['customers', 'list', filters] as const,
    detail: (id: number) => ['customers', 'detail', id] as const,
  },
  products: {
    all: ['products'] as const,
    list: (filters: ProductListParams) => ['products', 'list', filters] as const,
    detail: (id: number) => ['products', 'detail', id] as const,
  },
  drivers: {
    all: ['drivers'] as const,
    list: (filters: DriverListParams) => ['drivers', 'list', filters] as const,
    detail: (id: number) => ['drivers', 'detail', id] as const,
  },
  transport: {
    all: ['transport'] as const,
    list: (filters: TransportListParams) => ['transport', 'list', filters] as const,
    detail: (id: number) => ['transport', 'detail', id] as const,
  },
  routes: {
    all: ['routes'] as const,
    list: (filters: RouteListParams) => ['routes', 'list', filters] as const,
    detail: (id: number) => ['routes', 'detail', id] as const,
    stops: (routeId: number) => ['routes', 'stops', routeId] as const,
  },
  shipments: {
    all: ['shipments'] as const,
    list: (filters: ShipmentListParams) => ['shipments', 'list', filters] as const,
    detail: (id: number) => ['shipments', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters: UserListParams) => ['users', 'list', filters] as const,
    groups: ['users', 'groups'] as const,
    groupDetail: (id: number) => ['users', 'groups', id] as const,
    permissions: ['users', 'permissions'] as const,
  },
} as const
