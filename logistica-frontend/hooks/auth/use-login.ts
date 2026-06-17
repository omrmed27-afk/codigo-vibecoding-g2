'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { login, type LoginBody } from '@/services/auth'

export function useLogin() {
  const router = useRouter()
  const { login: storeLogin } = useAuthStore()

  return useMutation({
    mutationFn: (body: LoginBody) => login(body),
    onSuccess: (data, variables) => {
      storeLogin(
        data.access,
        data.refresh,
        data.user ?? { id: 0, username: variables.username, email: '', is_superuser: false }
      )
      router.push('/shipments')
    },
  })
}
