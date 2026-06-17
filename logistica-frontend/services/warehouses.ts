import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Warehouse,
  WarehouseListParams,
  CreateWarehouseBody,
  UpdateWarehouseBody,
} from '@/types/warehouses'

export async function getList(
  params: WarehouseListParams
): Promise<PaginatedResponse<Warehouse>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  if (params.is_active !== undefined) query.set('is_active', String(params.is_active))
  if (params.city) query.set('city', params.city)
  if (params.country) query.set('country', params.country)
  if (params.ordering) query.set('ordering', params.ordering)

  const res = await api.get<PaginatedResponse<Warehouse>>(
    `/warehouses/?${query.toString()}`
  )
  return res.data
}

export async function getById(id: number): Promise<Warehouse> {
  const res = await api.get<Warehouse>(`/warehouses/${id}/`)
  return res.data
}

export async function create(body: CreateWarehouseBody): Promise<Warehouse> {
  const res = await api.post<Warehouse>('/warehouses/', body)
  return res.data
}

export async function update(id: number, body: UpdateWarehouseBody): Promise<Warehouse> {
  const res = await api.patch<Warehouse>(`/warehouses/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/warehouses/${id}/`)
}

export async function toggleActive(id: number, is_active: boolean): Promise<Warehouse> {
  return update(id, { is_active })
}
