'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import WarehousesTable from '@/components/warehouses/WarehousesTable'
import { useWarehouseList } from '@/hooks/warehouses/use-warehouses'
import { usePermission } from '@/hooks/auth/use-permission'
import type { WarehouseListParams } from '@/types/warehouses'

export default function WarehousesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? undefined
  const isActiveRaw = searchParams.get('is_active')
  const is_active =
    isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined
  const ordering = (searchParams.get('ordering') as WarehouseListParams['ordering']) ?? undefined

  const params: WarehouseListParams = {
    page,
    search,
    is_active,
    ordering,
  }

  const { data, isLoading, isError } = useWarehouseList(params)
  const canAdd = usePermission('warehouses.add_warehouse')

  const handleParamsChange = useCallback(
    (updates: Partial<WarehouseListParams>) => {
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
      if ('is_active' in updates) {
        if (updates.is_active !== undefined) {
          next.set('is_active', String(updates.is_active))
        } else {
          next.delete('is_active')
        }
      }
      if ('ordering' in updates) {
        if (updates.ordering) {
          next.set('ordering', updates.ordering)
        } else {
          next.delete('ordering')
        }
      }

      router.push(`/warehouses?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Bodegas"
        action={
          canAdd ? (
            <Link href="/warehouses/new">
              <Button>Nueva Bodega</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar las bodegas. Intente nuevamente.
        </div>
      ) : (
        <WarehousesTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
