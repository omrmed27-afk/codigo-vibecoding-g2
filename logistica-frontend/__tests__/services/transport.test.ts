import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { getList, getById, create, update, remove, assignDriver, unassignDriver } from '@/services/transport'
import type { Transport, TransportListParams } from '@/types/transport'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))

const API_BASE = 'http://localhost:8000/api'

const TRANSPORT: Transport = {
  id: 1,
  name: 'Truck A1',
  type: 'truck',
  plate_number: 'ABC-1234',
  capacity_kg: '5000.00',
  capacity_m3: '12.500',
  driver: null,
  status: 'available',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Transport> = { count: 1, next: null, previous: null, results: [TRANSPORT] }

describe('transport service — getList', () => {
  it('builds query string from all params', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/transport/`, ({ request }) => {
      capturedUrl = request.url
      return HttpResponse.json(PAGE)
    }))
    const params: TransportListParams = { page: 2, search: 'truck', status: 'available', type: 'truck', driver: 1, ordering: '-name' }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('truck')
    expect(url.searchParams.get('status')).toBe('available')
    expect(url.searchParams.get('type')).toBe('truck')
    expect(url.searchParams.get('driver')).toBe('1')
    expect(url.searchParams.get('ordering')).toBe('-name')
  })

  it('omits undefined params', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/transport/`, ({ request }) => { capturedUrl = request.url; return HttpResponse.json(PAGE) }))
    await getList({})
    expect(new URL(capturedUrl).searchParams.toString()).toBe('')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/transport/`, () => HttpResponse.json(PAGE)))
    expect(await getList({})).toEqual(PAGE)
  })

  it('passes driver=0 as "0"', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/transport/`, ({ request }) => { capturedUrl = request.url; return HttpResponse.json(PAGE) }))
    await getList({ driver: 0 })
    expect(new URL(capturedUrl).searchParams.get('driver')).toBe('0')
  })
})

describe('transport service — getById', () => {
  it('returns transport by id', async () => {
    server.use(http.get(`${API_BASE}/transport/1/`, () => HttpResponse.json(TRANSPORT)))
    expect(await getById(1)).toEqual(TRANSPORT)
  })
})

describe('transport service — create', () => {
  it('hits POST /transport/ with payload', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/transport/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(TRANSPORT, { status: 201 }) }))
    const payload = { name: 'Truck A1', type: 'truck' as const, plate_number: 'ABC-1234', capacity_kg: '5000', capacity_m3: '12.5', status: 'available' as const }
    const result = await create(payload)
    expect(captured).toMatchObject(payload)
    expect(result).toEqual(TRANSPORT)
  })
})

describe('transport service — update', () => {
  it('hits PATCH /transport/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(http.patch(`${API_BASE}/transport/1/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(TRANSPORT) }))
    await update(1, { status: 'maintenance' })
    expect(captured).toEqual({ status: 'maintenance' })
  })
})

describe('transport service — remove', () => {
  it('hits DELETE /transport/{id}/', async () => {
    let called = false
    server.use(http.delete(`${API_BASE}/transport/1/`, () => { called = true; return new HttpResponse(null, { status: 204 }) }))
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('transport service — assignDriver', () => {
  it('hits POST /transport/{id}/assign-driver/ with driver_id', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/transport/1/assign-driver/`, async ({ request }) => {
      captured = await request.json()
      return HttpResponse.json({ ...TRANSPORT, driver: { id: 5, license_number: 'DL-1', phone: '1', status: 'busy' } })
    }))
    const result = await assignDriver(1, { driver_id: 5 })
    expect(captured).toEqual({ driver_id: 5 })
    expect(result.driver?.id).toBe(5)
  })
})

describe('transport service — unassignDriver', () => {
  it('hits POST /transport/{id}/unassign-driver/ and returns transport', async () => {
    let called = false
    server.use(http.post(`${API_BASE}/transport/1/unassign-driver/`, async () => { called = true; return HttpResponse.json(TRANSPORT) }))
    const result = await unassignDriver(1)
    expect(called).toBe(true)
    expect(result.driver).toBeNull()
  })
})

describe('transport service — error propagation', () => {
  it('propagates 404', async () => {
    server.use(http.get(`${API_BASE}/transport/999/`, () =>
      HttpResponse.json({ error: { code: 'not_found', message: 'Not found' } }, { status: 404 })
    ))
    await expect(getById(999)).rejects.toThrow()
  })
})
