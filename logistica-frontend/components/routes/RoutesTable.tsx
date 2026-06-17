'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { usePermission } from '@/hooks/auth/use-permission'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { useDeleteRoute } from '@/hooks/routes/use-routes'
import { useWarehouseList } from '@/hooks/warehouses/use-warehouses'
import type { Route, RouteListParams, RouteStatus } from '@/types/routes'
import type { PaginatedResponse } from '@/types/api'

interface Props {
  data: PaginatedResponse<Route> | undefined
  isLoading: boolean
  params: RouteListParams
  onParamsChange: (p: Partial<RouteListParams>) => void
}

function SortIcon({ field, ordering }: { field: string; ordering?: string }) {
  if (ordering === field) return <span className="ml-1">▲</span>
  if (ordering === `-${field}`) return <span className="ml-1">▼</span>
  return <span className="ml-1 text-gray-300">⇅</span>
}

export default function RoutesTable({ data, isLoading, params, onParamsChange }: Props) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState<string>('')

  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteRoute = useDeleteRoute()
  const canChange = usePermission('routes.change_route')
  const canDelete = usePermission('routes.delete_route')
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouseList({ page: 1 })

  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  function handleSearchChange(value: string) {
    setSearchValue(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      onParamsChange({ search: value, page: 1 })
    }, 300)
  }

  function handleStatusFilter(value: string) {
    if (value === 'all') {
      onParamsChange({ status: undefined, page: 1 })
    } else {
      onParamsChange({ status: value as RouteStatus, page: 1 })
    }
  }

  function handleWarehouseFilter(value: string) {
    if (value === 'all') {
      onParamsChange({ origin_warehouse: undefined, page: 1 })
    } else {
      onParamsChange({ origin_warehouse: Number(value) || undefined, page: 1 })
    }
  }

  function handleOrderingToggle(field: 'name' | 'created_at') {
    const current = params.ordering
    let next: RouteListParams['ordering']
    if (current === field) {
      next = `-${field}` as RouteListParams['ordering']
    } else if (current === `-${field}`) {
      next = field
    } else {
      next = field
    }
    onParamsChange({ ordering: next, page: 1 })
  }

  function handleDeleteClick(route: Route) {
    setDeleteId(route.id)
    setDeleteName(route.name)
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteRoute.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  const columns: ColumnDef<Route, unknown>[] = [
    {
      accessorKey: 'name',
      header: () => (
        <button
          type="button"
          className="flex items-center text-left"
          onClick={() => handleOrderingToggle('name')}
        >
          Name
          <SortIcon field="name" ordering={params.ordering} />
        </button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/routes/${row.original.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'origin_warehouse',
      header: 'Origin Warehouse',
      cell: ({ row }) =>
        `${row.original.origin_warehouse.name} – ${row.original.origin_warehouse.city}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} />
      ),
    },
    {
      id: 'stops_count',
      header: 'Stops',
      cell: ({ row }) => {
        const count = row.original.stops.length
        return `${count} stop${count !== 1 ? 's' : ''}`
      },
    },
    {
      accessorKey: 'created_at',
      header: () => (
        <button
          type="button"
          className="flex items-center text-left"
          onClick={() => handleOrderingToggle('created_at')}
        >
          Created
          <SortIcon field="created_at" ordering={params.ordering} />
        </button>
      ),
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/routes/${row.original.id}`}
            className="px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            View
          </Link>
          {canChange && (
            <Link
              href={`/routes/${row.original.id}/edit`}
              className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
            >
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => handleDeleteClick(row.original)}
              className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ]

  const activeFilterCount = [params.status, params.origin_warehouse].filter(v => v != null).length

  const currentPage = params.page ?? 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search — always visible */}
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search routes…"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        {/* Secondary filters — desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <Select
            value={params.status ?? 'all'}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={params.origin_warehouse !== undefined ? String(params.origin_warehouse) : 'all'}
            onValueChange={handleWarehouseFilter}
            disabled={warehousesLoading}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder={warehousesLoading ? 'Loading…' : 'All Warehouses'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehousesData?.results.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name} – {w.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile filter Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden gap-1.5">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle className="text-left">Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Estado</p>
                <Select
                  value={params.status ?? 'all'}
                  onValueChange={handleStatusFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Bodega de Origen</p>
                <Select
                  value={params.origin_warehouse !== undefined ? String(params.origin_warehouse) : 'all'}
                  onValueChange={handleWarehouseFilter}
                  disabled={warehousesLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={warehousesLoading ? 'Loading…' : 'All Warehouses'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehousesData?.results.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name} – {w.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table */}
      <DataTable
        data={data?.results ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No routes found"
      />

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} · {data.count} total route{data.count !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onParamsChange({ page: currentPage - 1 })}
              disabled={data.previous === null}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onParamsChange({ page: currentPage + 1 })}
              disabled={data.next === null}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Route"
        description={`Are you sure you want to delete "${deleteName}"? This will permanently delete the route and all its stops. This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteRoute.isPending}
      />
    </div>
  )
}
