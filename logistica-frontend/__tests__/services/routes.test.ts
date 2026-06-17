import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { getList, getById, create, update, remove, getStops, addStop, removeStop } from '@/services/routes'
import type { Route, RouteStop, RouteListParams } from '@/types/routes'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))

const API_BASE = 'http://localhost:8000/api'

const STOP: RouteStop = { id: 10, stop_order: 1, address: '123 Oak St', city: 'NYC', latitude: null, longitude: null, created_at: '2024-01-01T00:00:00Z' }
const ROUTE: Route = {
  id: 1, name: 'Downtown Express',
  origin_warehouse: { id: 1, name: 'Main', city: 'Chicago' },
  status: 'active', stops: [STOP],
  created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
}
const PAGE: PaginatedResponse<Route> = { count: 1, next: null, previous: null, results: [ROUTE] }

describe('routes service — getList', () => {
  it('builds query string from all params', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/routes/`, ({ request }) => { capturedUrl = request.url; return HttpResponse.json(PAGE) }))
    const params: RouteListParams = { page: 2, search: 'downtown', status: 'active', origin_warehouse: 1, ordering: '-name' }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('downtown')
    expect(url.searchParams.get('status')).toBe('active')
    expect(url.searchParams.get('origin_warehouse')).toBe('1')
    expect(url.searchParams.get('ordering')).toBe('-name')
  })

  it('omits undefined params', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/routes/`, ({ request }) => { capturedUrl = request.url; return HttpResponse.json(PAGE) }))
    await getList({})
    expect(new URL(capturedUrl).searchParams.toString()).toBe('')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/routes/`, () => HttpResponse.json(PAGE)))
    expect(await getList({})).toEqual(PAGE)
  })
})

describe('routes service — getById', () => {
  it('returns route by id', async () => {
    server.use(http.get(`${API_BASE}/routes/1/`, () => HttpResponse.json(ROUTE)))
    expect(await getById(1)).toEqual(ROUTE)
  })
})

describe('routes service — create', () => {
  it('hits POST /routes/ with payload', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/routes/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(ROUTE, { status: 201 }) }))
    const payload = { name: 'Downtown Express', origin_warehouse: 1, status: 'active' as const }
    await create(payload)
    expect(captured).toMatchObject(payload)
  })

  it('sends stops when provided', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/routes/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(ROUTE, { status: 201 }) }))
    const payload = { name: 'R', origin_warehouse: 1, status: 'active' as const, stops: [{ stop_order: 1, address: '1 St', city: 'NY' }] }
    await create(payload)
    expect((captured as typeof payload).stops).toHaveLength(1)
  })
})

describe('routes service — update', () => {
  it('hits PATCH /routes/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(http.patch(`${API_BASE}/routes/1/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(ROUTE) }))
    await update(1, { status: 'inactive' })
    expect(captured).toEqual({ status: 'inactive' })
  })
})

describe('routes service — remove', () => {
  it('hits DELETE /routes/{id}/', async () => {
    let called = false
    server.use(http.delete(`${API_BASE}/routes/1/`, () => { called = true; return new HttpResponse(null, { status: 204 }) }))
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('routes service — getStops', () => {
  it('hits GET /routes/{id}/stops/ and returns array', async () => {
    server.use(http.get(`${API_BASE}/routes/1/stops/`, () => HttpResponse.json([STOP])))
    const result = await getStops(1)
    expect(result).toEqual([STOP])
  })
})

describe('routes service — addStop', () => {
  it('hits POST /routes/{id}/stops/ with body and returns stop', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/routes/1/stops/`, async ({ request }) => { captured = await request.json(); return HttpResponse.json(STOP, { status: 201 }) }))
    const body = { stop_order: 1, address: '123 Oak St', city: 'NYC' }
    const result = await addStop(1, body)
    expect(captured).toMatchObject(body)
    expect(result).toEqual(STOP)
  })
})

describe('routes service — removeStop', () => {
  it('hits DELETE /routes/{routeId}/stops/{stopId}/', async () => {
    let called = false
    server.use(http.delete(`${API_BASE}/routes/1/stops/10/`, () => { called = true; return new HttpResponse(null, { status: 204 }) }))
    await removeStop(1, 10)
    expect(called).toBe(true)
  })
})

describe('routes service — error propagation', () => {
  it('propagates 404', async () => {
    server.use(http.get(`${API_BASE}/routes/999/`, () =>
      HttpResponse.json({ error: { code: 'not_found', message: 'Not found' } }, { status: 404 })
    ))
    await expect(getById(999)).rejects.toThrow()
  })
})
