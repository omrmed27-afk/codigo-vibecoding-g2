import { z } from 'zod'

// Mirrors routeSchema + stopSchema in components/routes/RouteForm.tsx.
const stopSchema = z.object({
  stop_order: z.number({ error: 'Stop order is required' }).int().min(1),
  address: z.string({ error: 'Address is required' }).min(1, 'Address is required').max(500),
  city: z.string({ error: 'City is required' }).min(1, 'City is required').max(100),
  latitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a valid decimal').optional().nullable(),
  longitude: z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a valid decimal').optional().nullable(),
})

const routeSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(1, 'Name is required').max(200),
  origin_warehouse: z.number({ error: 'Warehouse is required' }),
  status: z.enum(['active', 'inactive'], { error: 'Status is required' }),
  stops: z.array(stopSchema).optional(),
})

const VALID_ROUTE = { name: 'Downtown Express', origin_warehouse: 1, status: 'active' as const }
const VALID_STOP = { stop_order: 1, address: '123 Oak St', city: 'NYC' }

describe('routeSchema', () => {
  it('accepts valid route without stops', () => {
    expect(routeSchema.safeParse(VALID_ROUTE).success).toBe(true)
  })

  it('accepts valid route with stops', () => {
    expect(routeSchema.safeParse({ ...VALID_ROUTE, stops: [VALID_STOP] }).success).toBe(true)
  })

  it('accepts empty stops array', () => {
    expect(routeSchema.safeParse({ ...VALID_ROUTE, stops: [] }).success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = routeSchema.safeParse({ ...VALID_ROUTE, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Name is required')
  })

  it('rejects missing origin_warehouse', () => {
    const r = routeSchema.safeParse({ ...VALID_ROUTE, origin_warehouse: undefined })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.origin_warehouse).toBeDefined()
  })

  it('rejects invalid status', () => {
    const r = routeSchema.safeParse({ ...VALID_ROUTE, status: 'archived' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.status).toBeDefined()
  })
})

describe('stopSchema', () => {
  it('accepts valid stop', () => {
    expect(stopSchema.safeParse(VALID_STOP).success).toBe(true)
  })

  it('accepts stop with lat/lng', () => {
    expect(stopSchema.safeParse({ ...VALID_STOP, latitude: '40.712776', longitude: '-74.005974' }).success).toBe(true)
  })

  it('accepts stop with null lat/lng', () => {
    expect(stopSchema.safeParse({ ...VALID_STOP, latitude: null, longitude: null }).success).toBe(true)
  })

  it('rejects stop_order < 1', () => {
    const r = stopSchema.safeParse({ ...VALID_STOP, stop_order: 0 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.stop_order).toBeDefined()
  })

  it('rejects empty address', () => {
    const r = stopSchema.safeParse({ ...VALID_STOP, address: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.address).toContain('Address is required')
  })

  it('rejects empty city', () => {
    const r = stopSchema.safeParse({ ...VALID_STOP, city: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.city).toContain('City is required')
  })

  it('rejects invalid latitude format', () => {
    const r = stopSchema.safeParse({ ...VALID_STOP, latitude: 'abc', longitude: null })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.latitude).toContain('Must be a valid decimal')
  })

  it('rejects invalid longitude format', () => {
    const r = stopSchema.safeParse({ ...VALID_STOP, longitude: 'xyz', latitude: null })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.longitude).toContain('Must be a valid decimal')
  })
})
