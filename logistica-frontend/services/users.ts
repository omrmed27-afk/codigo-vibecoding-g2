import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  AppUser,
  AssignGroupsBody,
  AssignPermissionsBody,
  CreateUserBody,
  Group,
  GroupWithPermissions,
  Permission,
  UpdateUserBody,
  UserListParams,
} from '@/types/users'

export async function getList(params: UserListParams): Promise<PaginatedResponse<AppUser>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  const res = await api.get<PaginatedResponse<AppUser>>(`/auth/users/?${query.toString()}`)
  return res.data
}

export async function create(body: CreateUserBody): Promise<AppUser> {
  const res = await api.post<AppUser>('/auth/users/', body)
  return res.data
}

export async function update(id: number, body: UpdateUserBody): Promise<AppUser> {
  const res = await api.patch<AppUser>(`/auth/users/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/auth/users/${id}/`)
}

export async function assignGroups(id: number, body: AssignGroupsBody): Promise<AppUser> {
  const res = await api.post<AppUser>(`/auth/users/${id}/assign-groups/`, body)
  return res.data
}

export async function getGroups(): Promise<Group[]> {
  const res = await api.get<Group[]>('/auth/groups/')
  return res.data
}

export async function createGroup(name: string): Promise<Group> {
  const res = await api.post<Group>('/auth/groups/', { name })
  return res.data
}

export async function deleteGroup(id: number): Promise<void> {
  await api.delete(`/auth/groups/${id}/`)
}

export async function getGroupDetail(id: number): Promise<GroupWithPermissions> {
  const res = await api.get<GroupWithPermissions>(`/auth/groups/${id}/`)
  return res.data
}

export async function assignPermissions(id: number, body: AssignPermissionsBody): Promise<GroupWithPermissions> {
  const res = await api.post<GroupWithPermissions>(`/auth/groups/${id}/assign-permissions/`, body)
  return res.data
}

export async function getPermissions(): Promise<Permission[]> {
  const res = await api.get<Permission[]>('/auth/permissions/')
  return res.data
}
