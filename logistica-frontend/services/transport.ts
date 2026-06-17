import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Transport,
  TransportListParams,
  CreateTransportBody,
  UpdateTransportBody,
  AssignDriverBody,
} from '@/types/transport'

export async function getList(
  params: TransportListParams
): Promise<PaginatedResponse<Transport>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.type) query.set('type', params.type)
  if (params.driver !== undefined) query.set('driver', String(params.driver))
  if (params.ordering) query.set('ordering', params.ordering)

  const res = await api.get<PaginatedResponse<Transport>>(
    `/transport/?${query.toString()}`
  )
  return res.data
}

export async function getById(id: number): Promise<Transport> {
  const res = await api.get<Transport>(`/transport/${id}/`)
  return res.data
}

export async function create(body: CreateTransportBody): Promise<Transport> {
  const res = await api.post<Transport>('/transport/', body)
  return res.data
}

export async function update(id: number, body: UpdateTransportBody): Promise<Transport> {
  const res = await api.patch<Transport>(`/transport/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/transport/${id}/`)
}

export async function assignDriver(
  id: number,
  body: AssignDriverBody
): Promise<Transport> {
  const res = await api.post<Transport>(`/transport/${id}/assign-driver/`, body)
  return res.data
}

export async function unassignDriver(id: number): Promise<Transport> {
  const res = await api.post<Transport>(`/transport/${id}/unassign-driver/`, {})
  return res.data
}
