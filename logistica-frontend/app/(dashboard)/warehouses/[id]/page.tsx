'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useWarehouse, useDeleteWarehouse } from '@/hooks/warehouses/use-warehouses'
import type { AxiosError } from 'axios'

export default function WarehouseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useWarehouse(id)
  const deleteWarehouse = useDeleteWarehouse()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
        title={data.name}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/warehouses">
              <Button variant="outline" size="sm">Volver</Button>
            </Link>
            <Link href={`/warehouses/${id}/edit`}>
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
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <StatusBadge
                status={data.is_active ? 'active' : 'inactive'}
                label={data.is_active ? 'Activa' : 'Inactiva'}
              />
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Dirección</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.address}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.city}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">País</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.country}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Latitud</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {data.latitude ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Longitud</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {data.longitude ?? '—'}
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
        title="Eliminar Bodega"
        description={`¿Está seguro de que desea eliminar "${data.name}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteWarehouse.mutate(id, {
            onSuccess: () => {
              router.push('/warehouses')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteWarehouse.isPending}
      />
    </div>
  )
}
