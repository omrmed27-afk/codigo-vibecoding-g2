import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  useTransportList,
  useTransport,
  useCreateTransport,
  useUpdateTransport,
  useDeleteTransport,
  useAssignDriver,
  useUnassignDriver,
} from '@/hooks/transport/use-transport'
import type { Transport } from '@/types/transport'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

const API_BASE = 'http://localhost:8000/api'

const TRANSPORT: Transport = {
  id: 1, name: 'Truck A1', type: 'truck', plate_number: 'ABC-1234',
  capacity_kg: '5000.00', capacity_m3: '12.500', driver: null,
  status: 'available', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Transport> = { count: 1, next: null, previous: null, results: [TRANSPORT] }

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}
function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

const CREATE_PAYLOAD = { name: 'Truck A1', type: 'truck' as const, plate_number: 'ABC-1234', capacity_kg: '5000', capacity_m3: '12.5', status: 'available' as const }

describe('useTransportList', () => {
  it('isPending initially then resolves', async () => {
    server.use(http.get(`${API_BASE}/transport/`, () => HttpResponse.json(PAGE)))
    const qc = makeClient()
    const { result } = renderHook(() => useTransportList({}), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].type).toBe('truck')
  })

  it('registers correct queryKey', async () => {
    server.use(http.get(`${API_BASE}/transport/`, () => HttpResponse.json(PAGE)))
    const params = { status: 'available' as const, type: 'truck' as const }
    const qc = makeClient()
    renderHook(() => useTransportList(params), { wrapper: makeWrapper(qc) })
    expect(qc.getQueryCache().findAll({ queryKey: queryKeys.transport.list(params) })).toHaveLength(1)
  })
})

describe('useTransport', () => {
  it('fetches single transport', async () => {
    server.use(http.get(`${API_BASE}/transport/1/`, () => HttpResponse.json(TRANSPORT)))
    const qc = makeClient()
    const { result } = renderHook(() => useTransport(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.plate_number).toBe('ABC-1234')
  })

  it('does not fetch when id is 0', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useTransport(0), { wrapper: makeWrapper(qc) })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateTransport', () => {
  it('invalidates transport.all on success', async () => {
    server.use(http.post(`${API_BASE}/transport/`, () => HttpResponse.json(TRANSPORT, { status: 201 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.all })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/transport/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useCreateTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUpdateTransport', () => {
  it('invalidates transport.all and detail on success', async () => {
    server.use(http.patch(`${API_BASE}/transport/1/`, () => HttpResponse.json(TRANSPORT)))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { status: 'maintenance' } }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.patch(`${API_BASE}/transport/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { name: 'X' } }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useDeleteTransport', () => {
  it('invalidates transport.all on success', async () => {
    server.use(http.delete(`${API_BASE}/transport/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.all })
  })

  it('toast.error on 500', async () => {
    server.use(http.delete(`${API_BASE}/transport/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Err' } }, { status: 500 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useAssignDriver', () => {
  it('invalidates transport.all and detail on success', async () => {
    server.use(http.post(`${API_BASE}/transport/1/assign-driver/`, () =>
      HttpResponse.json({ ...TRANSPORT, driver: { id: 5, license_number: 'DL-1', phone: '1', status: 'busy' } })
    ))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useAssignDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, driver_id: 5 }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/transport/1/assign-driver/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useAssignDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, driver_id: 5 }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUnassignDriver', () => {
  it('invalidates transport.all and detail on success', async () => {
    server.use(http.post(`${API_BASE}/transport/1/unassign-driver/`, () => HttpResponse.json(TRANSPORT)))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUnassignDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transport.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/transport/1/unassign-driver/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useUnassignDriver(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
