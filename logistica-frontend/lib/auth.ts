const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

/** Writes only the keys that are provided — omitting a key leaves it untouched. */
export function setTokens({ access, refresh }: { access?: string; refresh?: string }): void {
  if (typeof window === 'undefined') return
  if (access !== undefined) localStorage.setItem(ACCESS_KEY, access)
  if (refresh !== undefined) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}
