'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import StatusBadge from '@/components/shared/StatusBadge'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import AssignDriverDialog from '@/components/transport/AssignDriverDialog'
import { useTransport, useDeleteTransport, useUnassignDriver } from '@/hooks/transport/use-transport'
import type { AxiosError } from 'axios'

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  in_transit: 'En Tránsito',
  maintenance: 'Mantenimiento',
}

const TYPE_LABELS: Record<string, string> = {
  truck: 'Camión',
  van: 'Furgoneta',
  motorcycle: 'Motocicleta',
  bicycle: 'Bicicleta',
}

export default function TransportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useTransport(id)
  const deleteTransport = useDeleteTransport()
  const unassignDriver = useUnassignDriver()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUnassignDialog, setShowUnassignDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)

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
          <p className="text-gray-500 text-lg mb-4">Vehículo no encontrado</p>
          <Link href="/transport">
            <Button variant="outline">Volver a Transporte</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          Error al cargar el vehículo. Intente nuevamente.
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
            <Link href="/transport">
              <Button variant="outline" size="sm">Volver</Button>
            </Link>
            <Link href={`/transport/${id}/edit`}>
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
            <dt className="text-sm font-medium text-gray-500">Tipo</dt>
            <dd className="mt-1">
              <StatusBadge
                status={data.type}
                label={TYPE_LABELS[data.type]}
              />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Placa</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.plate_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Capacidad (kg)</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.capacity_kg}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Capacidad (m³)</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.capacity_m3}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
              <StatusBadge
                status={data.status}
                label={STATUS_LABELS[data.status]}
              />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Conductor</dt>
            <dd className="mt-1">
              {data.driver ? (
                <div className="flex items-center gap-3">
                  <Link href={`/drivers/${data.driver.id}`} className="hover:underline">
                    <p className="text-sm text-gray-900">{data.driver.license_number}</p>
                    <p className="text-xs text-gray-500">{data.driver.phone}</p>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setShowUnassignDialog(true)}
                  >
                    Desasignar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Sin conductor asignado</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAssignDialog(true)}
                  >
                    Asignar Conductor
                  </Button>
                </div>
              )}
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
        title="Eliminar Vehículo"
        description="Esto eliminará permanentemente el vehículo. Esta acción no se puede deshacer."
        onConfirm={() => {
          deleteTransport.mutate(id, {
            onSuccess: () => {
              router.push('/transport')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteTransport.isPending}
      />

      <ConfirmDialog
        open={showUnassignDialog}
        title="Desasignar Conductor"
        description="Esto eliminará el conductor actualmente asignado de este vehículo."
        confirmLabel="Desasignar"
        onConfirm={() => {
          unassignDriver.mutate(id, {
            onSuccess: () => {
              setShowUnassignDialog(false)
            },
          })
        }}
        onCancel={() => setShowUnassignDialog(false)}
        isLoading={unassignDriver.isPending}
      />

      <AssignDriverDialog
        transportId={id}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
      />
    </div>
  )
}
