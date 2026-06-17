import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  useRouteList, useRoute, useRouteStops,
  useCreateRoute, useUpdateRoute, useDeleteRoute,
  useAddStop, useRemoveStop,
} from '@/hooks/routes/use-routes'
import type { Route, RouteStop } from '@/types/routes'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

const API_BASE = 'http://localhost:8000/api'

const STOP: RouteStop = { id: 10, stop_order: 1, address: '123 Oak St', city: 'NYC', latitude: null, longitude: null, created_at: '2024-01-01T00:00:00Z' }
const ROUTE: Route = {
  id: 1, name: 'Downtown Express',
  origin_warehouse: { id: 1, name: 'Main', city: 'Chicago' },
  status: 'active', stops: [STOP],
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Route> = { count: 1, next: null, previous: null, results: [ROUTE] }

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}
function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useRouteList', () => {
  it('isPending initially then resolves', async () => {
    server.use(http.get(`${API_BASE}/routes/`, () => HttpResponse.json(PAGE)))
    const qc = makeClient()
    const { result } = renderHook(() => useRouteList({}), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].status).toBe('active')
  })

  it('registers correct queryKey', async () => {
    server.use(http.get(`${API_BASE}/routes/`, () => HttpResponse.json(PAGE)))
    const params = { status: 'active' as const, origin_warehouse: 1 }
    const qc = makeClient()
    renderHook(() => useRouteList(params), { wrapper: makeWrapper(qc) })
    expect(qc.getQueryCache().findAll({ queryKey: queryKeys.routes.list(params) })).toHaveLength(1)
  })
})

describe('useRoute', () => {
  it('fetches single route', async () => {
    server.use(http.get(`${API_BASE}/routes/1/`, () => HttpResponse.json(ROUTE)))
    const qc = makeClient()
    const { result } = renderHook(() => useRoute(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Downtown Express')
  })

  it('does not fetch when id is 0', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useRoute(0), { wrapper: makeWrapper(qc) })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useRouteStops', () => {
  it('fetches stops for routeId', async () => {
    server.use(http.get(`${API_BASE}/routes/1/stops/`, () => HttpResponse.json([STOP])))
    const qc = makeClient()
    const { result } = renderHook(() => useRouteStops(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it('uses correct queryKey', async () => {
    server.use(http.get(`${API_BASE}/routes/1/stops/`, () => HttpResponse.json([STOP])))
    const qc = makeClient()
    renderHook(() => useRouteStops(1), { wrapper: makeWrapper(qc) })
    expect(qc.getQueryCache().findAll({ queryKey: queryKeys.routes.stops(1) })).toHaveLength(1)
  })
})

describe('useCreateRoute', () => {
  it('invalidates routes.all on success', async () => {
    server.use(http.post(`${API_BASE}/routes/`, () => HttpResponse.json(ROUTE, { status: 201 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateRoute(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ name: 'R', origin_warehouse: 1, status: 'active' }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.all })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/routes/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useCreateRoute(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ name: 'R', origin_warehouse: 1, status: 'active' }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUpdateRoute', () => {
  it('invalidates routes.all and detail on success', async () => {
    server.use(http.patch(`${API_BASE}/routes/1/`, () => HttpResponse.json(ROUTE)))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateRoute(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { status: 'inactive' } }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.patch(`${API_BASE}/routes/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateRoute(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { name: 'X' } }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useDeleteRoute', () => {
  it('invalidates routes.all on success', async () => {
    server.use(http.delete(`${API_BASE}/routes/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteRoute(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.all })
  })

  it('toast.error on 500', async () => {
    server.use(http.delete(`${API_BASE}/routes/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Err' } }, { status: 500 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteRoute(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useAddStop', () => {
  it('invalidates routes.stops and detail on success', async () => {
    server.use(http.post(`${API_BASE}/routes/1/stops/`, () => HttpResponse.json(STOP, { status: 201 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useAddStop(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ routeId: 1, body: { stop_order: 1, address: '1 St', city: 'NY' } }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.stops(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/routes/1/stops/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useAddStop(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ routeId: 1, body: { stop_order: 1, address: '1 St', city: 'NY' } }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useRemoveStop', () => {
  it('invalidates routes.stops and detail on success', async () => {
    server.use(http.delete(`${API_BASE}/routes/1/stops/10/`, () => new HttpResponse(null, { status: 204 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useRemoveStop(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ routeId: 1, stopId: 10 }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.stops(1) })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.routes.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.delete(`${API_BASE}/routes/1/stops/10/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useRemoveStop(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ routeId: 1, stopId: 10 }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
