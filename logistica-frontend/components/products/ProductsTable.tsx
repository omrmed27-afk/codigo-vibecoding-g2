'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { usePermission } from '@/hooks/auth/use-permission'
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
import { useDeleteProduct } from '@/hooks/products/use-products'
import { useSupplierList } from '@/hooks/suppliers/use-suppliers'
import { useWarehouseList } from '@/hooks/warehouses/use-warehouses'
import type { Product, ProductListParams } from '@/types/products'
import type { PaginatedResponse } from '@/types/api'

interface Props {
  data: PaginatedResponse<Product> | undefined
  isLoading: boolean
  params: ProductListParams
  onParamsChange: (p: Partial<ProductListParams>) => void
}

function SortIcon({ field, ordering }: { field: string; ordering?: string }) {
  if (ordering === field) return <span className="ml-1">▲</span>
  if (ordering === `-${field}`) return <span className="ml-1">▼</span>
  return <span className="ml-1 text-gray-300">⇅</span>
}

export default function ProductsTable({ data, isLoading, params, onParamsChange }: Props) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState<string>('')

  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteProduct = useDeleteProduct()
  const canChange = usePermission('products.change_product')
  const canDelete = usePermission('products.delete_product')

  const { data: suppliersData } = useSupplierList({ page: 1 })
  const { data: warehousesData } = useWarehouseList({ page: 1 })

  // Sync search input with external params (e.g. browser back/forward)
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

  function handleSupplierFilter(value: string) {
    if (value === 'all') {
      onParamsChange({ supplier: undefined, page: 1 })
    } else {
      onParamsChange({ supplier: Number(value), page: 1 })
    }
  }

  function handleWarehouseFilter(value: string) {
    if (value === 'all') {
      onParamsChange({ warehouse: undefined, page: 1 })
    } else {
      onParamsChange({ warehouse: Number(value), page: 1 })
    }
  }

  function handleOrderingToggle(
    field: 'name' | 'unit_price' | 'stock_quantity' | 'created_at'
  ) {
    const current = params.ordering
    let next: ProductListParams['ordering']
    if (current === field) {
      next = `-${field}` as ProductListParams['ordering']
    } else if (current === `-${field}`) {
      next = field
    } else {
      next = field
    }
    onParamsChange({ ordering: next, page: 1 })
  }

  function handleDeleteClick(product: Product) {
    setDeleteId(product.id)
    setDeleteName(product.name)
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteProduct.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  const columns: ColumnDef<Product, unknown>[] = [
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
          href={`/products/${row.original.id}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
          {row.original.sku}
        </span>
      ),
    },
    {
      accessorKey: 'unit_price',
      header: () => (
        <button
          type="button"
          className="flex items-center text-left"
          onClick={() => handleOrderingToggle('unit_price')}
        >
          Unit Price
          <SortIcon field="unit_price" ordering={params.ordering} />
        </button>
      ),
      cell: ({ row }) => row.original.unit_price,
    },
    {
      accessorKey: 'stock_quantity',
      header: () => (
        <button
          type="button"
          className="flex items-center text-left"
          onClick={() => handleOrderingToggle('stock_quantity')}
        >
          Stock
          <SortIcon field="stock_quantity" ordering={params.ordering} />
        </button>
      ),
      cell: ({ row }) => row.original.stock_quantity,
    },
    {
      id: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <Link
          href={`/suppliers/${row.original.supplier.id}`}
          className="text-blue-600 hover:underline"
        >
          {row.original.supplier.name}
        </Link>
      ),
    },
    {
      id: 'warehouse',
      header: 'Warehouse',
      cell: ({ row }) => (
        <Link
          href={`/warehouses/${row.original.warehouse.id}`}
          className="text-blue-600 hover:underline"
        >
          {row.original.warehouse.name}
        </Link>
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
            href={`/products/${row.original.id}`}
            className="px-2 py-1 text-xs text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            View
          </Link>
          {canChange && (
            <Link
              href={`/products/${row.original.id}/edit`}
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

  const activeFilterCount = [params.supplier, params.warehouse].filter(v => v != null).length

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
          placeholder="Search by name, SKU, description…"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        {/* Secondary filters — desktop only */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Select
            value={params.supplier !== undefined ? String(params.supplier) : 'all'}
            onValueChange={handleSupplierFilter}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliersData?.results.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={params.warehouse !== undefined ? String(params.warehouse) : 'all'}
            onValueChange={handleWarehouseFilter}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {warehousesData?.results.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
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
                <p className="text-sm font-medium text-gray-700 mb-1.5">Proveedor</p>
                <Select
                  value={params.supplier !== undefined ? String(params.supplier) : 'all'}
                  onValueChange={handleSupplierFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliersData?.results.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1.5">Bodega</p>
                <Select
                  value={params.warehouse !== undefined ? String(params.warehouse) : 'all'}
                  onValueChange={handleWarehouseFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehousesData?.results.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
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
        emptyMessage="No products found"
      />

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} · {data.count} total product{data.count !== 1 ? 's' : ''}
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
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteProduct.isPending}
      />
    </div>
  )
}
