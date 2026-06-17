import { z } from 'zod'

// Mirror of warehouseSchema in components/warehouses/WarehouseForm.tsx.
// Keep in sync if production schema changes.
const warehouseSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    address: z.string().min(1, 'Address is required').max(500),
    city: z.string().min(1, 'City is required').max(100),
    country: z.string().min(1, 'Country is required').max(100),
    latitude: z
      .string()
      .refine(
        (v) => v === '' || v == null || /^-?(\d+(\.\d+)?)$/.test(v),
        'Invalid decimal format'
      )
      .nullable()
      .optional(),
    longitude: z
      .string()
      .refine(
        (v) => v === '' || v == null || /^-?(\d+(\.\d+)?)$/.test(v),
        'Invalid decimal format'
      )
      .nullable()
      .optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const latProvided =
      data.latitude !== null && data.latitude !== undefined && data.latitude !== ''
    const lngProvided =
      data.longitude !== null && data.longitude !== undefined && data.longitude !== ''

    if (latProvided && !lngProvided) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both latitude and longitude are required together',
        path: ['longitude'],
      })
    }
    if (lngProvided && !latProvided) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both latitude and longitude are required together',
        path: ['latitude'],
      })
    }
    if (latProvided && data.latitude) {
      const num = parseFloat(data.latitude)
      if (num < -90 || num > 90) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Latitude must be between -90 and 90',
          path: ['latitude'],
        })
      }
    }
    if (lngProvided && data.longitude) {
      const num = parseFloat(data.longitude)
      if (num < -180 || num > 180) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Longitude must be between -180 and 180',
          path: ['longitude'],
        })
      }
    }
  })

const VALID = {
  name: 'Main Warehouse',
  address: '123 Main St',
  city: 'Chicago',
  country: 'US',
  is_active: true,
}

describe('warehouseSchema', () => {
  it('accepts valid minimal data (no lat/lng)', () => {
    expect(warehouseSchema.safeParse(VALID).success).toBe(true)
  })

  it('accepts valid data with lat/lng pair', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '41.8781', longitude: '-87.6298' })
    expect(r.success).toBe(true)
  })

  it('accepts negative lat/lng values', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '-33.8688', longitude: '151.2093' })
    expect(r.success).toBe(true)
  })

  it('accepts empty string lat/lng (treated as not provided)', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '', longitude: '' })
    expect(r.success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = warehouseSchema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Name is required')
  })

  it('rejects empty address', () => {
    const r = warehouseSchema.safeParse({ ...VALID, address: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.address).toContain('Address is required')
  })

  it('rejects empty city', () => {
    const r = warehouseSchema.safeParse({ ...VALID, city: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.city).toContain('City is required')
  })

  it('rejects empty country', () => {
    const r = warehouseSchema.safeParse({ ...VALID, country: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.country).toContain('Country is required')
  })

  it('rejects invalid decimal for latitude', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: 'abc', longitude: '10' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.latitude).toContain('Invalid decimal format')
  })

  it('rejects invalid decimal for longitude', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '40', longitude: 'xyz' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.longitude).toContain('Invalid decimal format')
  })

  it('rejects latitude without longitude (pair rule)', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '41.88' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.longitude).toContain(
        'Both latitude and longitude are required together'
      )
  })

  it('rejects longitude without latitude (pair rule)', () => {
    const r = warehouseSchema.safeParse({ ...VALID, longitude: '-87.62' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.latitude).toContain(
        'Both latitude and longitude are required together'
      )
  })

  it('rejects latitude > 90', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '91', longitude: '10' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.latitude).toContain(
        'Latitude must be between -90 and 90'
      )
  })

  it('rejects latitude < -90', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '-91', longitude: '10' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.latitude).toContain(
        'Latitude must be between -90 and 90'
      )
  })

  it('rejects longitude > 180', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '40', longitude: '181' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.longitude).toContain(
        'Longitude must be between -180 and 180'
      )
  })

  it('rejects longitude < -180', () => {
    const r = warehouseSchema.safeParse({ ...VALID, latitude: '40', longitude: '-181' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.longitude).toContain(
        'Longitude must be between -180 and 180'
      )
  })
})
