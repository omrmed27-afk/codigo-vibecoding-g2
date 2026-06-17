'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import ShipmentsTable from '@/components/shipments/ShipmentsTable'
import { useShipmentList } from '@/hooks/shipments/use-shipments'
import { usePermission } from '@/hooks/auth/use-permission'
import type { ShipmentListParams, ShipmentStatus } from '@/types/shipments'

export default function ShipmentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? undefined
  const statusRaw = searchParams.get('status')
  const status: ShipmentStatus | undefined =
    statusRaw === 'pending' ||
    statusRaw === 'picked_up' ||
    statusRaw === 'in_transit' ||
    statusRaw === 'delivered' ||
    statusRaw === 'cancelled'
      ? statusRaw
      : undefined
  const customerRaw = searchParams.get('customer')
  const customer = customerRaw ? Number(customerRaw) : undefined
  const originWarehouseRaw = searchParams.get('origin_warehouse')
  const origin_warehouse = originWarehouseRaw ? Number(originWarehouseRaw) : undefined
  const transportRaw = searchParams.get('transport')
  const transport = transportRaw ? Number(transportRaw) : undefined
  const ordering =
    (searchParams.get('ordering') as ShipmentListParams['ordering']) ?? undefined

  const params: ShipmentListParams = {
    page,
    search,
    status,
    customer,
    origin_warehouse,
    transport,
    ordering,
  }

  const { data, isLoading, isError } = useShipmentList(params)
  const canAdd = usePermission('shipments.add_shipment')

  const handleParamsChange = useCallback(
    (updates: Partial<ShipmentListParams>) => {
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
      if ('customer' in updates) {
        if (updates.customer !== undefined) {
          next.set('customer', String(updates.customer))
        } else {
          next.delete('customer')
        }
      }
      if ('origin_warehouse' in updates) {
        if (updates.origin_warehouse !== undefined) {
          next.set('origin_warehouse', String(updates.origin_warehouse))
        } else {
          next.delete('origin_warehouse')
        }
      }
      if ('transport' in updates) {
        if (updates.transport !== undefined) {
          next.set('transport', String(updates.transport))
        } else {
          next.delete('transport')
        }
      }
      if ('ordering' in updates) {
        if (updates.ordering) {
          next.set('ordering', updates.ordering)
        } else {
          next.delete('ordering')
        }
      }

      router.push(`/shipments?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Envíos"
        action={
          canAdd ? (
            <Link href="/shipments/new">
              <Button>Nuevo Envío</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar los envíos. Intente nuevamente.
        </div>
      ) : (
        <ShipmentsTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
