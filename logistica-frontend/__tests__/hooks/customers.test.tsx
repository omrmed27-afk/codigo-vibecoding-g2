import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  useCustomerList,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '@/hooks/customers/use-customers'
import type { Customer } from '@/types/customers'
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

const CUSTOMER: Customer = {
  id: 1,
  name: 'Acme Corp',
  customer_type: 'company',
  email: 'contact@acme.com',
  phone: '+1234567890',
  address: '123 Main St',
  city: 'New York',
  country: 'US',
  tax_id: 'US12345678',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Customer> = { count: 1, next: null, previous: null, results: [CUSTOMER] }

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

describe('useCustomerList', () => {
  it('isPending initially then resolves to list data', async () => {
    server.use(http.get(`${API_BASE}/customers/`, () => HttpResponse.json(PAGE)))

    const qc = makeClient()
    const { result } = renderHook(() => useCustomerList({}), { wrapper: makeWrapper(qc) })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results).toHaveLength(1)
    expect(result.current.data?.results[0].customer_type).toBe('company')
  })

  it('registers correct queryKey in cache', async () => {
    server.use(http.get(`${API_BASE}/customers/`, () => HttpResponse.json(PAGE)))

    const params = { customer_type: 'company' as const, page: 1 }
    const qc = makeClient()
    renderHook(() => useCustomerList(params), { wrapper: makeWrapper(qc) })

    const queries = qc.getQueryCache().findAll({ queryKey: queryKeys.customers.list(params) })
    expect(queries).toHaveLength(1)
  })
})

describe('useCustomer', () => {
  it('fetches single customer by id', async () => {
    server.use(http.get(`${API_BASE}/customers/1/`, () => HttpResponse.json(CUSTOMER)))

    const qc = makeClient()
    const { result } = renderHook(() => useCustomer(1), { wrapper: makeWrapper(qc) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
    expect(result.current.data?.tax_id).toBe('US12345678')
  })

  it('does not fetch when id is 0 (enabled: false)', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useCustomer(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateCustomer', () => {
  it('invalidates customers.all on success', async () => {
    server.use(
      http.post(`${API_BASE}/customers/`, () => HttpResponse.json(CUSTOMER, { status: 201 }))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateCustomer(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({
        name: 'Acme', customer_type: 'company', email: 'a@b.com',
        phone: '123', address: '1 St', city: 'NY', country: 'US',
      })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.customers.all })
  })

  it('toast.error on 400', async () => {
    server.use(
      http.post(`${API_BASE}/customers/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad data' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useCreateCustomer(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate({
        name: 'X', customer_type: 'individual', email: 'a@b.com',
        phone: '1', address: '1', city: 'X', country: 'Y',
      })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUpdateCustomer', () => {
  it('invalidates customers.all and detail on success', async () => {
    server.use(
      http.patch(`${API_BASE}/customers/1/`, () => HttpResponse.json(CUSTOMER))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateCustomer(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate({ id: 1, body: { name: 'Updated' } })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.customers.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.customers.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(
      http.patch(`${API_BASE}/customers/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Bad data' } }, { status: 400 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateCustomer(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate({ id: 1, body: { name: 'X' } })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useDeleteCustomer', () => {
  it('invalidates customers.all on success', async () => {
    server.use(
      http.delete(`${API_BASE}/customers/1/`, () => new HttpResponse(null, { status: 204 }))
    )
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteCustomer(), { wrapper: makeWrapper(qc) })

    await act(async () => {
      result.current.mutate(1)
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.customers.all })
  })

  it('toast.error on 500', async () => {
    server.use(
      http.delete(`${API_BASE}/customers/1/`, () =>
        HttpResponse.json({ error: { code: 'err', message: 'Server error' } }, { status: 500 })
      )
    )
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteCustomer(), { wrapper: makeWrapper(qc) })
    await act(async () => {
      result.current.mutate(1)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
