import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Driver,
  DriverListParams,
  CreateDriverBody,
  UpdateDriverBody,
} from '@/types/drivers'

export async function getList(
  params: DriverListParams
): Promise<PaginatedResponse<Driver>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.ordering) query.set('ordering', params.ordering)

  const res = await api.get<PaginatedResponse<Driver>>(
    `/drivers/?${query.toString()}`
  )
  return res.data
}

export async function getById(id: number): Promise<Driver> {
  const res = await api.get<Driver>(`/drivers/${id}/`)
  return res.data
}

export async function create(body: CreateDriverBody): Promise<Driver> {
  const res = await api.post<Driver>('/drivers/', body)
  return res.data
}

export async function update(id: number, body: UpdateDriverBody): Promise<Driver> {
  const res = await api.patch<Driver>(`/drivers/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/drivers/${id}/`)
}
