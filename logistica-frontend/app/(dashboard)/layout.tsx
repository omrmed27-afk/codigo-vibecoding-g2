'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import AppShell from '@/components/layout/AppShell'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isInitialized, initFromStorage } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initFromStorage()
    }
  }, [initFromStorage])

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isInitialized, isAuthenticated, router])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <AppShell>{children}</AppShell>
}
