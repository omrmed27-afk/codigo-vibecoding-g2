import api from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type {
  Product,
  ProductListParams,
  CreateProductBody,
  UpdateProductBody,
} from '@/types/products'

export async function getList(
  params: ProductListParams
): Promise<PaginatedResponse<Product>> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.search) query.set('search', params.search)
  if (params.supplier !== undefined) query.set('supplier', String(params.supplier))
  if (params.warehouse !== undefined) query.set('warehouse', String(params.warehouse))
  if (params.ordering) query.set('ordering', params.ordering)

  const res = await api.get<PaginatedResponse<Product>>(
    `/products/?${query.toString()}`
  )
  return res.data
}

export async function getById(id: number): Promise<Product> {
  const res = await api.get<Product>(`/products/${id}/`)
  return res.data
}

export async function create(body: CreateProductBody): Promise<Product> {
  const res = await api.post<Product>('/products/', body)
  return res.data
}

export async function update(id: number, body: UpdateProductBody): Promise<Product> {
  const res = await api.patch<Product>(`/products/${id}/`, body)
  return res.data
}

export async function remove(id: number): Promise<void> {
  await api.delete(`/products/${id}/`)
}
