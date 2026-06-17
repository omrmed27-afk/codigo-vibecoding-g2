import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import {
  getList,
  getById,
  create,
  update,
  remove,
} from '@/services/suppliers'
import type { Supplier, SupplierListParams } from '@/types/suppliers'
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

const SUPPLIER: Supplier = {
  id: 1,
  name: 'Tech Supplier Inc',
  contact_name: 'John Doe',
  email: 'john@techsupply.com',
  phone: '+1987654321',
  address: '456 Industrial Ave',
  city: 'Los Angeles',
  country: 'US',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const PAGE: PaginatedResponse<Supplier> = {
  count: 1,
  next: null,
  previous: null,
  results: [SUPPLIER],
}

describe('suppliers service — getList', () => {
  it('builds query string from all params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    const params: SupplierListParams = {
      page: 2,
      search: 'tech',
      city: 'LA',
      country: 'US',
      ordering: '-name',
    }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('tech')
    expect(url.searchParams.get('city')).toBe('LA')
    expect(url.searchParams.get('country')).toBe('US')
    expect(url.searchParams.get('ordering')).toBe('-name')
  })

  it('omits undefined params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/suppliers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    await getList({})
    expect(new URL(capturedUrl).searchParams.toString()).toBe('')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/suppliers/`, () => HttpResponse.json(PAGE)))
    const result = await getList({})
    expect(result).toEqual(PAGE)
  })
})

describe('suppliers service — getById', () => {
  it('hits GET /suppliers/{id}/ and returns supplier', async () => {
    server.use(http.get(`${API_BASE}/suppliers/1/`, () => HttpResponse.json(SUPPLIER)))
    const result = await getById(1)
    expect(result).toEqual(SUPPLIER)
  })
})

describe('suppliers service — create', () => {
  it('hits POST /suppliers/ with payload and returns created supplier', async () => {
    let captured: unknown
    server.use(
      http.post(`${API_BASE}/suppliers/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(SUPPLIER, { status: 201 })
      })
    )
    const payload = {
      name: 'Tech Supplier Inc',
      contact_name: 'John Doe',
      email: 'john@techsupply.com',
      phone: '+1987654321',
      address: '456 Industrial Ave',
      city: 'Los Angeles',
      country: 'US',
    }
    const result = await create(payload)

    expect(captured).toMatchObject(payload)
    expect(result).toEqual(SUPPLIER)
  })
})

describe('suppliers service — update', () => {
  it('hits PATCH /suppliers/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(
      http.patch(`${API_BASE}/suppliers/1/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(SUPPLIER)
      })
    )
    const result = await update(1, { name: 'Updated Name' })

    expect(captured).toEqual({ name: 'Updated Name' })
    expect(result).toEqual(SUPPLIER)
  })
})

describe('suppliers service — remove', () => {
  it('hits DELETE /suppliers/{id}/ and resolves void', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE}/suppliers/1/`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('suppliers service — error propagation', () => {
  it('propagates 404 without swallowing', async () => {
    server.use(
      http.get(`${API_BASE}/suppliers/999/`, () =>
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
      http.post(`${API_BASE}/suppliers/`, () =>
        HttpResponse.json(
          { error: { code: 'validation_error', message: 'Invalid' } },
          { status: 400 }
        )
      )
    )
    await expect(
      create({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
      })
    ).rejects.toThrow()
  })
})
