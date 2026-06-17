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
  getStops,
  addStop,
  removeStop,
} from '@/services/routes'
import type {
  RouteListParams,
  CreateRouteBody,
  UpdateRouteBody,
  AddStopBody,
} from '@/types/routes'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error?.message ?? fallback
}

export function useRouteList(params: RouteListParams) {
  return useQuery({
    queryKey: queryKeys.routes.list(params),
    queryFn: () => getList(params),
  })
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: queryKeys.routes.detail(id),
    queryFn: () => getById(id),
    enabled: !!id,
  })
}

export function useRouteStops(routeId: number) {
  return useQuery({
    queryKey: queryKeys.routes.stops(routeId),
    queryFn: () => getStops(routeId),
    enabled: !!routeId,
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRouteBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes.all })
      toast.success('Ruta creada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear la ruta.'))
    },
  })
}

export function useUpdateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateRouteBody }) =>
      update(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.routes.detail(variables.id),
      })
      toast.success('Ruta actualizada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar la ruta.'))
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes.all })
      toast.success('Ruta eliminada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar la ruta.'))
    },
  })
}

export function useAddStop() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ routeId, body }: { routeId: number; body: AddStopBody }) =>
      addStop(routeId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routes.stops(variables.routeId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.routes.detail(variables.routeId),
      })
      toast.success('Parada agregada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo agregar la parada.'))
    },
  })
}

export function useRemoveStop() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ routeId, stopId }: { routeId: number; stopId: number }) =>
      removeStop(routeId, stopId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.routes.stops(variables.routeId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.routes.detail(variables.routeId),
      })
      toast.success('Parada eliminada.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar la parada.'))
    },
  })
}
