'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import WarehouseForm from '@/components/warehouses/WarehouseForm'
import { useWarehouse } from '@/hooks/warehouses/use-warehouses'
import type { AxiosError } from 'axios'

export default function EditWarehousePage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useWarehouse(id)

  const is404 =
    isError &&
    (error as AxiosError)?.response?.status === 404

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (is404 || (!isLoading && !data)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Bodega no encontrada</p>
          <Link href="/warehouses">
            <Button variant="outline">Volver a Bodegas</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar la bodega. Intente nuevamente.
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6">
      <PageHeader
        title="Editar Bodega"
        action={
          <Link href={`/warehouses/${id}`}>
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <WarehouseForm
        mode="edit"
        defaultValues={data}
        onSuccess={() => router.push(`/warehouses/${id}`)}
      />
    </div>
  )
}
