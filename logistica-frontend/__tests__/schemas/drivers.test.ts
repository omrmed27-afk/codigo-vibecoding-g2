import { z } from 'zod'

// Mirrors createDriverSchema and editDriverSchema in components/drivers/DriverForm.tsx.
const createDriverSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  license_number: z.string().min(1, 'License number is required').max(50),
  license_expiry: z
    .string()
    .min(1, 'License expiry is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'),
  phone: z.string().min(1, 'Phone is required').max(30),
  status: z.enum(['available', 'busy', 'off_duty'], { error: 'Status is required' }),
})

const editDriverSchema = z.object({
  email: z.string().email('Must be a valid email').optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  license_number: z.string().max(50).optional(),
  license_expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)')
    .optional(),
  phone: z.string().max(30).optional(),
  status: z.enum(['available', 'busy', 'off_duty'], { error: 'Status is required' }).optional(),
})

const VALID_CREATE = {
  username: 'jsmith',
  password: 'pass1234',
  email: 'j@example.com',
  first_name: 'John',
  last_name: 'Smith',
  license_number: 'DL-001',
  license_expiry: '2027-12-31',
  phone: '+1987654321',
  status: 'available' as const,
}

describe('createDriverSchema', () => {
  it('accepts valid create data', () => {
    expect(createDriverSchema.safeParse(VALID_CREATE).success).toBe(true)
  })

  it('rejects empty username', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, username: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.username).toContain('Username is required')
  })

  it('rejects password shorter than 8 chars', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, password: 'short' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.password).toContain('Password must be at least 8 characters')
  })

  it('rejects invalid email', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, email: 'not-email' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toContain('Must be a valid email')
  })

  it('rejects empty first_name', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, first_name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.first_name).toContain('First name is required')
  })

  it('rejects empty last_name', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, last_name: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.last_name).toContain('Last name is required')
  })

  it('rejects empty license_number', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, license_number: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.license_number).toContain('License number is required')
  })

  it('rejects invalid license_expiry format', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, license_expiry: '31/12/2027' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.license_expiry).toContain('Must be a valid date (YYYY-MM-DD)')
  })

  it('rejects empty license_expiry', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, license_expiry: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.license_expiry).toContain('License expiry is required')
  })

  it('rejects empty phone', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, phone: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.phone).toContain('Phone is required')
  })

  it('rejects invalid status', () => {
    const r = createDriverSchema.safeParse({ ...VALID_CREATE, status: 'sleeping' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.status).toBeDefined()
  })

  it('accepts all valid status values', () => {
    for (const status of ['available', 'busy', 'off_duty'] as const) {
      expect(createDriverSchema.safeParse({ ...VALID_CREATE, status }).success).toBe(true)
    }
  })
})

describe('editDriverSchema', () => {
  it('accepts empty object (all optional)', () => {
    expect(editDriverSchema.safeParse({}).success).toBe(true)
  })

  it('accepts partial update with status only', () => {
    expect(editDriverSchema.safeParse({ status: 'busy' }).success).toBe(true)
  })

  it('rejects invalid email when provided', () => {
    const r = editDriverSchema.safeParse({ email: 'bad-email' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toContain('Must be a valid email')
  })

  it('rejects invalid license_expiry format when provided', () => {
    const r = editDriverSchema.safeParse({ license_expiry: '12-2027-31' })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.license_expiry).toContain('Must be a valid date (YYYY-MM-DD)')
  })
})
