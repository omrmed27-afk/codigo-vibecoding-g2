'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  getList, create, update, remove,
  assignGroups, getGroups, createGroup, deleteGroup,
  getGroupDetail, assignPermissions, getPermissions,
} from '@/services/users'
import type { AssignGroupsBody, AssignPermissionsBody, CreateUserBody, UpdateUserBody, UserListParams } from '@/types/users'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiError>
  return axiosError.response?.data?.error?.message ?? fallback
}

export function useUserList(params: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => getList(params),
  })
}

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.users.groups,
    queryFn: getGroups,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateUserBody) => create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('Usuario creado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear el usuario.'))
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateUserBody }) => update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('Usuario actualizado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo actualizar el usuario.'))
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('Usuario eliminado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el usuario.'))
    },
  })
}

export function useAssignGroups() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AssignGroupsBody }) =>
      assignGroups(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('Grupos actualizados.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudieron actualizar los grupos.'))
    },
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createGroup(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.groups })
      toast.success('Rol creado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo crear el rol.'))
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.groups })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      toast.success('Rol eliminado.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el rol.'))
    },
  })
}

export function useGroupDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.users.groupDetail(id ?? 0),
    queryFn: () => getGroupDetail(id!),
    enabled: id !== null,
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.users.permissions,
    queryFn: getPermissions,
  })
}

export function useAssignPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AssignPermissionsBody }) =>
      assignPermissions(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.groupDetail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.groups })
      toast.success('Permisos actualizados.')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'No se pudieron actualizar los permisos.'))
    },
  })
}
