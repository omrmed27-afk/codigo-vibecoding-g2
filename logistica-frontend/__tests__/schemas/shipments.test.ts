import { z } from 'zod'

// Mirrors createSchema + editSchema in components/shipments/ShipmentForm.tsx.
// Uses '2099-12-31' as future date to avoid flakiness from dynamic `today`.

const today = new Date().toISOString().split('T')[0]

const productItemSchema = z.object({
  product: z.number(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
})

const createSchema = z.object({
  customer: z.number({ error: 'Customer is required' }),
  origin_warehouse: z.number({ error: 'Origin warehouse is required' }),
  destination_address: z.string().min(1, 'Destination address is required').max(500),
  destination_city: z.string().min(1, 'Destination city is required').max(100),
  destination_country: z.string().min(1, 'Destination country is required').max(100),
  scheduled_delivery_date: z
    .string()
    .min(1, 'Scheduled delivery date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
    .refine((val) => val >= today, { message: 'Delivery date cannot be in the past' }),
  weight_kg: z
    .string()
    .min(1, 'Weight is required')
    .regex(/^\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' }),
  notes: z.string().nullable().optional(),
  products: z.array(productItemSchema).min(1, { message: 'At least one product is required' }),
})

const editSchema = z.object({
  destination_address: z.string().min(1, 'Destination address is required').max(500),
  destination_city: z.string().min(1, 'Destination city is required').max(100),
  destination_country: z.string().min(1, 'Destination country is required').max(100),
  scheduled_delivery_date: z
    .string()
    .min(1, 'Scheduled delivery date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
    .refine((val) => val >= today, { message: 'Delivery date cannot be in the past' }),
  weight_kg: z
    .string()
    .min(1, 'Weight is required')
    .regex(/^\d+(\.\d+)?$/, { message: 'Must be a valid decimal number' }),
  notes: z.string().nullable().optional(),
})

const VALID_CREATE = {
  customer: 1,
  origin_warehouse: 1,
  destination_address: '456 Business Blvd',
  destination_city: 'Boston',
  destination_country: 'US',
  scheduled_delivery_date: '2099-12-31',
  weight_kg: '5.500',
  products: [{ product: 1, quantity: 2 }],
}

const VALID_EDIT = {
  destination_address: '456 Business Blvd',
  destination_city: 'Boston',
  destination_country: 'US',
  scheduled_delivery_date: '2099-12-31',
  weight_kg: '5.500',
}

describe('createSchema', () => {
  it('accepts valid create data', () => {
    expect(createSchema.safeParse(VALID_CREATE).success).toBe(true)
  })

  it('accepts notes as null', () => {
    expect(createSchema.safeParse({ ...VALID_CREATE, notes: null }).success).toBe(true)
  })

  it('rejects missing customer', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, customer: undefined })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.customer).toBeDefined()
  })

  it('rejects missing origin_warehouse', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, origin_warehouse: undefined })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.origin_warehouse).toBeDefined()
  })

  it('rejects empty destination_address', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, destination_address: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.destination_address).toContain('Destination address is required')
  })

  it('rejects empty destination_city', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, destination_city: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.destination_city).toContain('Destination city is required')
  })

  it('rejects empty destination_country', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, destination_country: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.destination_country).toContain('Destination country is required')
  })

  it('rejects invalid date format for scheduled_delivery_date', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, scheduled_delivery_date: '31/12/2099' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.scheduled_delivery_date).toContain('Date must be YYYY-MM-DD')
  })

  it('rejects past date for scheduled_delivery_date', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, scheduled_delivery_date: '2000-01-01' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.scheduled_delivery_date).toContain('Delivery date cannot be in the past')
  })

  it('rejects invalid weight_kg', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, weight_kg: 'heavy' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.weight_kg).toContain('Must be a valid decimal number')
  })

  it('rejects empty products array', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, products: [] })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.products).toContain('At least one product is required')
  })

  it('rejects product with quantity 0', () => {
    const r = createSchema.safeParse({ ...VALID_CREATE, products: [{ product: 1, quantity: 0 }] })
    expect(r.success).toBe(false)
  })
})

describe('editSchema', () => {
  it('accepts valid edit data', () => {
    expect(editSchema.safeParse(VALID_EDIT).success).toBe(true)
  })

  it('rejects empty destination_address', () => {
    const r = editSchema.safeParse({ ...VALID_EDIT, destination_address: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.destination_address).toContain('Destination address is required')
  })

  it('rejects invalid date format', () => {
    const r = editSchema.safeParse({ ...VALID_EDIT, scheduled_delivery_date: 'tomorrow' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.scheduled_delivery_date).toBeDefined()
  })

  it('rejects past date', () => {
    const r = editSchema.safeParse({ ...VALID_EDIT, scheduled_delivery_date: '2000-01-01' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.scheduled_delivery_date).toContain('Delivery date cannot be in the past')
  })

  it('rejects invalid weight_kg', () => {
    const r = editSchema.safeParse({ ...VALID_EDIT, weight_kg: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.weight_kg).toBeDefined()
  })
})
