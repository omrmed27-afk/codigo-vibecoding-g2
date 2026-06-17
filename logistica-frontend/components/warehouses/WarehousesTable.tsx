'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { usePermission } from '@/hooks/auth/use-permission'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { useDeleteWarehouse, useToggleWarehouseActive } from '@/hooks/warehouses/use-warehouses'
import type { Warehouse, WarehouseListParams } from '@/types/warehouses'
import type { PaginatedResponse } from '@/types/api'

interface Props {
  data: PaginatedResponse<Warehouse> | undefined
  isLoading: boolean
  params: WarehouseListParams
  onParamsChange: (p: Partial<WarehouseListParams>) => void
}

function SortIcon({ field, ordering }: { field: string; ordering?: string }) {
  if (ordering === field) return <span className="ml-1">▲</span>
  if (ordering === `-${field}`) return <span className="ml-1">▼</span>
  return <span className="ml-1 text-gray-300">⇅</span>
}

export default function WarehousesTable({ data, isLoading, params, onParamsChange }: Props) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState<string>('')
  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteWarehouse = useDeleteWarehouse()
  const canChange = usePermission('warehouses.change_warehouse')
  const canDelete = usePermission('warehouses.delete_warehouse')
  const toggleActive = useToggleWarehouseActive()

  // Sync search input with external params
  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  function handleSearchChange(value: string) {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onParamsChange({ search: value, page: 1 })
    }, 300)
  }

  function handleOrderingToggle(field: 'name' | 'created_at') {
    const current = params.ordering
    let next: WarehouseListParams['ordering']
    if (current === field) {
      next = `-${field}` as WarehouseListParams['ordering']
    } else if (current === `-${field}`) {
      next = field
    } else {
      next = field
    }
    onParamsChange({ ordering: next, page: 1 })
  }

  function handleActiveFilter(value: string) {
    if (value === 'true') {
      onParamsChange({ is_active: true, page: 1 })
    } else if (value === 'false') {
      onParamsChange({ is_active: false, page: 1 })
    } else {
      onParamsChange({ is_active: undefined, page: 1 })
    }
  }

  function handleDeleteClick(warehouse: Warehouse) {
    setDeleteId(warehouse.id)
    setDeleteName(warehouse.name)
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteWarehouse.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  const columns: ColumnDef<Warehouse, unknown>[] = [
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
          href={`/warehouses/${row.original.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'city',
      header: 'City',
    },
    {
      accessorKey: 'country',
      header: 'Country',
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_active}
          onCheckedChange={(checked) =>
            toggleActive.mutate({ id: row.original.id, is_active: checked })
          }
        />
      ),
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
            href={`/warehouses/${row.original.id}`}
            className="px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            View
          </Link>
          {canChange && (
            <Link
              href={`/warehouses/${row.original.id}/edit`}
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

  const activeFilterCount = [params.is_active].filter(v => v !== undefined).length

  const currentPage = params.page ?? 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {/* Search — always visible */}
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search warehouses..."
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        {/* Active filter — desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <select
            value={params.is_active === true ? 'true' : params.is_active === false ? 'false' : ''}
            onChange={(e) => handleActiveFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
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
                <select
                  value={params.is_active === true ? 'true' : params.is_active === false ? 'false' : ''}
                  onChange={(e) => handleActiveFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
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
        emptyMessage="No warehouses found"
      />

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} · {data.count} total warehouse{data.count !== 1 ? 's' : ''}
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
        title="Delete Warehouse"
        description={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteWarehouse.isPending}
      />
    </div>
  )
}
