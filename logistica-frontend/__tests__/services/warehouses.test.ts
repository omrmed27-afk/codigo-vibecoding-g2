import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import {
  getList,
  getById,
  create,
  update,
  remove,
  toggleActive,
} from '@/services/warehouses'
import type { Warehouse, WarehouseListParams } from '@/types/warehouses'
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

const API_BASE = 'http://localhost:8000/api'

const WAREHOUSE: Warehouse = {
  id: 1,
  name: 'Main Warehouse',
  address: '123 Main St',
  city: 'Chicago',
  country: 'US',
  latitude: null,
  longitude: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const PAGE: PaginatedResponse<Warehouse> = {
  count: 1,
  next: null,
  previous: null,
  results: [WAREHOUSE],
}

describe('warehouses service — getList', () => {
  it('builds query string from all params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    const params: WarehouseListParams = {
      page: 2,
      search: 'main',
      is_active: true,
      city: 'Chicago',
      country: 'US',
      ordering: '-name',
    }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('main')
    expect(url.searchParams.get('is_active')).toBe('true')
    expect(url.searchParams.get('city')).toBe('Chicago')
    expect(url.searchParams.get('country')).toBe('US')
    expect(url.searchParams.get('ordering')).toBe('-name')
  })

  it('omits undefined / missing params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    await getList({})
    expect(new URL(capturedUrl).searchParams.toString()).toBe('')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/warehouses/`, () => HttpResponse.json(PAGE)))
    const result = await getList({})
    expect(result).toEqual(PAGE)
  })

  it('passes is_active=false as string "false"', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/warehouses/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    await getList({ is_active: false })
    expect(new URL(capturedUrl).searchParams.get('is_active')).toBe('false')
  })
})

describe('warehouses service — getById', () => {
  it('hits GET /warehouses/{id}/ and returns warehouse', async () => {
    server.use(http.get(`${API_BASE}/warehouses/1/`, () => HttpResponse.json(WAREHOUSE)))
    const result = await getById(1)
    expect(result).toEqual(WAREHOUSE)
  })
})

describe('warehouses service — create', () => {
  it('hits POST /warehouses/ with payload and returns created warehouse', async () => {
    let captured: unknown
    server.use(
      http.post(`${API_BASE}/warehouses/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(WAREHOUSE, { status: 201 })
      })
    )
    const payload = { name: 'Main', address: '123', city: 'Chicago', country: 'US', is_active: true }
    const result = await create(payload)

    expect(captured).toMatchObject(payload)
    expect(result).toEqual(WAREHOUSE)
  })
})

describe('warehouses service — update', () => {
  it('hits PATCH /warehouses/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(
      http.patch(`${API_BASE}/warehouses/1/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(WAREHOUSE)
      })
    )
    const result = await update(1, { name: 'Updated' })

    expect(captured).toEqual({ name: 'Updated' })
    expect(result).toEqual(WAREHOUSE)
  })
})

describe('warehouses service — remove', () => {
  it('hits DELETE /warehouses/{id}/ and resolves void', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE}/warehouses/1/`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('warehouses service — toggleActive', () => {
  it('delegates to update with is_active patch', async () => {
    let captured: unknown
    server.use(
      http.patch(`${API_BASE}/warehouses/1/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json({ ...WAREHOUSE, is_active: false })
      })
    )
    const result = await toggleActive(1, false)
    expect(captured).toEqual({ is_active: false })
    expect(result.is_active).toBe(false)
  })
})

describe('warehouses service — error propagation', () => {
  it('propagates 404 without swallowing', async () => {
    server.use(
      http.get(`${API_BASE}/warehouses/999/`, () =>
        HttpResponse.json(
          { error: { code: 'not_found', message: 'Not found' } },
          { status: 404 }
        )
      )
    )
    await expect(getById(999)).rejects.toThrow()
  })

  it('propagates 400 on create without swallowing', async () => {
    server.use(
      http.post(`${API_BASE}/warehouses/`, () =>
        HttpResponse.json(
          { error: { code: 'validation_error', message: 'Invalid' } },
          { status: 400 }
        )
      )
    )
    await expect(
      create({ name: '', address: '', city: '', country: '', is_active: true })
    ).rejects.toThrow()
  })
})
