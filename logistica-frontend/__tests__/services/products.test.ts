import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { getList, getById, create, update, remove } from '@/services/products'
import type { Product, ProductListParams } from '@/types/products'
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

const PRODUCT: Product = {
  id: 1,
  name: 'Laptop Pro',
  description: 'High-end laptop',
  sku: 'LP-2026-001',
  weight_kg: '1.500',
  width_cm: '35.50',
  height_cm: '23.00',
  depth_cm: '18.50',
  unit_price: '1299.99',
  stock_quantity: 50,
  supplier: { id: 1, name: 'Tech Supplier' },
  warehouse: { id: 1, name: 'Main Warehouse' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const PAGE: PaginatedResponse<Product> = {
  count: 1,
  next: null,
  previous: null,
  results: [PRODUCT],
}

describe('products service — getList', () => {
  it('builds query string from all params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    const params: ProductListParams = {
      page: 2,
      search: 'laptop',
      supplier: 1,
      warehouse: 1,
      ordering: '-unit_price',
    }
    await getList(params)

    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('search')).toBe('laptop')
    expect(url.searchParams.get('supplier')).toBe('1')
    expect(url.searchParams.get('warehouse')).toBe('1')
    expect(url.searchParams.get('ordering')).toBe('-unit_price')
  })

  it('omits undefined params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    await getList({})
    expect(new URL(capturedUrl).searchParams.toString()).toBe('')
  })

  it('returns parsed PaginatedResponse', async () => {
    server.use(http.get(`${API_BASE}/products/`, () => HttpResponse.json(PAGE)))
    const result = await getList({})
    expect(result).toEqual(PAGE)
  })

  it('passes supplier=0 as "0"', async () => {
    let capturedUrl = ''
    server.use(
      http.get(`${API_BASE}/products/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(PAGE)
      })
    )
    await getList({ supplier: 0 })
    expect(new URL(capturedUrl).searchParams.get('supplier')).toBe('0')
  })
})

describe('products service — getById', () => {
  it('hits GET /products/{id}/ and returns product', async () => {
    server.use(http.get(`${API_BASE}/products/1/`, () => HttpResponse.json(PRODUCT)))
    const result = await getById(1)
    expect(result).toEqual(PRODUCT)
  })
})

describe('products service — create', () => {
  it('hits POST /products/ with payload and returns created product', async () => {
    let captured: unknown
    server.use(
      http.post(`${API_BASE}/products/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(PRODUCT, { status: 201 })
      })
    )
    const payload = {
      name: 'Laptop Pro',
      sku: 'LP-001',
      weight_kg: '1.5',
      width_cm: '35.5',
      height_cm: '23.0',
      depth_cm: '18.5',
      unit_price: '1299.99',
      stock_quantity: 50,
      supplier: 1,
      warehouse: 1,
    }
    const result = await create(payload)

    expect(captured).toMatchObject(payload)
    expect(result).toEqual(PRODUCT)
  })
})

describe('products service — update', () => {
  it('hits PATCH /products/{id}/ with patch body', async () => {
    let captured: unknown
    server.use(
      http.patch(`${API_BASE}/products/1/`, async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json(PRODUCT)
      })
    )
    const result = await update(1, { unit_price: '999.99' })

    expect(captured).toEqual({ unit_price: '999.99' })
    expect(result).toEqual(PRODUCT)
  })
})

describe('products service — remove', () => {
  it('hits DELETE /products/{id}/ and resolves void', async () => {
    let called = false
    server.use(
      http.delete(`${API_BASE}/products/1/`, () => {
        called = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    await remove(1)
    expect(called).toBe(true)
  })
})

describe('products service — error propagation', () => {
  it('propagates 404', async () => {
    server.use(
      http.get(`${API_BASE}/products/999/`, () =>
        HttpResponse.json({ error: { code: 'not_found', message: 'Not found' } }, { status: 404 })
      )
    )
    await expect(getById(999)).rejects.toThrow()
  })

  it('propagates 400 on create', async () => {
    server.use(
      http.post(`${API_BASE}/products/`, () =>
        HttpResponse.json({ error: { code: 'validation_error', message: 'Invalid' } }, { status: 400 })
      )
    )
    await expect(
      create({ name: '', sku: '', weight_kg: '0', width_cm: '0', height_cm: '0', depth_cm: '0', unit_price: '0', stock_quantity: 0, supplier: 1, warehouse: 1 })
    ).rejects.toThrow()
  })
})
