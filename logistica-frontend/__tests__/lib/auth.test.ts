import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  setTokens,
} from '@/lib/auth'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

// ─── getAccessToken ────────────────────────────────────────────────────────

describe('getAccessToken', () => {
  it('returns null when nothing stored', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('returns stored value', () => {
    localStorage.setItem(ACCESS_KEY, 'tok-abc')
    expect(getAccessToken()).toBe('tok-abc')
  })
})

// ─── getRefreshToken ───────────────────────────────────────────────────────

describe('getRefreshToken', () => {
  it('returns null when nothing stored', () => {
    expect(getRefreshToken()).toBeNull()
  })

  it('returns stored value', () => {
    localStorage.setItem(REFRESH_KEY, 'ref-xyz')
    expect(getRefreshToken()).toBe('ref-xyz')
  })
})

// ─── setTokens ─────────────────────────────────────────────────────────────

describe('setTokens', () => {
  it('writes both tokens when both provided', () => {
    setTokens({ access: 'acc', refresh: 'ref' })
    expect(localStorage.getItem(ACCESS_KEY)).toBe('acc')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('ref')
  })

  it('writes only access and leaves refresh untouched', () => {
    localStorage.setItem(REFRESH_KEY, 'existing-ref')
    setTokens({ access: 'new-acc' })
    expect(localStorage.getItem(ACCESS_KEY)).toBe('new-acc')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('existing-ref')
  })

  it('writes only refresh and leaves access untouched', () => {
    localStorage.setItem(ACCESS_KEY, 'existing-acc')
    setTokens({ refresh: 'new-ref' })
    expect(localStorage.getItem(ACCESS_KEY)).toBe('existing-acc')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('new-ref')
  })

  it('does nothing when called with empty object', () => {
    localStorage.setItem(ACCESS_KEY, 'keep')
    setTokens({})
    expect(localStorage.getItem(ACCESS_KEY)).toBe('keep')
  })
})

// ─── clearTokens ───────────────────────────────────────────────────────────

describe('clearTokens', () => {
  it('removes both tokens', () => {
    localStorage.setItem(ACCESS_KEY, 'acc')
    localStorage.setItem(REFRESH_KEY, 'ref')
    clearTokens()
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('does not throw when tokens are absent', () => {
    expect(() => clearTokens()).not.toThrow()
  })
})

// ─── isAuthenticated ───────────────────────────────────────────────────────

describe('isAuthenticated', () => {
  it('returns true when access token is truthy', () => {
    localStorage.setItem(ACCESS_KEY, 'any-token')
    expect(isAuthenticated()).toBe(true)
  })

  it('returns false when no access token', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns false when access token is empty string', () => {
    localStorage.setItem(ACCESS_KEY, '')
    expect(isAuthenticated()).toBe(false)
  })
})

// ─── SSR guards ────────────────────────────────────────────────────────────
// Temporarily set window = undefined to simulate a server-side render context.

describe('SSR guards (window = undefined)', () => {
  let savedWindow: typeof globalThis.window

  beforeEach(() => {
    savedWindow = globalThis.window
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: savedWindow,
      writable: true,
      configurable: true,
    })
  })

  it('getAccessToken returns null', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('getRefreshToken returns null', () => {
    expect(getRefreshToken()).toBeNull()
  })

  it('setTokens does not throw', () => {
    expect(() => setTokens({ access: 'x', refresh: 'y' })).not.toThrow()
  })

  it('clearTokens does not throw', () => {
    expect(() => clearTokens()).not.toThrow()
  })

  it('isAuthenticated returns false', () => {
    expect(isAuthenticated()).toBe(false)
  })
})
