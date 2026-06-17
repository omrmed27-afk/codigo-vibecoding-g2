'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AxiosError } from 'axios'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ShipmentDetail from '@/components/shipments/ShipmentDetail'
import AssignTransportDialog from '@/components/shipments/AssignTransportDialog'
import {
  useShipment,
  useMarkInTransit,
  useMarkDelivered,
  useCancelShipment,
  useDeleteShipment,
} from '@/hooks/shipments/use-shipments'

export default function ShipmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data, isLoading, isError, error } = useShipment(id)
  const markInTransit = useMarkInTransit()
  const markDelivered = useMarkDelivered()
  const cancelShipment = useCancelShipment()
  const deleteShipment = useDeleteShipment()

  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showInTransitDialog, setShowInTransitDialog] = useState(false)
  const [showDeliverDialog, setShowDeliverDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  const { status } = data

  const canEdit = status === 'pending'
  const canAssignTransport = status === 'pending'
  const canMarkInTransit = status === 'picked_up'
  const canMarkDelivered = status === 'picked_up' || status === 'in_transit'
  const canCancel =
    status === 'pending' || status === 'picked_up' || status === 'in_transit'
  const canDelete = status === 'pending' || status === 'cancelled'

  return (
    <div className="p-6">
      <PageHeader
        title={`Detalle del Envío`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/shipments">
              <Button variant="outline" size="sm">
                Volver
              </Button>
            </Link>

            {canEdit && (
              <Link href={`/shipments/${id}/edit`}>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </Link>
            )}

            {canAssignTransport && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAssignDialog(true)}
              >
                Asignar Transporte
              </Button>
            )}

            {canMarkInTransit && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowInTransitDialog(true)}
              >
                Marcar En Tránsito
              </Button>
            )}

            {canMarkDelivered && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setShowDeliverDialog(true)}
              >
                Marcar Entregado
              </Button>
            )}

            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancelar Envío
              </Button>
            )}

            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                Eliminar
              </Button>
            )}
          </div>
        }
      />

      <ShipmentDetail shipment={data} />

      {/* Assign Transport Dialog */}
      <AssignTransportDialog
        shipmentId={id}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
      />

      {/* Mark In Transit Confirm */}
      <ConfirmDialog
        open={showInTransitDialog}
        title="Marcar como En Tránsito"
        description={`¿Confirma que el envío "${data.tracking_number}" está en camino? El estado cambiará a En Tránsito.`}
        confirmLabel="Marcar En Tránsito"
        onConfirm={() => {
          markInTransit.mutate(id, {
            onSuccess: () => setShowInTransitDialog(false),
          })
        }}
        onCancel={() => setShowInTransitDialog(false)}
        isLoading={markInTransit.isPending}
      />

      {/* Mark Delivered Confirm */}
      <ConfirmDialog
        open={showDeliverDialog}
        title="Marcar como Entregado"
        description={`¿Está seguro de que desea marcar el envío "${data.tracking_number}" como entregado? Esta acción no se puede deshacer.`}
        confirmLabel="Marcar Entregado"
        onConfirm={() => {
          markDelivered.mutate(id, {
            onSuccess: () => setShowDeliverDialog(false),
          })
        }}
        onCancel={() => setShowDeliverDialog(false)}
        isLoading={markDelivered.isPending}
      />

      {/* Cancel Confirm */}
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancelar Envío"
        description={`¿Está seguro de que desea cancelar el envío "${data.tracking_number}"? Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar Envío"
        onConfirm={() => {
          cancelShipment.mutate(id, {
            onSuccess: () => setShowCancelDialog(false),
          })
        }}
        onCancel={() => setShowCancelDialog(false)}
        isLoading={cancelShipment.isPending}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar Envío"
        description={`¿Está seguro de que desea eliminar permanentemente el envío "${data.tracking_number}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => {
          deleteShipment.mutate(id, {
            onSuccess: () => {
              router.push('/shipments')
            },
          })
        }}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={deleteShipment.isPending}
      />
    </div>
  )
}
