import { z } from 'zod'

// Mirror of productSchema in components/products/ProductForm.tsx.
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  sku: z.string().min(1, 'SKU is required').max(100),
  weight_kg: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  width_cm: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  height_cm: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  depth_cm: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  unit_price: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a positive number'),
  stock_quantity: z
    .number({ error: 'Must be a number' })
    .int()
    .min(0, 'Stock cannot be negative'),
  supplier: z.number({ error: 'Supplier is required' }).int().positive(),
  warehouse: z.number({ error: 'Warehouse is required' }).int().positive(),
})

const VALID = {
  name: 'Laptop Pro',
  sku: 'LP-001',
  weight_kg: '1.500',
  width_cm: '35.50',
  height_cm: '23.00',
  depth_cm: '18.50',
  unit_price: '1299.99',
  stock_quantity: 50,
  supplier: 1,
  warehouse: 1,
}

describe('productSchema', () => {
  it('accepts valid data', () => {
    expect(productSchema.safeParse(VALID).success).toBe(true)
  })

  it('accepts valid data with description', () => {
    expect(productSchema.safeParse({ ...VALID, description: 'A laptop' }).success).toBe(true)
  })

  it('accepts null description', () => {
    expect(productSchema.safeParse({ ...VALID, description: null }).success).toBe(true)
  })

  it('accepts omitted description (optional)', () => {
    const { description: _, ...noDesc } = { ...VALID, description: undefined }
    expect(productSchema.safeParse(noDesc).success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = productSchema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Name is required')
  })

  it('rejects empty sku', () => {
    const r = productSchema.safeParse({ ...VALID, sku: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.sku).toContain('SKU is required')
  })

  it.each([
    ['weight_kg', 'abc'],
    ['width_cm', '-1'],
    ['height_cm', ''],
    ['depth_cm', '1.2.3'],
    ['unit_price', 'free'],
  ])('rejects invalid decimal for %s = "%s"', (field, value) => {
    const r = productSchema.safeParse({ ...VALID, [field]: value })
    expect(r.success).toBe(false)
    if (!r.success) {
      const errs = r.error.flatten().fieldErrors
      expect(errs[field as keyof typeof errs]).toBeDefined()
    }
  })

  it('rejects negative stock_quantity', () => {
    const r = productSchema.safeParse({ ...VALID, stock_quantity: -1 })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.stock_quantity).toContain('Stock cannot be negative')
  })

  it('rejects non-integer stock_quantity', () => {
    const r = productSchema.safeParse({ ...VALID, stock_quantity: 1.5 })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.stock_quantity).toBeDefined()
  })

  it('accepts stock_quantity of 0', () => {
    expect(productSchema.safeParse({ ...VALID, stock_quantity: 0 }).success).toBe(true)
  })

  it('rejects missing supplier', () => {
    const r = productSchema.safeParse({ ...VALID, supplier: undefined })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.supplier).toBeDefined()
  })

  it('rejects missing warehouse', () => {
    const r = productSchema.safeParse({ ...VALID, warehouse: undefined })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.warehouse).toBeDefined()
  })
})
