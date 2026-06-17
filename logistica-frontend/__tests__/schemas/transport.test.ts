import { z } from 'zod'

// Mirror of transportSchema in components/transport/TransportForm.tsx.
const transportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['truck', 'van', 'motorcycle', 'bicycle'], { error: 'Type is required' }),
  plate_number: z.string().min(1, 'Plate number is required').max(20),
  capacity_kg: z
    .string()
    .min(1, 'Capacity (kg) is required')
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number'),
  capacity_m3: z
    .string()
    .min(1, 'Capacity (m³) is required')
    .regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number'),
  driver: z.number().nullable().optional(),
  status: z.enum(['available', 'in_transit', 'maintenance'], { error: 'Status is required' }),
})

const VALID = {
  name: 'Truck A1',
  type: 'truck' as const,
  plate_number: 'ABC-1234',
  capacity_kg: '5000.00',
  capacity_m3: '12.500',
  status: 'available' as const,
}

describe('transportSchema', () => {
  it('accepts valid data', () => {
    expect(transportSchema.safeParse(VALID).success).toBe(true)
  })

  it('accepts all vehicle types', () => {
    for (const type of ['truck', 'van', 'motorcycle', 'bicycle'] as const) {
      expect(transportSchema.safeParse({ ...VALID, type }).success).toBe(true)
    }
  })

  it('accepts all transport statuses', () => {
    for (const status of ['available', 'in_transit', 'maintenance'] as const) {
      expect(transportSchema.safeParse({ ...VALID, status }).success).toBe(true)
    }
  })

  it('accepts null driver', () => {
    expect(transportSchema.safeParse({ ...VALID, driver: null }).success).toBe(true)
  })

  it('accepts numeric driver id', () => {
    expect(transportSchema.safeParse({ ...VALID, driver: 5 }).success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = transportSchema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Name is required')
  })

  it('rejects invalid type', () => {
    const r = transportSchema.safeParse({ ...VALID, type: 'boat' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.type).toBeDefined()
  })

  it('rejects empty plate_number', () => {
    const r = transportSchema.safeParse({ ...VALID, plate_number: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.plate_number).toContain('Plate number is required')
  })

  it('rejects invalid capacity_kg (non-numeric)', () => {
    const r = transportSchema.safeParse({ ...VALID, capacity_kg: 'abc' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.capacity_kg).toContain('Must be a valid decimal number')
  })

  it('rejects empty capacity_kg', () => {
    const r = transportSchema.safeParse({ ...VALID, capacity_kg: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.capacity_kg).toBeDefined()
  })

  it('rejects invalid capacity_m3', () => {
    const r = transportSchema.safeParse({ ...VALID, capacity_m3: '-5' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.capacity_m3).toContain('Must be a valid decimal number')
  })

  it('rejects invalid status', () => {
    const r = transportSchema.safeParse({ ...VALID, status: 'broken' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.status).toBeDefined()
  })
})
