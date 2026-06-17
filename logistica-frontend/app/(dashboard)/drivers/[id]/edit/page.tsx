'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import DriverForm from '@/components/drivers/DriverForm'
import { useDriver } from '@/hooks/drivers/use-drivers'
import type { AxiosError } from 'axios'

export default function EditDriverPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useDriver(id)

  const is404 =
    isError && (error as AxiosError)?.response?.status === 404

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
          <p className="text-gray-500 text-lg mb-4">Conductor no encontrado</p>
          <Link href="/drivers">
            <Button variant="outline">Volver a Conductores</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar el conductor. Intente nuevamente.
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6">
      <PageHeader
        title="Editar Conductor"
        action={
          <Link href={`/drivers/${id}`}>
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />
      <DriverForm
        mode="edit"
        defaultValues={data}
        onSuccess={() => router.push(`/drivers/${id}`)}
      />
    </div>
  )
}
