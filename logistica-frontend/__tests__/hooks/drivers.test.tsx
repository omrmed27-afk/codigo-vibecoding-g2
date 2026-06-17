import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { useDriverList, useDriver, useCreateDriver, useUpdateDriver, useDeleteDriver } from '@/hooks/drivers/use-drivers'
import type { Driver } from '@/types/drivers'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

const API_BASE = 'http://localhost:8000/api'

const DRIVER: Driver = {
  id: 1,
  user: { id: 10, username: 'jsmith', email: 'j@ex.com', first_name: 'John', last_name: 'Smith' },
  license_number: 'DL-001',
  license_expiry: '2027-12-31',
  phone: '+1987654321',
  status: 'available',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Driver> = { count: 1, next: null, previous: null, results: [DRIVER] }

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}
function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

const CREATE_PAYLOAD = { username: 'jsmith', password: 'pass1234', email: 'j@ex.com', first_name: 'John', last_name: 'Smith', license_number: 'DL-001', license_expiry: '2027-12-31', phone: '+1987654321', status: 'available' as const }

describe('useDriverList', () => {
  it('isPending initially then resolves', async () => {
    server.use(http.get(`${API_BASE}/drivers/`, () => HttpResponse.json(PAGE)))
    const qc = makeClient()
    const { result } = renderHook(() => useDriverList({}), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].status).toBe('available')
  })

  it('registers correct queryKey', async () => {
    server.use(http.get(`${API_BASE}/drivers/`, () => HttpResponse.json(PAGE)))
    const params = { status: 'available' as const }
    const qc = makeClient()
    renderHook(() => useDriverList(params), { wrapper: makeWrapper(qc) })
    expect(qc.getQueryCache().findAll({ queryKey: queryKeys.drivers.list(params) })).toHaveLength(1)
  })
})

describe('useDriver', () => {
  it('fetches single driver by id', async () => {
    server.use(http.get(`${API_BASE}/drivers/1/`, () => HttpResponse.json(DRIVER)))
    const qc = makeClient()
    const { result } = renderHook(() => useDriver(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.license_number).toBe('DL-001')
  })

  it('does not fetch when id is 0', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useDriver(0), { wrapper: makeWrapper(qc) })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateDriver', () => {
  it('invalidates drivers.all on success', async () => {
    server.use(http.post(`${API_BASE}/drivers/`, () => HttpResponse.json(DRIVER, { status: 201 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.drivers.all })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/drivers/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useCreateDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUpdateDriver', () => {
  it('invalidates drivers.all and detail on success', async () => {
    server.use(http.patch(`${API_BASE}/drivers/1/`, () => HttpResponse.json(DRIVER)))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { status: 'busy' } }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.drivers.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.drivers.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.patch(`${API_BASE}/drivers/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { status: 'off_duty' } }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useDeleteDriver', () => {
  it('invalidates drivers.all on success', async () => {
    server.use(http.delete(`${API_BASE}/drivers/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.drivers.all })
  })

  it('toast.error on 500', async () => {
    server.use(http.delete(`${API_BASE}/drivers/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Err' } }, { status: 500 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
