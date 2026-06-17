'use client'

import { useAuthStore } from '@/stores/auth.store'

export function usePermission(perm: string): boolean {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.is_superuser) return true
  return (user.permissions ?? []).includes(perm)
}

export function useModulePermissions(appLabel: string) {
  const user = useAuthStore((s) => s.user)
  if (!user) return { canView: false, canAdd: false, canChange: false, canDelete: false }
  if (user.is_superuser) return { canView: true, canAdd: true, canChange: true, canDelete: true }
  const perms = user.permissions ?? []
  return {
    canView:   perms.includes(`${appLabel}.view_${appLabel.replace(/s$/, '')}`),
    canAdd:    perms.includes(`${appLabel}.add_${appLabel.replace(/s$/, '')}`),
    canChange: perms.includes(`${appLabel}.change_${appLabel.replace(/s$/, '')}`),
    canDelete: perms.includes(`${appLabel}.delete_${appLabel.replace(/s$/, '')}`),
  }
}
