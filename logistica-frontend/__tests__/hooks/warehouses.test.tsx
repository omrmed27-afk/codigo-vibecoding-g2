import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { queryKeys } from '@/lib/query-keys'
import {
  useWarehouseList,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useToggleWarehouseActive,
} from '@/hooks/warehouses/use-warehouses'
import { toast } from 'sonner'
import type { Warehouse } from '@/types/warehouses'
import type { PaginatedResponse } from '@/types/api'

beforeEach(() => vi.clearAllMocks())

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

const API_BASE = 'http://localhost:8000/api'

const WAREHOUSE: Warehouse = {
  id: 1,
  name: 'Main Warehouse',
  address: '123 Main St',
  city: 'Chicago',
  country: 'US',
  latitude: null,
  longitude: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Warehouse> = { count: 1, next: null, previous: null, results: [WAREHOUSE] }

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useWarehouseList', () => {
  it('isPending initially then resolves to list data', async () => {
    server.use(http.get(`${API_BASE}/warehouses/`, () => HttpResponse.json(PAGE)))

    const qc = makeClient()
    const { result } = renderHook(() => useWarehouseList({}), { wrapper: makeWrapper(qc) })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results).toHaveLength(1)
    expect(result.current.data?.results[0].name).toBe('Main Warehouse')
    expect(result.current.data?.count).toBe(1)
  })

  it('registers correct queryKey in cache', async () => {
    server.use(http.get(`${API_BASE}/warehouses/`, () => HttpResponse.json(PAGE)))

    const params = { search: 'test', page: 2 }
    const qc = makeClient()
    renderHook(() => useWarehouseList(params), { wrapper: makeWrapper(qc) })

    const queries = qc.getQueryCache().findAll({ queryKey: queryKeys.warehouses.list(params) })
    expect(queries).toHaveLength(1)
  })
})

describe('useWarehouse', () => {
  it('fetches single warehouse by id', async () => {
    server.use(http.get(`${API_BASE}/warehouses/1/`, () => HttpResponse.json(WAREHOUSE)))

    const qc = makeClient()
    const { result } = renderHook(() => useWarehouse(1), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.name).toBe('Main Warehouse')
  })

  it('does not fetch when id is 0 (enabled: false)', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useWarehouse(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateWarehouse', () => {
  it('invalidates warehouses.all on success', async () => {
    server.use(
      http.post(`${API_BASE}/warehouses/`, () => HttpResponse.json(WAREHOUSE, { status: 201 }))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({
        name: 'Test',
        address: '123',
        city: 'X',
        country: 'Y',
        is_active: true,
      })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.warehouses.all })
  })
})

describe('useUpdateWarehouse', () => {
  it('invalidates warehouses.all and detail on success', async () => {
    server.use(
      http.patch(`${API_BASE}/warehouses/1/`, () => HttpResponse.json(WAREHOUSE))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateWarehouse(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({ id: 1, body: { name: 'Updated' } })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.warehouses.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.warehouses.detail(1) })
  })
})

describe('useDeleteWarehouse', () => {
  it('invalidates warehouses.all on success', async () => {
    server.use(
      http.delete(`${API_BASE}/warehouses/1/`, () => new HttpResponse(null, { status: 204 }))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteWarehouse(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate(1)
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.warehouses.all })
  })
})

describe('useToggleWarehouseActive', () => {
  it('invalidates warehouses.all and detail on success', async () => {
    server.use(
      http.patch(`${API_BASE}/warehouses/1/`, () =>
        HttpResponse.json({ ...WAREHOUSE, is_active: false })
      )
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useToggleWarehouseActive(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({ id: 1, is_active: false })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.warehouses.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.warehouses.detail(1) })
  })
})

describe('onError paths — toast.error called on mutation failure', () => {
  it('useCreateWarehouse: toast.error on 400', async () => {
    server.use(
      http.post(`${API_BASE}/warehouses/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad data' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate({ name: 'T', address: '1', city: 'X', country: 'Y', is_active: true })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it('useUpdateWarehouse: toast.error on 400', async () => {
    server.use(
      http.patch(`${API_BASE}/warehouses/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad data' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateWarehouse(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate({ id: 1, body: { name: 'X' } })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it('useDeleteWarehouse: toast.error on 500', async () => {
    server.use(
      http.delete(`${API_BASE}/warehouses/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Server error' } }, { status: 500 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteWarehouse(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate(1)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it('useToggleWarehouseActive: toast.error on 500', async () => {
    server.use(
      http.patch(`${API_BASE}/warehouses/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Server error' } }, { status: 500 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useToggleWarehouseActive(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate({ id: 1, is_active: false })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
