'use client'

import { Menu, User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function getInitials(username: string): string {
  const parts = username.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Topbar() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  const displayName = user?.username ?? '—'
  const initials = user ? getInitials(displayName) : '?'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden mr-3 p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Profile dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer"
            aria-label="Menú de perfil"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline max-w-[120px] truncate">
              {displayName}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          {/* User info header */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </span>
              {user?.email && (
                <span className="text-xs text-gray-500 truncate">{user.email}</span>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
              <User className="w-4 h-4 text-gray-500" />
              <span>Mi Perfil</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
