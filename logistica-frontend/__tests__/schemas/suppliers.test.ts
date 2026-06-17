import { z } from 'zod'

// Mirror of supplierSchema in components/suppliers/SupplierForm.tsx.
// Keep in sync if production schema changes.
const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  phone: z.string().min(1, 'Phone is required').max(30),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
})

const VALID = {
  name: 'Tech Supplier Inc',
  contact_name: 'John Doe',
  email: 'john@techsupply.com',
  phone: '+1987654321',
  address: '456 Industrial Ave',
  city: 'Los Angeles',
  country: 'US',
}

describe('supplierSchema', () => {
  it('accepts valid data', () => {
    expect(supplierSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects empty name', () => {
    const r = supplierSchema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Name is required')
  })

  it('rejects empty contact_name', () => {
    const r = supplierSchema.safeParse({ ...VALID, contact_name: '' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.contact_name).toContain('Contact name is required')
  })

  it('rejects empty email', () => {
    const r = supplierSchema.safeParse({ ...VALID, email: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toContain('Email is required')
  })

  it('rejects invalid email format', () => {
    const r = supplierSchema.safeParse({ ...VALID, email: 'not-an-email' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.email).toContain('Must be a valid email')
  })

  it('rejects empty phone', () => {
    const r = supplierSchema.safeParse({ ...VALID, phone: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.phone).toContain('Phone is required')
  })

  it('rejects empty address', () => {
    const r = supplierSchema.safeParse({ ...VALID, address: '' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.address).toContain('Address is required')
  })

  it('rejects empty city', () => {
    const r = supplierSchema.safeParse({ ...VALID, city: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.city).toContain('City is required')
  })

  it('rejects empty country', () => {
    const r = supplierSchema.safeParse({ ...VALID, country: '' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.country).toContain('Country is required')
  })

  it('rejects missing fields (empty object)', () => {
    const r = supplierSchema.safeParse({})
    expect(r.success).toBe(false)
    if (!r.success) {
      const errs = r.error.flatten().fieldErrors
      expect(errs.name).toBeDefined()
      expect(errs.contact_name).toBeDefined()
      expect(errs.email).toBeDefined()
      expect(errs.phone).toBeDefined()
      expect(errs.address).toBeDefined()
      expect(errs.city).toBeDefined()
      expect(errs.country).toBeDefined()
    }
  })
})
