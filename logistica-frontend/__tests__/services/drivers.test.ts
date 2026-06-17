import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { getList, getById, create, update, remove } from '@/services/drivers'
import type { Driver, DriverListParams } from '@/types/drivers'
import type { PaginatedResponse } from '@/types/api'

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { accessToken: null as string | null, logout: vi.fn(), setAccessToken: vi.fn() },
}))
vi.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuthState } }))

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

describe('drivers service — getList', () => {
  it('builds query string from all params', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/drivers/`, ({ request }) => {
      capturedUrl = request.url
      return HttpResponse.json(PAGE)
    }))
    const params: DriverListParams = { page: 2, search: 'john', status: 'available', ordering: '-created_at' }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('john')
    expect(url.searchParams.get('status')).toBe('available')
    expect(url.searchParams.get('ordering')).toBe('-created_at')
  })

  it('omits undefined params', async () => {
    let capturedUrl = ''
    server.use(http.get(`${API_BASE}/drivers/`, ({ request }) => {
      capturedUrl = request.url
      return HttpResponse.json(PAGE)
    }))
    await getList({})
    expect(new URL(capturedUrl).searchParams.toString()).toBe('')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/drivers/`, () => HttpResponse.json(PAGE)))
    expect(await getList({})).toEqual(PAGE)
  })
})

describe('drivers service — getById', () => {
  it('hits GET /drivers/{id}/ and returns driver', async () => {
    server.use(http.get(`${API_BASE}/drivers/1/`, () => HttpResponse.json(DRIVER)))
    expect(await getById(1)).toEqual(DRIVER)
  })
})

describe('drivers service — create', () => {
  it('hits POST /drivers/ with payload and returns created driver', async () => {
    let captured: unknown
    server.use(http.post(`${API_BASE}/drivers/`, async ({ request }) => {
      captured = await request.json()
      return HttpResponse.json(DRIVER, { status: 201 })
    }))
    const payload = { username: 'jsmith', password: 'pass1234', email: 'j@ex.com', first_name: 'John', last_name: 'Smith', license_number: 'DL-001', license_expiry: '2027-12-31', phone: '+1987654321', status: 'available' as const }
    const result = await create(payload)
    expect(captured).toMatchObject(payload)
    expect(result).toEqual(DRIVER)
  })
})

describe('drivers service — update', () => {
  it('hits PATCH /drivers/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(http.patch(`${API_BASE}/drivers/1/`, async ({ request }) => {
      captured = await request.json()
      return HttpResponse.json(DRIVER)
    }))
    await update(1, { status: 'busy' })
    expect(captured).toEqual({ status: 'busy' })
  })
})

describe('drivers service — remove', () => {
  it('hits DELETE /drivers/{id}/ and resolves void', async () => {
    let called = false
    server.use(http.delete(`${API_BASE}/drivers/1/`, () => { called = true; return new HttpResponse(null, { status: 204 }) }))
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('drivers service — error propagation', () => {
  it('propagates 404', async () => {
    server.use(http.get(`${API_BASE}/drivers/999/`, () =>
      HttpResponse.json({ error: { code: 'not_found', message: 'Not found' } }, { status: 404 })
    ))
    await expect(getById(999)).rejects.toThrow()
  })
})
