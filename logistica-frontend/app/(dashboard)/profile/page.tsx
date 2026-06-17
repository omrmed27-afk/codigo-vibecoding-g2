'use client'

import { useAuthStore } from '@/stores/auth.store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Mail, User, Shield, Hash } from 'lucide-react'

function getInitials(username: string): string {
  const parts = username.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 p-1.5 rounded-md bg-gray-100 text-gray-500 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-500">No hay sesión activa.</p>
      </div>
    )
  }

  const displayName = user.is_superuser ? 'Administrador' : user.username
  const initials = getInitials(displayName)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Información de tu cuenta</p>
      </div>

      {/* Avatar + name card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
          {/* Avatar */}
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name + role */}
          <div className="flex flex-col items-center sm:items-start gap-1.5 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
            {user.email && <p className="text-sm text-gray-500 break-all">{user.email}</p>}
            <Badge
              variant={user.is_superuser ? 'default' : 'secondary'}
              className="mt-1 text-xs"
            >
              {user.is_superuser ? 'Superusuario' : 'Usuario activo'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Detalles de cuenta</h3>
        <p className="text-xs text-gray-500 mb-4">Información registrada en el sistema</p>

        <div className="divide-y divide-gray-100">
          {user.id > 0 && (
            <InfoRow
              icon={<Hash className="w-3.5 h-3.5" />}
              label="ID de usuario"
              value={String(user.id)}
            />
          )}
          <InfoRow
            icon={<User className="w-3.5 h-3.5" />}
            label="Nombre de usuario"
            value={user.username}
          />
          {user.email && (
            <InfoRow
              icon={<Mail className="w-3.5 h-3.5" />}
              label="Correo electrónico"
              value={user.email}
            />
          )}
          <InfoRow
            icon={<Shield className="w-3.5 h-3.5" />}
            label="Rol"
            value={user.is_superuser ? 'Administrador del sistema' : 'Usuario de logística'}
          />
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-gray-400 text-center mt-4">
        Para cambiar tu contraseña o correo, contacta al administrador del sistema.
      </p>
    </div>
  )
}
