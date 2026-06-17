import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { queryKeys } from '@/lib/query-keys'
import {
  useSupplierList,
  useSupplier,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from '@/hooks/suppliers/use-suppliers'
import { toast } from 'sonner'
import type { Supplier } from '@/types/suppliers'
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

const SUPPLIER: Supplier = {
  id: 1,
  name: 'Tech Supplier Inc',
  contact_name: 'John Doe',
  email: 'john@techsupply.com',
  phone: '+1987654321',
  address: '456 Industrial Ave',
  city: 'Los Angeles',
  country: 'US',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Supplier> = { count: 1, next: null, previous: null, results: [SUPPLIER] }

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

describe('useSupplierList', () => {
  it('isPending initially then resolves to list data', async () => {
    server.use(http.get(`${API_BASE}/suppliers/`, () => HttpResponse.json(PAGE)))

    const qc = makeClient()
    const { result } = renderHook(() => useSupplierList({}), { wrapper: makeWrapper(qc) })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results).toHaveLength(1)
    expect(result.current.data?.results[0].name).toBe('Tech Supplier Inc')
  })

  it('registers correct queryKey in cache', async () => {
    server.use(http.get(`${API_BASE}/suppliers/`, () => HttpResponse.json(PAGE)))

    const params = { search: 'tech', page: 1 }
    const qc = makeClient()
    renderHook(() => useSupplierList(params), { wrapper: makeWrapper(qc) })

    const queries = qc.getQueryCache().findAll({ queryKey: queryKeys.suppliers.list(params) })
    expect(queries).toHaveLength(1)
  })
})

describe('useSupplier', () => {
  it('fetches single supplier by id', async () => {
    server.use(http.get(`${API_BASE}/suppliers/1/`, () => HttpResponse.json(SUPPLIER)))

    const qc = makeClient()
    const { result } = renderHook(() => useSupplier(1), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.email).toBe('john@techsupply.com')
  })

  it('does not fetch when id is 0 (enabled: false)', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useSupplier(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateSupplier', () => {
  it('invalidates suppliers.all on success', async () => {
    server.use(
      http.post(`${API_BASE}/suppliers/`, () => HttpResponse.json(SUPPLIER, { status: 201 }))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateSupplier(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({
        name: 'Tech Supplier Inc',
        contact_name: 'John Doe',
        email: 'john@techsupply.com',
        phone: '+1987654321',
        address: '456 Industrial Ave',
        city: 'Los Angeles',
        country: 'US',
      })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.suppliers.all })
  })
})

describe('useUpdateSupplier', () => {
  it('invalidates suppliers.all and detail on success', async () => {
    server.use(
      http.patch(`${API_BASE}/suppliers/1/`, () => HttpResponse.json(SUPPLIER))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateSupplier(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({ id: 1, body: { name: 'Updated' } })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.suppliers.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.suppliers.detail(1) })
  })
})

describe('useDeleteSupplier', () => {
  it('invalidates suppliers.all on success', async () => {
    server.use(
      http.delete(`${API_BASE}/suppliers/1/`, () => new HttpResponse(null, { status: 204 }))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate(1)
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.suppliers.all })
  })
})

describe('onError paths — toast.error called on mutation failure', () => {
  it('useCreateSupplier: toast.error on 400', async () => {
    server.use(
      http.post(`${API_BASE}/suppliers/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad data' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useCreateSupplier(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate({
        name: 'T', contact_name: 'X', email: 'a@b.com',
        phone: '123', address: '1', city: 'X', country: 'Y',
      })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it('useUpdateSupplier: toast.error on 400', async () => {
    server.use(
      http.patch(`${API_BASE}/suppliers/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad data' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateSupplier(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate({ id: 1, body: { name: 'X' } })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it('useDeleteSupplier: toast.error on 500', async () => {
    server.use(
      http.delete(`${API_BASE}/suppliers/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Server error' } }, { status: 500 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate(1)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
