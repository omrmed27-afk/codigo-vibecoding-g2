'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useSupplier, useDeleteSupplier } from '@/hooks/suppliers/use-suppliers'
import type { AxiosError } from 'axios'

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useSupplier(id)
  const deleteSupplier = useDeleteSupplier()
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
          <p className="text-gray-500 text-lg mb-4">Proveedor no encontrado</p>
          <Link href="/suppliers">
            <Button variant="outline">Volver a Proveedores</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar el proveedor. Intente nuevamente.
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
            <Link href="/suppliers">
              <Button variant="outline" size="sm">Volver</Button>
            </Link>
            <Link href={`/suppliers/${id}/edit`}>
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
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Contacto</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.contact_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.phone}</dd>
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
        title="Eliminar Proveedor"
        description={`¿Está seguro de que desea eliminar "${data.name}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteSupplier.mutate(id, {
            onSuccess: () => {
              router.push('/suppliers')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteSupplier.isPending}
      />
    </div>
  )
}
