import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Customer,
  CustomerListParams,
  CreateCustomerBody,
  UpdateCustomerBody,
} from '@/types/customers'

export async function getList(
  params: CustomerListParams
): Promise<PaginatedResponse<Customer>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  if (params.customer_type) query.set('customer_type', params.customer_type)
  if (params.city) query.set('city', params.city)
  if (params.country) query.set('country', params.country)
  if (params.ordering) query.set('ordering', params.ordering)

  const res = await api.get<PaginatedResponse<Customer>>(
    `/customers/?${query.toString()}`
  )
  return res.data
}

export async function getById(id: number): Promise<Customer> {
  const res = await api.get<Customer>(`/customers/${id}/`)
  return res.data
}

export async function create(body: CreateCustomerBody): Promise<Customer> {
  const res = await api.post<Customer>('/customers/', body)
  return res.data
}

export async function update(id: number, body: UpdateCustomerBody): Promise<Customer> {
  const res = await api.patch<Customer>(`/customers/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/customers/${id}/`)
}
