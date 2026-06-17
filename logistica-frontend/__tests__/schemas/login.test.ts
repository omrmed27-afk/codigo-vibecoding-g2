import { z } from 'zod'

// Mirrors the schema in components/auth/LoginForm.tsx.
// If the production schema changes, update this copy accordingly.
const loginSchema = z.object({
  username: z.string().min(1, 'Requerido'),
  password: z.string().min(1, 'Requerido'),
})

describe('Login Zod schema', () => {
  it('rejects empty username', () => {
    const result = loginSchema.safeParse({ username: '', password: 'secret' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.username).toContain('Requerido')
    }
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ username: 'user', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain('Requerido')
    }
  })

  it('rejects both fields empty with correct messages', () => {
    const result = loginSchema.safeParse({ username: '', password: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors
      expect(errs.username).toContain('Requerido')
      expect(errs.password).toContain('Requerido')
    }
  })

  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ username: 'testuser', password: 'pass1234' })
    expect(result.success).toBe(true)
  })

  it('rejects missing fields (undefined)', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors
      expect(errs.username).toBeDefined()
      expect(errs.password).toBeDefined()
    }
  })
})
