'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { getList, getById, create, update, remove } from '@/services/customers'
import type { CustomerListParams, CreateCustomerBody, UpdateCustomerBody } from '@/types/customers'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error?.message ?? fallback
}

export function useCustomerList(params: CustomerListParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => getList(params),
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => getById(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCustomerBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      toast.success('Cliente creado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear el cliente.'))
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateCustomerBody }) =>
      update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(variables.id),
      })
      toast.success('Cliente actualizado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el cliente.'))
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      toast.success('Cliente eliminado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el cliente.'))
    },
  })
}
