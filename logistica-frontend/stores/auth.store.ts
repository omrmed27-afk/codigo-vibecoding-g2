'use client'

import { create } from 'zustand'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  is_superuser: boolean
  permissions?: string[]
}

interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isInitialized: boolean
}

interface AuthActions {
  login: (accessToken: string, refreshToken: string, user: User) => void
  setAccessToken: (token: string) => void
  logout: () => void
  initFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    document.cookie = 'is_logged_in=1; path=/'
    set({ accessToken, user, isAuthenticated: true })
  },

  setAccessToken: (token) => {
    set({ accessToken: token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    document.cookie = 'is_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
    set({ accessToken: null, user: null, isAuthenticated: false })
  },

  initFromStorage: async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      set({ isInitialized: true })
      return
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
        { refresh: refreshToken }
      )
      const newToken: string = response.data.access
      const meResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me/`,
        { headers: { Authorization: `Bearer ${newToken}` } }
      )
      const user = meResponse.data
      localStorage.setItem('user', JSON.stringify(user))
      set({ accessToken: newToken, user, isAuthenticated: true, isInitialized: true })
    } catch {
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      document.cookie = 'is_logged_in=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      set({ isInitialized: true })
    }
  },
}))
