'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import RoutesTable from '@/components/routes/RoutesTable'
import { useRouteList } from '@/hooks/routes/use-routes'
import { usePermission } from '@/hooks/auth/use-permission'
import type { RouteListParams, RouteStatus } from '@/types/routes'

export default function RoutesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''

  const statusRaw = searchParams.get('status')
  const status: RouteStatus | undefined =
    statusRaw === 'active' || statusRaw === 'inactive'
      ? (statusRaw as RouteStatus)
      : undefined

  const warehouseRaw = searchParams.get('origin_warehouse')
  const origin_warehouse: number | undefined =
    warehouseRaw ? Number(warehouseRaw) || undefined : undefined

  const ordering =
    (searchParams.get('ordering') as RouteListParams['ordering']) ?? undefined

  const params: RouteListParams = {
    page,
    search,
    status,
    origin_warehouse,
    ordering,
  }

  const { data, isLoading, isError } = useRouteList(params)
  const canAdd = usePermission('routes.add_route')

  const handleParamsChange = useCallback(
    (updates: Partial<RouteListParams>) => {
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
      if ('status' in updates) {
        if (updates.status) {
          next.set('status', updates.status)
        } else {
          next.delete('status')
        }
      }
      if ('origin_warehouse' in updates) {
        if (updates.origin_warehouse !== undefined) {
          next.set('origin_warehouse', String(updates.origin_warehouse))
        } else {
          next.delete('origin_warehouse')
        }
      }
      if ('ordering' in updates) {
        if (updates.ordering) {
          next.set('ordering', updates.ordering)
        } else {
          next.delete('ordering')
        }
      }

      router.push(`/routes?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Rutas"
        action={
          canAdd ? (
            <Link href="/routes/new">
              <Button>Nueva Ruta</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar las rutas. Intente nuevamente.
        </div>
      ) : (
        <RoutesTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
