'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AxiosError } from 'axios'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StopsManager from '@/components/routes/StopsManager'
import { useRoute, useDeleteRoute } from '@/hooks/routes/use-routes'

export default function RouteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useRoute(id)
  const deleteRoute = useDeleteRoute()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
        title={data.name}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/routes">
              <Button variant="outline" size="sm">Volver</Button>
            </Link>
            <Link href={`/routes/${id}/edit`}>
              <Button variant="outline">Editar</Button>
            </Link>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              Eliminar
            </Button>
          </div>
        }
      />

      <div className="space-y-6 max-w-2xl">
        {/* Route fields */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1">
                <StatusBadge status={data.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Bodega de Origen</dt>
              <dd className="mt-1">
                <Link
                  href={`/warehouses/${data.origin_warehouse.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {data.origin_warehouse.name}
                </Link>
                <p className="text-xs text-gray-500">{data.origin_warehouse.city}</p>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Creado</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(data.created_at).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Actualizado</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(data.updated_at).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </dl>
        </div>

        {/* Stops section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <StopsManager routeId={id} stops={sortedStops} mode="view" />
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar Ruta"
        description="Esto eliminará permanentemente la ruta y todas sus paradas. Esta acción no se puede deshacer."
        onConfirm={() => {
          deleteRoute.mutate(id, {
            onSuccess: () => {
              router.push('/routes')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteRoute.isPending}
      />
    </div>
  )
}
