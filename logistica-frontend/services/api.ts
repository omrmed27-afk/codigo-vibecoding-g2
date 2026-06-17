import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

const api = axios.create({ baseURL: BASE_URL })

// Concurrent-401 queue: ensures only one refresh call fires even if many requests fail simultaneously
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original: InternalAxiosRequestConfig & { _retry?: boolean } = error.config

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null

    if (!refreshToken) {
      useAuthStore.getState().logout()
      processQueue(error, null)
      isRefreshing = false
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      // Plain axios call — bypasses this interceptor to avoid infinite loop
      const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken })
      const newToken: string = res.data.access
      useAuthStore.getState().setAccessToken(newToken)
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      useAuthStore.getState().logout()
      processQueue(refreshError, null)
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
