'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AxiosError } from 'axios'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ShipmentForm from '@/components/shipments/ShipmentForm'
import { useShipment } from '@/hooks/shipments/use-shipments'

export default function EditShipmentPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useShipment(id)

  const is404 = isError && (error as AxiosError)?.response?.status === 404

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
          <p className="text-gray-500 text-lg mb-4">Envío no encontrado</p>
          <Link href="/shipments">
            <Button variant="outline">Volver a Envíos</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar el envío. Intente nuevamente.
        </div>
      </div>
    )
  }

  if (!data) return null

  const isEditable = data.status === 'pending'

  return (
    <div className="p-6">
      <PageHeader
        title="Editar Envío"
        action={
          <Link href={`/shipments/${id}`}>
            <Button variant="outline">Volver</Button>
          </Link>
        }
      />

      {!isEditable && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800">
            Solo se pueden editar envíos en estado pendiente.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Este envío está actualmente en estado{' '}
            <span className="font-semibold capitalize">{data.status.replace(/_/g, ' ')}</span>{' '}
            y no puede ser modificado.
          </p>
        </div>
      )}

      <fieldset disabled={!isEditable} className={!isEditable ? 'opacity-60 pointer-events-none' : undefined}>
        <ShipmentForm
          mode="edit"
          defaultValues={data}
          onSuccess={() => router.push(`/shipments/${id}`)}
        />
      </fieldset>
    </div>
  )
}
