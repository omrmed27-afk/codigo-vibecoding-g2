// Uses plain axios (not the intercepted instance) to avoid refresh loops
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export interface LoginBody {
  username: string
  password: string
}

export interface RegisterBody {
  username: string
  password: string
  email?: string
  first_name?: string
  last_name?: string
}

export interface AuthUser {
  id: number
  username: string
  email: string
  is_superuser: boolean
}

export interface AuthResponse {
  access: string
  refresh: string
  user?: AuthUser
}

export async function login(body: LoginBody): Promise<AuthResponse> {
  const res = await axios.post(`${BASE_URL}/auth/login/`, body)
  return res.data
}

export async function register(body: RegisterBody): Promise<AuthResponse> {
  const res = await axios.post(`${BASE_URL}/auth/register/`, body)
  return res.data
}

export async function refreshToken(refresh: string): Promise<{ access: string }> {
  const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
  return res.data
}
