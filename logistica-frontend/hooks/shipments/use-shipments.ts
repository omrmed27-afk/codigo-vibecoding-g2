'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  getList,
  getById,
  create,
  update,
  remove,
  assignTransport,
  markInTransit,
  markDelivered,
  cancel,
} from '@/services/shipments'
import type {
  ShipmentListParams,
  CreateShipmentBody,
  UpdateShipmentBody,
  AssignTransportBody,
} from '@/types/shipments'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error?.message ?? fallback
}

export function useShipmentList(params: ShipmentListParams) {
  return useQuery({
    queryKey: queryKeys.shipments.list(params),
    queryFn: () => getList(params),
  })
}

export function useShipment(id: number) {
  return useQuery({
    queryKey: queryKeys.shipments.detail(id),
    queryFn: () => getById(id),
    enabled: !!id,
  })
}

export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateShipmentBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
      toast.success('Envío creado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear el envío.'))
    },
  })
}

export function useUpdateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateShipmentBody }) =>
      update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.detail(variables.id),
      })
      toast.success('Envío actualizado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el envío.'))
    },
  })
}

export function useDeleteShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
      toast.success('Envío eliminado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el envío.'))
    },
  })
}

export function useAssignTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AssignTransportBody }) =>
      assignTransport(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.detail(variables.id),
      })
      toast.success('Transporte asignado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo asignar el transporte.'))
    },
  })
}

export function useMarkInTransit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markInTransit(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.detail(id),
      })
      toast.success('Envío en tránsito.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo marcar como en tránsito.'))
    },
  })
}

export function useMarkDelivered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markDelivered(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.detail(id),
      })
      toast.success('Envío entregado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo marcar como entregado.'))
    },
  })
}

export function useCancelShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancel(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.shipments.detail(id),
      })
      toast.success('Envío cancelado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo cancelar el envío.'))
    },
  })
}
