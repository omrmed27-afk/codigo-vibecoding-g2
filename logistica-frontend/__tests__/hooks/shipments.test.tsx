import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  useShipmentList, useShipment,
  useCreateShipment, useUpdateShipment, useDeleteShipment,
  useAssignTransport, useMarkInTransit, useMarkDelivered, useCancelShipment,
} from '@/hooks/shipments/use-shipments'
import type { Shipment } from '@/types/shipments'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(() => vi.clearAllMocks())

const API_BASE = 'http://localhost:8000/api'

const SHIPMENT: Shipment = {
  id: 1, tracking_number: 'TRK-001',
  customer: { id: 1, name: 'Acme', email: 'a@acme.com' },
  origin_warehouse: { id: 1, name: 'Main', city: 'Chicago' },
  destination_address: '456 Blvd', destination_city: 'Boston', destination_country: 'US',
  status: 'pending', transport: null, route: null,
  scheduled_delivery_date: '2099-12-31', actual_delivery_date: null,
  weight_kg: '5.500', base_cost: '13.75', calculated_cost: '13.75', notes: null,
  shipment_products: [], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Shipment> = { count: 1, next: null, previous: null, results: [SHIPMENT] }

const CREATE_PAYLOAD = {
  customer: 1, origin_warehouse: 1, destination_address: '456 Blvd',
  destination_city: 'Boston', destination_country: 'US',
  scheduled_delivery_date: '2099-12-31', weight_kg: '5.5', products: [{ product: 1, quantity: 2 }],
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}
function makeWrapper(qc: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('useShipmentList', () => {
  it('isPending initially then resolves', async () => {
    server.use(http.get(`${API_BASE}/shipments/`, () => HttpResponse.json(PAGE)))
    const qc = makeClient()
    const { result } = renderHook(() => useShipmentList({}), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].tracking_number).toBe('TRK-001')
  })

  it('registers correct queryKey', async () => {
    server.use(http.get(`${API_BASE}/shipments/`, () => HttpResponse.json(PAGE)))
    const params = { status: 'pending' as const }
    const qc = makeClient()
    renderHook(() => useShipmentList(params), { wrapper: makeWrapper(qc) })
    expect(qc.getQueryCache().findAll({ queryKey: queryKeys.shipments.list(params) })).toHaveLength(1)
  })
})

describe('useShipment', () => {
  it('fetches single shipment', async () => {
    server.use(http.get(`${API_BASE}/shipments/1/`, () => HttpResponse.json(SHIPMENT)))
    const qc = makeClient()
    const { result } = renderHook(() => useShipment(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('pending')
  })

  it('does not fetch when id is 0', () => {
    const qc = makeClient()
    const { result } = renderHook(() => useShipment(0), { wrapper: makeWrapper(qc) })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateShipment', () => {
  it('invalidates shipments.all on success', async () => {
    server.use(http.post(`${API_BASE}/shipments/`, () => HttpResponse.json(SHIPMENT, { status: 201 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCreateShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.all })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/shipments/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useCreateShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(CREATE_PAYLOAD) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useUpdateShipment', () => {
  it('invalidates shipments.all and detail on success', async () => {
    server.use(http.patch(`${API_BASE}/shipments/1/`, () => HttpResponse.json(SHIPMENT)))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { destination_city: 'NYC' } }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.patch(`${API_BASE}/shipments/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useUpdateShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { destination_city: 'X' } }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useDeleteShipment', () => {
  it('invalidates shipments.all on success', async () => {
    server.use(http.delete(`${API_BASE}/shipments/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.all })
  })

  it('toast.error on 500', async () => {
    server.use(http.delete(`${API_BASE}/shipments/1/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Err' } }, { status: 500 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useDeleteShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useAssignTransport', () => {
  it('invalidates shipments.all and detail on success', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/assign-transport/`, () => HttpResponse.json(SHIPMENT)))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useAssignTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { transport_id: 5 } }) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/assign-transport/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useAssignTransport(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate({ id: 1, body: { transport_id: 5 } }) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useMarkInTransit', () => {
  it('invalidates shipments.all and detail on success', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/mark-in-transit/`, () => HttpResponse.json({ ...SHIPMENT, status: 'in_transit' })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useMarkInTransit(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/mark-in-transit/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useMarkInTransit(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useMarkDelivered', () => {
  it('invalidates shipments.all and detail on success', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/mark-delivered/`, () => HttpResponse.json({ ...SHIPMENT, status: 'delivered' })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useMarkDelivered(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/mark-delivered/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useMarkDelivered(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useCancelShipment', () => {
  it('invalidates shipments.all and detail on success', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/cancel/`, () => HttpResponse.json({ ...SHIPMENT, status: 'cancelled' })))
    const qc = makeClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    const { result } = renderHook(() => useCancelShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.all })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.shipments.detail(1) })
  })

  it('toast.error on 400', async () => {
    server.use(http.post(`${API_BASE}/shipments/1/cancel/`, () =>
      HttpResponse.json({ error: { code: 'err', message: 'Bad' } }, { status: 400 })
    ))
    const qc = makeClient()
    const { result } = renderHook(() => useCancelShipment(), { wrapper: makeWrapper(qc) })
    await act(async () => { result.current.mutate(1) })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
