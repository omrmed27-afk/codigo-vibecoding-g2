import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'

const API_BASE = 'http://localhost:8000/api'

// ─── Mock auth store ───────────────────────────────────────────────────────
const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: {
    accessToken: null as string | null,
    logout: vi.fn(),
    setAccessToken: vi.fn(),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => mockAuthState },
}))

// Static import: api is created once so the interceptor closures are stable.
// Use unique URLs per test to guarantee no handler cross-contamination.
import api from '@/services/api'

beforeEach(() => {
  mockAuthState.accessToken = null
  mockAuthState.logout.mockClear()
  mockAuthState.setAccessToken.mockClear()
  mockAuthState.setAccessToken.mockImplementation((t: string) => {
    mockAuthState.accessToken = t
  })
  localStorage.clear()
})

// ─── window.location spy ──────────────────────────────────────────────────
// Proxy the real window.location so URL resolution (origin, host, etc.) keeps
// working for MSW / jsdom — only the href *setter* is captured.
function spyOnLocationHref() {
  const captured = { href: '' }
  const proxy = new Proxy(window.location, {
    set(_target, prop, value) {
      if (prop === 'href') {
        captured.href = String(value)
        return true // intercept; don't actually navigate
      }
      return true
    },
  })
  const original = window.location
  Object.defineProperty(window, 'location', {
    value: proxy,
    writable: true,
    configurable: true,
  })
  return { captured, restore: () => Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true }) }
}

// ─── Request interceptor ───────────────────────────────────────────────────

describe('request interceptor', () => {
  it('adds Authorization: Bearer header when access token present', async () => {
    mockAuthState.accessToken = 'my-access-token'

    let captured = ''
    server.use(
      http.get(`${API_BASE}/req-auth`, ({ request }) => {
        captured = request.headers.get('authorization') ?? ''
        return HttpResponse.json({})
      })
    )

    await api.get('/req-auth')
    expect(captured).toBe('Bearer my-access-token')
  })

  it('omits Authorization header when no access token', async () => {
    mockAuthState.accessToken = null

    let captured: string | null = 'sentinel'
    server.use(
      http.get(`${API_BASE}/req-noauth`, ({ request }) => {
        captured = request.headers.get('authorization')
        return HttpResponse.json({})
      })
    )

    await api.get('/req-noauth')
    expect(captured).toBeNull()
  })
})

// ─── Response interceptor — 401 handling ──────────────────────────────────

describe('response interceptor — 401', () => {
  it('refreshes token on 401 and retries request with the new token', async () => {
    localStorage.setItem('refresh_token', 'valid-refresh')

    let callCount = 0
    let lastAuthHeader = ''
    server.use(
      http.get(`${API_BASE}/r-protected`, ({ request }) => {
        callCount++
        lastAuthHeader = request.headers.get('authorization') ?? ''
        return callCount === 1
          ? new HttpResponse(null, { status: 401 })
          : HttpResponse.json({ data: 'ok' })
      }),
      http.post(`${API_BASE}/auth/refresh/`, () =>
        HttpResponse.json({ access: 'refreshed-token' })
      )
    )

    const res = await api.get('/r-protected')

    expect(res.data).toEqual({ data: 'ok' })
    expect(callCount).toBe(2)
    expect(mockAuthState.setAccessToken).toHaveBeenCalledWith('refreshed-token')
    expect(lastAuthHeader).toBe('Bearer refreshed-token')
  })

  it('calls logout and redirects to /login when no refresh token', async () => {
    // localStorage is empty — no refresh_token
    const { captured, restore } = spyOnLocationHref()

    server.use(
      http.get(`${API_BASE}/r-unauth`, () => new HttpResponse(null, { status: 401 }))
    )

    try {
      await expect(api.get('/r-unauth')).rejects.toThrow()
      expect(mockAuthState.logout).toHaveBeenCalledOnce()
      expect(captured.href).toBe('/login')
    } finally {
      restore()
    }
  })

  it('calls logout and redirects to /login when refresh call fails', async () => {
    localStorage.setItem('refresh_token', 'bad-refresh')
    const { captured, restore } = spyOnLocationHref()

    server.use(
      http.get(`${API_BASE}/r-failrefresh`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${API_BASE}/auth/refresh/`, () => new HttpResponse(null, { status: 401 }))
    )

    try {
      await expect(api.get('/r-failrefresh')).rejects.toThrow()
      expect(mockAuthState.logout).toHaveBeenCalledOnce()
      expect(captured.href).toBe('/login')
    } finally {
      restore()
    }
  })

  it('does not retry infinitely — _retry flag prevents more than one retry', async () => {
    localStorage.setItem('refresh_token', 'valid-refresh')
    const { restore } = spyOnLocationHref()

    let callCount = 0
    server.use(
      // Always 401 — even the retry gets rejected
      http.get(`${API_BASE}/r-always401`, () => {
        callCount++
        return new HttpResponse(null, { status: 401 })
      }),
      http.post(`${API_BASE}/auth/refresh/`, () =>
        HttpResponse.json({ access: 'new-token' })
      )
    )

    try {
      await expect(api.get('/r-always401')).rejects.toThrow()
      // original call (401) + exactly 1 retry (401 again, stopped by _retry flag)
      expect(callCount).toBe(2)
    } finally {
      restore()
    }
  })
})
