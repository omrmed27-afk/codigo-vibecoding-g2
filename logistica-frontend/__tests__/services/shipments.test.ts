import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { getList, getById, create, update, remove, assignTransport, markInTransit, markDelivered, cancel } from '@/services/shipments'
import type { Shipment, ShipmentListParams } from '@/types/shipments'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))

const API_BASE = 'http://localhost:8000/api'

const SHIPMENT: Shipment = {
  id: 1,
  tracking_number: 'TRK-001',
  customer: { id: 1, name: 'Acme Corp', email: 'a@acme.com' },
  origin_warehouse: { id: 1, name: 'Main', city: 'Chicago' },
  destination_address: '456 Business Blvd',
  destination_city: 'Boston',
  destination_country: 'US',
  status: 'pending',
  transport: null,
  route: null,
  scheduled_delivery_date: '2099-12-31',
  actual_delivery_date: null,
  weight_kg: '5.500',
  base_cost: '13.75',
  calculated_cost: '13.75',
  notes: null,
  shipment_products: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Shipment> = { count: 1, next: null, previous: null, results: [SHIPMENT] }

describe('shipments service — getList', () => {
  it('passes all params via axios params (query string)', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/shipments/`, ({ request }) => {
      capturedUrl = request.url
      return HttpResponse.json(PAGE)
    }))
    const params: ShipmentListParams = { page: 2, search: 'trk', status: 'pending', customer: 1, origin_warehouse: 1, transport: 2, ordering: '-created_at' }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('trk')
    expect(url.searchParams.get('status')).toBe('pending')
    expect(url.searchParams.get('customer')).toBe('1')
    expect(url.searchParams.get('origin_warehouse')).toBe('1')
    expect(url.searchParams.get('transport')).toBe('2')
    expect(url.searchParams.get('ordering')).toBe('-created_at')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/shipments/`, () => HttpResponse.json(PAGE)))
    expect(await getList({})).toEqual(PAGE)
  })
})

describe('shipments service — getById', () => {
  it('returns shipment by id', async () => {
    server.use(http.get(`${API_BASE}/shipments/1/`, () => HttpResponse.json(SHIPMENT)))
    expect(await getById(1)).toEqual(SHIPMENT)
  })
})

describe('shipments service — create', () => {
  it('hits POST /shipments/ with payload', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/shipments/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(SHIPMENT, { status: 201 }) }))
    const payload = {
      customer: 1, origin_warehouse: 1, destination_address: '456 Blvd',
      destination_city: 'Boston', destination_country: 'US',
      scheduled_delivery_date: '2099-12-31', weight_kg: '5.5', products: [{ product: 1, quantity: 2 }],
    }
    const result = await create(payload)
    expect(captured).toMatchObject(payload)
    expect(result).toEqual(SHIPMENT)
  })
})

describe('shipments service — update', () => {
  it('hits PATCH /shipments/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(http.patch(`${API_BASE}/shipments/1/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(SHIPMENT) }))
    await update(1, { destination_city: 'NYC' })
    expect(captured).toEqual({ destination_city: 'NYC' })
  })
})

describe('shipments service — remove', () => {
  it('hits DELETE /shipments/{id}/', async () => {
    let called = false
    server.use(http.delete(`${API_BASE}/shipments/1/`, () => { called = true; return new HttpResponse(null, { status: 204 }) }))
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('shipments service — workflow actions', () => {
  it('assignTransport: POST /shipments/{id}/assign-transport/', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/shipments/1/assign-transport/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(SHIPMENT) }))
    await assignTransport(1, { transport_id: 5, route_id: 2 })
    expect(captured).toEqual({ transport_id: 5, route_id: 2 })
  })

  it('markInTransit: POST /shipments/{id}/mark-in-transit/', async () => {
    let called = false
    server.use(http.post(`${API_BASE}/shipments/1/mark-in-transit/`, () => { called = true; return HttpResponse.json({ ...SHIPMENT, status: 'in_transit' }) }))
    const result = await markInTransit(1)
    expect(called).toBe(true)
    expect(result.status).toBe('in_transit')
  })

  it('markDelivered: POST /shipments/{id}/mark-delivered/', async () => {
    let called = false
    server.use(http.post(`${API_BASE}/shipments/1/mark-delivered/`, () => { called = true; return HttpResponse.json({ ...SHIPMENT, status: 'delivered' }) }))
    const result = await markDelivered(1)
    expect(called).toBe(true)
    expect(result.status).toBe('delivered')
  })

  it('cancel: POST /shipments/{id}/cancel/', async () => {
    let called = false
    server.use(http.post(`${API_BASE}/shipments/1/cancel/`, () => { called = true; return HttpResponse.json({ ...SHIPMENT, status: 'cancelled' }) }))
    const result = await cancel(1)
    expect(called).toBe(true)
    expect(result.status).toBe('cancelled')
  })
})

describe('shipments service — error propagation', () => {
  it('propagates 404', async () => {
    server.use(http.get(`${API_BASE}/shipments/999/`, () =>
      HttpResponse.json({ error: { code: 'not_found', message: 'Not found' } }, { status: 404 })
    ))
    await expect(getById(999)).rejects.toThrow()
  })
})
