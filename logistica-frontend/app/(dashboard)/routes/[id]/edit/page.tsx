'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AxiosError } from 'axios'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import RouteForm from '@/components/routes/RouteForm'
import StopsManager from '@/components/routes/StopsManager'
import { useRoute } from '@/hooks/routes/use-routes'

export default function EditRoutePage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useRoute(id)

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
          <p className="text-gray-500 text-lg mb-4">Ruta no encontrada</p>
          <Link href="/routes">
            <Button variant="outline">Volver a Rutas</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar la ruta. Intente nuevamente.
        </div>
      </div>
    )
  }

  if (!data) return null

  const sortedStops = [...data.stops].sort((a, b) => a.stop_order - b.stop_order)

  return (
    <div className="p-6">
      <PageHeader
        title="Editar Ruta"
        action={
          <Link href={`/routes/${id}`}>
            <Button variant="outline">Volver a la Ruta</Button>
          </Link>
        }
      />

      <div className="space-y-8 max-w-xl">
        <RouteForm
          mode="edit"
          defaultValues={data}
          onSuccess={() => router.push(`/routes/${id}`)}
        />

        <div className="border-t border-gray-200 pt-6">
          <StopsManager routeId={id} stops={sortedStops} mode="edit" />
        </div>
      </div>
    </div>
  )
}
