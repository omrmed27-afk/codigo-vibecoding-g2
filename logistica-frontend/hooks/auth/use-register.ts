'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { register, type RegisterBody } from '@/services/auth'
import type { ApiError } from '@/types/api'
import type { AxiosError } from 'axios'

export function useRegister() {
  const router = useRouter()
  const { login: storeLogin } = useAuthStore()

  return useMutation({
    mutationFn: (body: RegisterBody) => register(body),
    onSuccess: (data) => {
      storeLogin(
        data.access,
        data.refresh,
        data.user ?? { id: 0, username: '', email: '', is_superuser: false }
      )
      router.push('/shipments')
    },
    onError: (error: AxiosError<ApiError>) => {
      const details = error.response?.data?.error?.details
      // Field errors are handled by the form component via mutate() callbacks
      // Only toast for non-field (general) errors
      if (!details || Object.keys(details).length === 0) {
        toast.error(error.response?.data?.error?.message ?? 'Registration failed')
      }
    },
  })
}
