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
import { useDeleteCustomer } from '@/hooks/customers/use-customers'
import type { Customer, CustomerListParams, CustomerType } from '@/types/customers'
import type { PaginatedResponse } from '@/types/api'

interface Props {
  data: PaginatedResponse<Customer> | undefined
  isLoading: boolean
  params: CustomerListParams
  onParamsChange: (p: Partial<CustomerListParams>) => void
}

function SortIcon({ field, ordering }: { field: string; ordering?: string }) {
  if (ordering === field) return <span className="ml-1">▲</span>
  if (ordering === `-${field}`) return <span className="ml-1">▼</span>
  return <span className="ml-1 text-gray-300">⇅</span>
}

export default function CustomersTable({ data, isLoading, params, onParamsChange }: Props) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState<string>('')

  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const [cityValue, setCityValue] = useState(params.city ?? '')
  const [countryValue, setCountryValue] = useState(params.country ?? '')

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteCustomer = useDeleteCustomer()
  const canChange = usePermission('customers.change_customer')
  const canDelete = usePermission('customers.delete_customer')

  // Sync inputs with external params (e.g. on browser back/forward)
  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  useEffect(() => {
    setCityValue(params.city ?? '')
  }, [params.city])

  useEffect(() => {
    setCountryValue(params.country ?? '')
  }, [params.country])

  function handleSearchChange(value: string) {
    setSearchValue(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      onParamsChange({ search: value, page: 1 })
    }, 300)
  }

  function handleCityChange(value: string) {
    setCityValue(value)
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    cityDebounceRef.current = setTimeout(() => {
      onParamsChange({ city: value, page: 1 })
    }, 300)
  }

  function handleCountryChange(value: string) {
    setCountryValue(value)
    if (countryDebounceRef.current) clearTimeout(countryDebounceRef.current)
    countryDebounceRef.current = setTimeout(() => {
      onParamsChange({ country: value, page: 1 })
    }, 300)
  }

  function handleCustomerTypeFilter(value: string) {
    if (value === 'all') {
      onParamsChange({ customer_type: undefined, page: 1 })
    } else {
      onParamsChange({ customer_type: value as CustomerType, page: 1 })
    }
  }

  function handleOrderingToggle(field: 'name' | 'created_at') {
    const current = params.ordering
    let next: CustomerListParams['ordering']
    if (current === field) {
      next = `-${field}` as CustomerListParams['ordering']
    } else if (current === `-${field}`) {
      next = field
    } else {
      next = field
    }
    onParamsChange({ ordering: next, page: 1 })
  }

  function handleDeleteClick(customer: Customer) {
    setDeleteId(customer.id)
    setDeleteName(customer.name)
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteCustomer.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  const columns: ColumnDef<Customer, unknown>[] = [
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
          href={`/customers/${row.original.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'customer_type',
      header: 'Type',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.customer_type}
          label={row.original.customer_type === 'company' ? 'Company' : 'Individual'}
        />
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
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
            href={`/customers/${row.original.id}`}
            className="px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            View
          </Link>
          {canChange && (
            <Link
              href={`/customers/${row.original.id}/edit`}
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

  const activeFilterCount = [params.customer_type, params.city, params.country].filter(v => v != null).length

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
          placeholder="Search by name, email, phone…"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        {/* Secondary filters — desktop only */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Select value={params.customer_type ?? 'all'} onValueChange={handleCustomerTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="text"
            value={cityValue}
            onChange={(e) => handleCityChange(e.target.value)}
            placeholder="Filter by city…"
            className="px-3 py-2 text-sm border border-gray-300 rounded-md w-40 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <input
            type="text"
            value={countryValue}
            onChange={(e) => handleCountryChange(e.target.value)}
            placeholder="Filter by country…"
            className="px-3 py-2 text-sm border border-gray-300 rounded-md w-40 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
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
                <p className="text-sm font-medium text-gray-700 mb-1.5">Tipo</p>
                <Select value={params.customer_type ?? 'all'} onValueChange={handleCustomerTypeFilter}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Ciudad</p>
                <input
                  type="text"
                  value={cityValue}
                  onChange={(e) => handleCityChange(e.target.value)}
                  placeholder="Filter by city…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">País</p>
                <input
                  type="text"
                  value={countryValue}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  placeholder="Filter by country…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
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
        emptyMessage="No customers found"
      />

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} · {data.count} total customer{data.count !== 1 ? 's' : ''}
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
        title="Delete Customer"
        description={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteCustomer.isPending}
      />
    </div>
  )
}
