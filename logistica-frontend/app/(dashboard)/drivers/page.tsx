'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import DriversTable from '@/components/drivers/DriversTable'
import { useDriverList } from '@/hooks/drivers/use-drivers'
import { usePermission } from '@/hooks/auth/use-permission'
import type { DriverListParams, DriverStatus } from '@/types/drivers'

export default function DriversPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''
  const statusRaw = searchParams.get('status')
  const status =
    statusRaw === 'available' || statusRaw === 'busy' || statusRaw === 'off_duty'
      ? (statusRaw as DriverStatus)
      : undefined
  const ordering =
    (searchParams.get('ordering') as DriverListParams['ordering']) ?? undefined

  const params: DriverListParams = {
    page,
    search,
    status,
    ordering,
  }

  const { data, isLoading, isError } = useDriverList(params)
  const canAdd = usePermission('drivers.add_driver')

  const handleParamsChange = useCallback(
    (updates: Partial<DriverListParams>) => {
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
      if ('ordering' in updates) {
        if (updates.ordering) {
          next.set('ordering', updates.ordering)
        } else {
          next.delete('ordering')
        }
      }

      router.push(`/drivers?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Conductores"
        action={
          canAdd ? (
            <Link href="/drivers/new">
              <Button>Nuevo Conductor</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar los conductores. Intente nuevamente.
        </div>
      ) : (
        <DriversTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
