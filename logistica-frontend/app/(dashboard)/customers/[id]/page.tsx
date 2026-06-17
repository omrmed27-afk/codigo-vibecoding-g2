'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useCustomer, useDeleteCustomer } from '@/hooks/customers/use-customers'
import type { AxiosError } from 'axios'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useCustomer(id)
  const deleteCustomer = useDeleteCustomer()
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
          <p className="text-gray-500 text-lg mb-4">Cliente no encontrado</p>
          <Link href="/customers">
            <Button variant="outline">Volver a Clientes</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar el cliente. Intente nuevamente.
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
            <Link href="/customers">
              <Button variant="outline" size="sm">Volver</Button>
            </Link>
            <Link href={`/customers/${id}/edit`}>
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
            <dt className="text-sm font-medium text-gray-500">Tipo</dt>
            <dd className="mt-1">
              <StatusBadge
                status={data.customer_type}
                label={data.customer_type === 'company' ? 'Empresa' : 'Individual'}
              />
            </dd>
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
            <dt className="text-sm font-medium text-gray-500">RUT / NIT</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.tax_id ?? '—'}</dd>
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
        title="Eliminar Cliente"
        description={`¿Está seguro de que desea eliminar "${data.name}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteCustomer.mutate(id, {
            onSuccess: () => {
              router.push('/customers')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteCustomer.isPending}
      />
    </div>
  )
}
