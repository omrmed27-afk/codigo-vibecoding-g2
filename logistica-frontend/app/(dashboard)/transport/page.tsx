'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import TransportTable from '@/components/transport/TransportTable'
import { useTransportList } from '@/hooks/transport/use-transport'
import { usePermission } from '@/hooks/auth/use-permission'
import type { TransportListParams, TransportStatus, VehicleType } from '@/types/transport'

export default function TransportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''

  const statusRaw = searchParams.get('status')
  const status: TransportStatus | undefined =
    statusRaw === 'available' || statusRaw === 'in_transit' || statusRaw === 'maintenance'
      ? (statusRaw as TransportStatus)
      : undefined

  const typeRaw = searchParams.get('type')
  const type: VehicleType | undefined =
    typeRaw === 'truck' || typeRaw === 'van' || typeRaw === 'motorcycle' || typeRaw === 'bicycle'
      ? (typeRaw as VehicleType)
      : undefined

  const ordering =
    (searchParams.get('ordering') as TransportListParams['ordering']) ?? undefined

  const params: TransportListParams = {
    page,
    search,
    status,
    type,
    ordering,
  }

  const { data, isLoading, isError } = useTransportList(params)
  const canAdd = usePermission('transport.add_transport')

  const handleParamsChange = useCallback(
    (updates: Partial<TransportListParams>) => {
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
      if ('type' in updates) {
        if (updates.type) {
          next.set('type', updates.type)
        } else {
          next.delete('type')
        }
      }
      if ('ordering' in updates) {
        if (updates.ordering) {
          next.set('ordering', updates.ordering)
        } else {
          next.delete('ordering')
        }
      }

      router.push(`/transport?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Transporte"
        action={
          canAdd ? (
            <Link href="/transport/new">
              <Button>Nuevo Vehículo</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar el transporte. Intente nuevamente.
        </div>
      ) : (
        <TransportTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
