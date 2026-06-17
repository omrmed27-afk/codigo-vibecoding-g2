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
  assignDriver,
  unassignDriver,
} from '@/services/transport'
import type {
  TransportListParams,
  CreateTransportBody,
  UpdateTransportBody,
} from '@/types/transport'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error?.message ?? fallback
}

export function useTransportList(params: TransportListParams) {
  return useQuery({
    queryKey: queryKeys.transport.list(params),
    queryFn: () => getList(params),
  })
}

export function useTransport(id: number) {
  return useQuery({
    queryKey: queryKeys.transport.detail(id),
    queryFn: () => getById(id),
    enabled: !!id,
  })
}

export function useCreateTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTransportBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transport.all })
      toast.success('Transporte creado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear el transporte.'))
    },
  })
}

export function useUpdateTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateTransportBody }) =>
      update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transport.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.transport.detail(variables.id),
      })
      toast.success('Transporte actualizado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el transporte.'))
    },
  })
}

export function useDeleteTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transport.all })
      toast.success('Transporte eliminado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el transporte.'))
    },
  })
}

export function useAssignDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, driver_id }: { id: number; driver_id: number }) =>
      assignDriver(id, { driver_id }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transport.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.transport.detail(variables.id),
      })
      toast.success('Conductor asignado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo asignar el conductor.'))
    },
  })
}

export function useUnassignDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unassignDriver(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transport.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.transport.detail(id),
      })
      toast.success('Conductor desasignado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo desasignar el conductor.'))
    },
  })
}
