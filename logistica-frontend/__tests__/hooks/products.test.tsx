import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  useProductList,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/products/use-products'
import type { Product } from '@/types/products'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: {
    accessToken: null as string | null,
    logout: vi.fn(),
    setAccessToken: vi.fn(),
  },
}))
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => mockAuthState },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

const API_BASE = 'http://localhost:8000/api'

const PRODUCT: Product = {
  id: 1,
  name: 'Laptop Pro',
  description: null,
  sku: 'LP-001',
  weight_kg: '1.500',
  width_cm: '35.50',
  height_cm: '23.00',
  depth_cm: '18.50',
  unit_price: '1299.99',
  stock_quantity: 50,
  supplier: { id: 1, name: 'Tech Supplier' },
  warehouse: { id: 1, name: 'Main Warehouse' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Product> = { count: 1, next: null, previous: null, results: [PRODUCT] }

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
}
function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

const CREATE_PAYLOAD = {
  name: 'Laptop Pro', sku: 'LP-001', weight_kg: '1.5', width_cm: '35.5',
  height_cm: '23.0', depth_cm: '18.5', unit_price: '1299.99',
  stock_quantity: 50, supplier: 1, warehouse: 1,
}

describe('useProductList', () => {
  it('isPending initially then resolves to list data', async () => {
    server.use(http.get(`${API_BASE}/products/`, () => HttpResponse.json(PAGE)))
    const qc = makeClient()
    const { result } = renderHook(() => useProductList({}), { wrapper: makeWrapper(qc) })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].sku).toBe('LP-001')
  })

  it('registers correct queryKey', async () => {
    server.use(http.get(`${API_BASE}/products/`, () => HttpResponse.json(PAGE)))
    const params = { supplier: 1, warehouse: 1 }
    const qc = makeClient()
    renderHook(() => useProductList(params), { wrapper: makeWrapper(qc) })
    expect(qc.getQueryCache().findAll({ queryKey: queryKeys.products.list(params) })).toHaveLength(1)
  })
})

describe('useProduct', () => {
  it('fetches single product by id', async () => {
    server.use(http.get(`${API_BASE}/products/1/`, () => HttpResponse.json(PRODUCT)))
    const qc = makeClient()
    const { result } = renderHook(() => useProduct(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.unit_price).toBe('1299.99')
  })

  it('does not fetch when id is 0', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useProduct(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateProduct', () => {
  it('invalidates products.all on success', async () => {
    server.use(http.post(`${API_BASE}/products/`, () => HttpResponse.json(PRODUCT, { status: 201 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateProduct(), { wrapper: makeWrapper(qc) })

    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.products.all })
  })

  it('toast.error on 400', async () => {
    server.use(
      http.post(`${API_BASE}/products/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useCreateProduct(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUpdateProduct', () => {
  it('invalidates products.all and detail on success', async () => {
    server.use(http.patch(`${API_BASE}/products/1/`, () => HttpResponse.json(PRODUCT)))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateProduct(), { wrapper: makeWrapper(qc) })

    await act(async () => { result.current.mutate({ id: 1, body: { unit_price: '999.99' } }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.products.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.products.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(
      http.patch(`${API_BASE}/products/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateProduct(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { name: 'X' } }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useDeleteProduct', () => {
  it('invalidates products.all on success', async () => {
    server.use(http.delete(`${API_BASE}/products/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: makeWrapper(qc) })

    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.products.all })
  })

  it('toast.error on 500', async () => {
    server.use(
      http.delete(`${API_BASE}/products/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Err' } }, { status: 500 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
