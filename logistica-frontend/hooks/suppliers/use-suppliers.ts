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
} from '@/services/suppliers'
import type { SupplierListParams, UpdateSupplierBody, CreateSupplierBody } from '@/types/suppliers'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error?.message ?? fallback
}

export function useSupplierList(params: SupplierListParams) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(params),
    queryFn: () => getList(params),
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: () => getById(id),
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSupplierBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all })
      toast.success('Proveedor creado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear el proveedor.'))
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateSupplierBody }) =>
      update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(variables.id),
      })
      toast.success('Proveedor actualizado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el proveedor.'))
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all })
      toast.success('Proveedor eliminado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el proveedor.'))
    },
  })
}
