'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import CustomersTable from '@/components/customers/CustomersTable'
import { useCustomerList } from '@/hooks/customers/use-customers'
import { usePermission } from '@/hooks/auth/use-permission'
import type { CustomerListParams, CustomerType } from '@/types/customers'

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''
  const customerTypeRaw = searchParams.get('customer_type')
  const customer_type =
    customerTypeRaw === 'company' || customerTypeRaw === 'individual'
      ? (customerTypeRaw as CustomerType)
      : undefined
  const city = searchParams.get('city') ?? ''
  const country = searchParams.get('country') ?? ''
  const ordering =
    (searchParams.get('ordering') as CustomerListParams['ordering']) ?? undefined

  const params: CustomerListParams = {
    page,
    search,
    customer_type,
    city,
    country,
    ordering,
  }

  const { data, isLoading, isError } = useCustomerList(params)
  const canAdd = usePermission('customers.add_customer')

  const handleParamsChange = useCallback(
    (updates: Partial<CustomerListParams>) => {
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
      if ('customer_type' in updates) {
        if (updates.customer_type) {
          next.set('customer_type', updates.customer_type)
        } else {
          next.delete('customer_type')
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

      router.push(`/customers?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Clientes"
        action={
          canAdd ? (
            <Link href="/customers/new">
              <Button>Nuevo Cliente</Button>
            </Link>
          ) : undefined
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar los clientes. Intente nuevamente.
        </div>
      ) : (
        <CustomersTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}
    </div>
  )
}
