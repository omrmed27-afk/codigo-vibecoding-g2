'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { getList, getById, create, update, remove } from '@/services/drivers'
import type { DriverListParams, CreateDriverBody, UpdateDriverBody } from '@/types/drivers'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error?.message ?? fallback
}

export function useDriverList(params: DriverListParams) {
  return useQuery({
    queryKey: queryKeys.drivers.list(params),
    queryFn: () => getList(params),
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(id),
    queryFn: () => getById(id),
    enabled: !!id,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDriverBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all })
      toast.success('Conductor creado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear el conductor.'))
    },
  })
}

export function useUpdateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateDriverBody }) =>
      update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers.detail(variables.id),
      })
      toast.success('Conductor actualizado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el conductor.'))
    },
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all })
      toast.success('Conductor eliminado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el conductor.'))
    },
  })
}
