import { z } from 'zod'

// Mirror of customerSchema in components/customers/CustomerForm.tsx.
// Keep in sync if production schema changes.
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  customer_type: z.enum(['company', 'individual'], {
    error: 'Customer type is required',
  }),
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  phone: z.string().min(1, 'Phone is required').max(30),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  country: z.string().min(1, 'Country is required').max(100),
  tax_id: z.string().max(100).optional().nullable(),
})

const VALID = {
  name: 'Acme Corp',
  customer_type: 'company' as const,
  email: 'contact@acme.com',
  phone: '+1234567890',
  address: '123 Main St',
  city: 'New York',
  country: 'US',
}

describe('customerSchema', () => {
  it('accepts valid company data without tax_id', () => {
    expect(customerSchema.safeParse(VALID).success).toBe(true)
  })

  it('accepts valid individual data with tax_id', () => {
    const r = customerSchema.safeParse({ ...VALID, customer_type: 'individual', tax_id: 'US999' })
    expect(r.success).toBe(true)
  })

  it('accepts null tax_id', () => {
    expect(customerSchema.safeParse({ ...VALID, tax_id: null }).success).toBe(true)
  })

  it('accepts omitted tax_id (optional)', () => {
    const { tax_id: _, ...noTaxId } = { ...VALID, tax_id: undefined }
    expect(customerSchema.safeParse(noTaxId).success).toBe(true)
  })

  it('rejects invalid customer_type value', () => {
    const r = customerSchema.safeParse({ ...VALID, customer_type: 'corporation' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.customer_type).toBeDefined()
  })

  it('rejects missing customer_type', () => {
    const r = customerSchema.safeParse({ ...VALID, customer_type: undefined })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.customer_type).toBeDefined()
  })

  it('rejects empty name', () => {
    const r = customerSchema.safeParse({ ...VALID, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.name).toContain('Name is required')
  })

  it('rejects empty email', () => {
    const r = customerSchema.safeParse({ ...VALID, email: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toContain('Email is required')
  })

  it('rejects invalid email format', () => {
    const r = customerSchema.safeParse({ ...VALID, email: 'not-an-email' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.email).toContain('Must be a valid email')
  })

  it('rejects empty phone', () => {
    const r = customerSchema.safeParse({ ...VALID, phone: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.phone).toContain('Phone is required')
  })

  it('rejects empty address', () => {
    const r = customerSchema.safeParse({ ...VALID, address: '' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.address).toContain('Address is required')
  })

  it('rejects empty city', () => {
    const r = customerSchema.safeParse({ ...VALID, city: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.city).toContain('City is required')
  })

  it('rejects empty country', () => {
    const r = customerSchema.safeParse({ ...VALID, country: '' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.country).toContain('Country is required')
  })

  it('rejects all fields missing', () => {
    const r = customerSchema.safeParse({})
    expect(r.success).toBe(false)
    if (!r.success) {
      const errs = r.error.flatten().fieldErrors
      expect(errs.name).toBeDefined()
      expect(errs.customer_type).toBeDefined()
      expect(errs.email).toBeDefined()
      expect(errs.phone).toBeDefined()
      expect(errs.address).toBeDefined()
      expect(errs.city).toBeDefined()
      expect(errs.country).toBeDefined()
    }
  })
})
