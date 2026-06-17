'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useDriver, useDeleteDriver } from '@/hooks/drivers/use-drivers'
import type { AxiosError } from 'axios'

export default function DriverDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useDriver(id)
  const deleteDriver = useDeleteDriver()
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
        title={`${data.user.first_name} ${data.user.last_name}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/drivers">
              <Button variant="outline" size="sm">Volver</Button>
            </Link>
            <Link href={`/drivers/${id}/edit`}>
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

      <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Usuario</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.user.username}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Número de Licencia</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.license_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Vencimiento Licencia</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(data.license_expiry).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.phone}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <StatusBadge status={data.status} />
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

      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar Conductor"
        description="Esto eliminará permanentemente al conductor y su cuenta de usuario asociada. Esta acción no se puede deshacer."
        onConfirm={() => {
          deleteDriver.mutate(id, {
            onSuccess: () => {
              router.push('/drivers')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteDriver.isPending}
      />
    </div>
  )
}
