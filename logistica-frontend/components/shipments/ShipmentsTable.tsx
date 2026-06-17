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
import { useDeleteShipment } from '@/hooks/shipments/use-shipments'
import { useCustomerList } from '@/hooks/customers/use-customers'
import { useWarehouseList } from '@/hooks/warehouses/use-warehouses'
import { useTransportList } from '@/hooks/transport/use-transport'
import type { Shipment, ShipmentListParams, ShipmentStatus } from '@/types/shipments'
import type { PaginatedResponse } from '@/types/api'

interface Props {
  data: PaginatedResponse<Shipment> | undefined
  isLoading: boolean
  params: ShipmentListParams
  onParamsChange: (p: Partial<ShipmentListParams>) => void
}

const statusOptions: { value: ShipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function ShipmentsTable({ data, isLoading, params, onParamsChange }: Props) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteTracking, setDeleteTracking] = useState<string>('')
  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteShipment = useDeleteShipment()
  const permCanChange = usePermission('shipments.change_shipment')
  const permCanDelete = usePermission('shipments.delete_shipment')
  const { data: customersData } = useCustomerList({ page: 1 })
  const { data: warehousesData } = useWarehouseList({ page: 1 })
  const { data: transportData } = useTransportList({ page: 1 })

  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  function handleSearchChange(value: string) {
    setSearchValue(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      onParamsChange({ search: value || undefined, page: 1 })
    }, 300)
  }

  function handleStatusFilter(value: string) {
    if (value === 'all') {
      onParamsChange({ status: undefined, page: 1 })
    } else {
      onParamsChange({ status: value as ShipmentStatus, page: 1 })
    }
  }

  function handleDeleteClick(shipment: Shipment) {
    setDeleteId(shipment.id)
    setDeleteTracking(shipment.tracking_number)
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteShipment.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  const columns: ColumnDef<Shipment, unknown>[] = [
    {
      accessorKey: 'tracking_number',
      header: 'Tracking Number',
      cell: ({ row }) => (
        <Link
          href={`/shipments/${row.original.id}`}
          className="text-blue-600 hover:underline font-mono text-xs font-medium"
        >
          {row.original.tracking_number}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.customer.name,
    },
    {
      id: 'origin_warehouse',
      header: 'Origin Warehouse',
      cell: ({ row }) => row.original.origin_warehouse.name,
    },
    {
      id: 'destination',
      header: 'Destination',
      cell: ({ row }) =>
        `${row.original.destination_city}, ${row.original.destination_country}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'scheduled_delivery_date',
      header: 'Scheduled Delivery',
      cell: ({ row }) => row.original.scheduled_delivery_date,
    },
    {
      id: 'calculated_cost',
      header: 'Final Cost',
      cell: ({ row }) => `$${row.original.calculated_cost}`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const s = row.original
        const canEdit = s.status === 'pending' && permCanChange
        const canDelete = (s.status === 'pending' || s.status === 'cancelled') && permCanDelete

        return (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/shipments/${s.id}`}
              className="px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              View
            </Link>
            {canEdit ? (
              <Link
                href={`/shipments/${s.id}/edit`}
                className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
              >
                Edit
              </Link>
            ) : (
              <span className="px-2 py-1 text-xs text-gray-300 border border-gray-200 rounded cursor-not-allowed">
                Edit
              </span>
            )}
            {canDelete ? (
              <button
                type="button"
                onClick={() => handleDeleteClick(s)}
                className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            ) : (
              <span className="px-2 py-1 text-xs text-gray-300 border border-gray-200 rounded cursor-not-allowed">
                Delete
              </span>
            )}
          </div>
        )
      },
    },
  ]

  const activeFilterCount = [params.status, params.customer, params.origin_warehouse, params.transport].filter(v => v != null).length

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
          placeholder="Search tracking number, city, country…"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        {/* Secondary filters — desktop only */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Select
            value={params.status ?? 'all'}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={params.customer !== undefined ? String(params.customer) : 'all'}
            onValueChange={(v) => onParamsChange({ customer: v === 'all' ? undefined : Number(v), page: 1 })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customersData?.results.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={params.origin_warehouse !== undefined ? String(params.origin_warehouse) : 'all'}
            onValueChange={(v) => onParamsChange({ origin_warehouse: v === 'all' ? undefined : Number(v), page: 1 })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehousesData?.results.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={params.transport !== undefined ? String(params.transport) : 'all'}
            onValueChange={(v) => onParamsChange({ transport: v === 'all' ? undefined : Number(v), page: 1 })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Transport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transport</SelectItem>
              {transportData?.results.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name} — {t.plate_number}</SelectItem>
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
          <SheetContent side="bottom" className="rounded-t-xl overflow-y-auto max-h-[80vh]">
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
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Cliente</p>
                <Select
                  value={params.customer !== undefined ? String(params.customer) : 'all'}
                  onValueChange={(v) => onParamsChange({ customer: v === 'all' ? undefined : Number(v), page: 1 })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customersData?.results.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Bodega Origen</p>
                <Select
                  value={params.origin_warehouse !== undefined ? String(params.origin_warehouse) : 'all'}
                  onValueChange={(v) => onParamsChange({ origin_warehouse: v === 'all' ? undefined : Number(v), page: 1 })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehousesData?.results.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Transporte</p>
                <Select
                  value={params.transport !== undefined ? String(params.transport) : 'all'}
                  onValueChange={(v) => onParamsChange({ transport: v === 'all' ? undefined : Number(v), page: 1 })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Transport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transport</SelectItem>
                    {transportData?.results.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name} — {t.plate_number}</SelectItem>
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
        emptyMessage="No shipments found"
      />

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} · {data.count} total shipment{data.count !== 1 ? 's' : ''}
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
        title="Delete Shipment"
        description={`Are you sure you want to delete shipment "${deleteTracking}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteShipment.isPending}
      />
    </div>
  )
}
