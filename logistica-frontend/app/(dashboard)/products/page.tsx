'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import ProductsTable from '@/components/products/ProductsTable'
import { useProductList } from '@/hooks/products/use-products'
import { usePermission } from '@/hooks/auth/use-permission'
import type { ProductListParams } from '@/types/products'

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageParam = searchParams.get('page')
  const page = pageParam ? Number(pageParam) : 1

  const search = searchParams.get('search') ?? ''

  const supplierParam = searchParams.get('supplier')
  const supplier = supplierParam ? Number(supplierParam) : undefined

  const warehouseParam = searchParams.get('warehouse')
  const warehouse = warehouseParam ? Number(warehouseParam) : undefined

  const ordering = (searchParams.get('ordering') as ProductListParams['ordering']) ?? undefined

  const params: ProductListParams = {
    page,
    search: search || undefined,
    supplier,
    warehouse,
    ordering,
  }

  const { data, isLoading, isError } = useProductList(params)
  const canAdd = usePermission('products.add_product')

  const handleParamsChange = useCallback(
    (updates: Partial<ProductListParams>) => {
      const next = new URLSearchParams(searchParams.toString())

      if ('page' in updates) {
        if (updates.page !== undefined) {
          next.set('page', String(updates.page))
        } else {
          next.delete('page')
        }
      }
      if ('search' in updates) {
        if (updates.search) {
          next.set('search', updates.search)
        } else {
          next.delete('search')
        }
      }
      if ('supplier' in updates) {
        if (updates.supplier !== undefined) {
          next.set('supplier', String(updates.supplier))
        } else {
          next.delete('supplier')
        }
      }
      if ('warehouse' in updates) {
        if (updates.warehouse !== undefined) {
          next.set('warehouse', String(updates.warehouse))
        } else {
          next.delete('warehouse')
        }
      }
      if ('ordering' in updates) {
        if (updates.ordering) {
          next.set('ordering', updates.ordering)
        } else {
          next.delete('ordering')
        }
      }

      router.push(`/products?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Productos"
        action={
          canAdd ? (
            <Link href="/products/new">
              <Button>Nuevo Producto</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar los productos. Intente nuevamente.
        </div>
      ) : (
        <ProductsTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
