'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import SuppliersTable from '@/components/suppliers/SuppliersTable'
import { useSupplierList } from '@/hooks/suppliers/use-suppliers'
import { usePermission } from '@/hooks/auth/use-permission'
import type { SupplierListParams } from '@/types/suppliers'

export default function SuppliersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''
  const city = searchParams.get('city') ?? ''
  const country = searchParams.get('country') ?? ''
  const ordering = (searchParams.get('ordering') as SupplierListParams['ordering']) ?? undefined

  const params: SupplierListParams = {
    page,
    search,
    city,
    country,
    ordering,
  }

  const { data, isLoading, isError } = useSupplierList(params)
  const canAdd = usePermission('suppliers.add_supplier')

  const handleParamsChange = useCallback(
    (updates: Partial<SupplierListParams>) => {
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
      if ('city' in updates) {
        if (updates.city) {
          next.set('city', updates.city)
        } else {
          next.delete('city')
        }
      }
      if ('country' in updates) {
        if (updates.country) {
          next.set('country', updates.country)
        } else {
          next.delete('country')
        }
      }
      if ('ordering' in updates) {
        if (updates.ordering) {
          next.set('ordering', updates.ordering)
        } else {
          next.delete('ordering')
        }
      }

      router.push(`/suppliers?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Proveedores"
        action={
          canAdd ? (
            <Link href="/suppliers/new">
              <Button>Nuevo Proveedor</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar los proveedores. Intente nuevamente.
        </div>
      ) : (
        <SuppliersTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
