import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { getList, getById, create, update, remove } from '@/services/customers'
import type { Customer, CustomerListParams } from '@/types/customers'
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

const CUSTOMER: Customer = {
  id: 1,
  name: 'Acme Corp',
  customer_type: 'company',
  email: 'contact@acme.com',
  phone: '+1234567890',
  address: '123 Main St',
  city: 'New York',
  country: 'US',
  tax_id: 'US12345678',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const PAGE: PaginatedResponse<Customer> = {
  count: 1,
  next: null,
  previous: null,
  results: [CUSTOMER],
}

describe('customers service — getList', () => {
  it('builds query string from all params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    const params: CustomerListParams = {
      page: 2,
      search: 'acme',
      customer_type: 'company',
      city: 'NY',
      country: 'US',
      ordering: '-name',
    }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('acme')
    expect(url.searchParams.get('customer_type')).toBe('company')
    expect(url.searchParams.get('city')).toBe('NY')
    expect(url.searchParams.get('country')).toBe('US')
    expect(url.searchParams.get('ordering')).toBe('-name')
  })

  it('omits undefined params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/customers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    await getList({})
    expect(new URL(capturedUrl).searchParams.toString()).toBe('')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/customers/`, () => HttpResponse.json(PAGE)))
    const result = await getList({})
    expect(result).toEqual(PAGE)
  })
})

describe('customers service — getById', () => {
  it('hits GET /customers/{id}/ and returns customer', async () => {
    server.use(http.get(`${API_BASE}/customers/1/`, () => HttpResponse.json(CUSTOMER)))
    const result = await getById(1)
    expect(result).toEqual(CUSTOMER)
  })
})

describe('customers service — create', () => {
  it('hits POST /customers/ with payload and returns created customer', async () => {
    let captured: unknown
    server.use(
      http.post(`${API_BASE}/customers/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(CUSTOMER, { status: 201 })
      })
    )
    const payload = {
      name: 'Acme Corp',
      customer_type: 'company' as const,
      email: 'contact@acme.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'New York',
      country: 'US',
    }
    const result = await create(payload)

    expect(captured).toMatchObject(payload)
    expect(result).toEqual(CUSTOMER)
  })
})

describe('customers service — update', () => {
  it('hits PATCH /customers/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(
      http.patch(`${API_BASE}/customers/1/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(CUSTOMER)
      })
    )
    const result = await update(1, { name: 'Updated Corp' })

    expect(captured).toEqual({ name: 'Updated Corp' })
    expect(result).toEqual(CUSTOMER)
  })
})

describe('customers service — remove', () => {
  it('hits DELETE /customers/{id}/ and resolves void', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE}/customers/1/`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('customers service — error propagation', () => {
  it('propagates 404 without swallowing', async () => {
    server.use(
      http.get(`${API_BASE}/customers/999/`, () =>
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
      http.post(`${API_BASE}/customers/`, () =>
        HttpResponse.json(
          { error: { code: 'validation_error', message: 'Invalid' } },
          { status: 400 }
        )
      )
    )
    await expect(
      create({
        name: '',
        customer_type: 'company',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
      })
    ).rejects.toThrow()
  })
})
