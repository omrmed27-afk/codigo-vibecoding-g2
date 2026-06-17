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
  toggleActive,
} from '@/services/warehouses'
import type { WarehouseListParams, CreateWarehouseBody, UpdateWarehouseBody } from '@/types/warehouses'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return (
    axiosError.response?.data?.error?.message ?? fallback
  )
}

export function useWarehouseList(params: WarehouseListParams) {
  return useQuery({
    queryKey: queryKeys.warehouses.list(params),
    queryFn: () => getList(params),
  })
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id),
    queryFn: () => getById(id),
    enabled: !!id,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateWarehouseBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all })
      toast.success('Bodega creada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear la bodega.'))
    },
  })
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateWarehouseBody }) =>
      update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.warehouses.detail(variables.id),
      })
      toast.success('Bodega actualizada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar la bodega.'))
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all })
      toast.success('Bodega eliminada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar la bodega.'))
    },
  })
}

export function useToggleWarehouseActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      toggleActive(id, is_active),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.warehouses.detail(variables.id),
      })
      toast.success(
        variables.is_active ? 'Bodega activada.' : 'Bodega desactivada.'
      )
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo cambiar el estado de la bodega.'))
    },
  })
}
