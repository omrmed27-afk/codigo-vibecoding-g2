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
import { useDeleteTransport } from '@/hooks/transport/use-transport'
import type { Transport, TransportListParams, TransportStatus, VehicleType } from '@/types/transport'
import type { PaginatedResponse } from '@/types/api'

interface Props {
  data: PaginatedResponse<Transport> | undefined
  isLoading: boolean
  params: TransportListParams
  onParamsChange: (p: Partial<TransportListParams>) => void
}

function SortIcon({ field, ordering }: { field: string; ordering?: string }) {
  if (ordering === field) return <span className="ml-1">▲</span>
  if (ordering === `-${field}`) return <span className="ml-1">▼</span>
  return <span className="ml-1 text-gray-300">⇅</span>
}

const STATUS_LABELS: Record<TransportStatus, string> = {
  available: 'Available',
  in_transit: 'In Transit',
  maintenance: 'Maintenance',
}

const TYPE_LABELS: Record<VehicleType, string> = {
  truck: 'Truck',
  van: 'Van',
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
}

export default function TransportTable({ data, isLoading, params, onParamsChange }: Props) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState<string>('')

  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteTransport = useDeleteTransport()
  const canChange = usePermission('transport.change_transport')
  const canDelete = usePermission('transport.delete_transport')

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
      onParamsChange({ status: value as TransportStatus, page: 1 })
    }
  }

  function handleTypeFilter(value: string) {
    if (value === 'all') {
      onParamsChange({ type: undefined, page: 1 })
    } else {
      onParamsChange({ type: value as VehicleType, page: 1 })
    }
  }

  function handleOrderingToggle(field: 'name' | 'created_at' | 'status') {
    const current = params.ordering
    let next: TransportListParams['ordering']
    if (current === field) {
      next = `-${field}` as TransportListParams['ordering']
    } else if (current === `-${field}`) {
      next = field
    } else {
      next = field
    }
    onParamsChange({ ordering: next, page: 1 })
  }

  function handleDeleteClick(transport: Transport) {
    setDeleteId(transport.id)
    setDeleteName(transport.name)
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteTransport.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  const columns: ColumnDef<Transport, unknown>[] = [
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
          href={`/transport/${row.original.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.type}
          label={TYPE_LABELS[row.original.type]}
        />
      ),
    },
    {
      accessorKey: 'plate_number',
      header: 'Plate Number',
    },
    {
      accessorKey: 'capacity_kg',
      header: 'Capacity (kg)',
    },
    {
      accessorKey: 'capacity_m3',
      header: 'Capacity (m³)',
    },
    {
      accessorKey: 'status',
      header: () => (
        <button
          type="button"
          className="flex items-center text-left"
          onClick={() => handleOrderingToggle('status')}
        >
          Status
          <SortIcon field="status" ordering={params.ordering} />
        </button>
      ),
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          label={STATUS_LABELS[row.original.status]}
        />
      ),
    },
    {
      id: 'driver',
      header: 'Driver',
      cell: ({ row }) =>
        row.original.driver ? row.original.driver.license_number : '—',
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
            href={`/transport/${row.original.id}`}
            className="px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            View
          </Link>
          {canChange && (
            <Link
              href={`/transport/${row.original.id}/edit`}
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

  const activeFilterCount = [params.status, params.type].filter(v => v != null).length

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
          placeholder="Search by name or plate number…"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        {/* Secondary filters — desktop only */}
        <div className="hidden md:flex items-center gap-2">
          <Select value={params.status ?? 'all'} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={params.type ?? 'all'} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="motorcycle">Motorcycle</SelectItem>
              <SelectItem value="bicycle">Bicycle</SelectItem>
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
                <Select value={params.status ?? 'all'} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Tipo</p>
                <Select value={params.type ?? 'all'} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="bicycle">Bicycle</SelectItem>
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
        emptyMessage="No vehicles found"
      />

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} · {data.count} total vehicle{data.count !== 1 ? 's' : ''}
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
        title="Delete Vehicle"
        description={`Are you sure you want to delete "${deleteName}"? This will permanently delete the vehicle. This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteTransport.isPending}
      />
    </div>
  )
}
