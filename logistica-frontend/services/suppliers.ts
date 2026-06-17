import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Supplier,
  SupplierListParams,
  CreateSupplierBody,
  UpdateSupplierBody,
} from '@/types/suppliers'

export async function getList(
  params: SupplierListParams
): Promise<PaginatedResponse<Supplier>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  if (params.city) query.set('city', params.city)
  if (params.country) query.set('country', params.country)
  if (params.ordering) query.set('ordering', params.ordering)

  const res = await api.get<PaginatedResponse<Supplier>>(
    `/suppliers/?${query.toString()}`
  )
  return res.data
}

export async function getById(id: number): Promise<Supplier> {
  const res = await api.get<Supplier>(`/suppliers/${id}/`)
  return res.data
}

export async function create(body: CreateSupplierBody): Promise<Supplier> {
  const res = await api.post<Supplier>('/suppliers/', body)
  return res.data
}

export async function update(id: number, body: UpdateSupplierBody): Promise<Supplier> {
  const res = await api.patch<Supplier>(`/suppliers/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/suppliers/${id}/`)
}
