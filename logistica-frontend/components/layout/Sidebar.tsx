'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Package, Users, Box, Building, Building2, Truck, User, Map, LayoutDashboard, ShieldCheck, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import type { LucideIcon } from 'lucide-react'

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Tablero', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Envíos', href: '/shipments', icon: Package },
  { label: 'Clientes', href: '/customers', icon: Users },
  { label: 'Productos', href: '/products', icon: Box },
  { label: 'Proveedores', href: '/suppliers', icon: Building },
  { label: 'Bodegas', href: '/warehouses', icon: Building2 },
  { label: 'Transporte', href: '/transport', icon: Truck },
  { label: 'Conductores', href: '/drivers', icon: User },
  { label: 'Rutas', href: '/routes', icon: Map },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, closeSidebar } = useUIStore()
  const isSuperAdmin = useAuthStore((s) => s.user?.is_superuser ?? false)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out',
        'lg:static lg:z-auto lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">Logística</h1>
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={closeSidebar}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors',
              pathname.startsWith(href)
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isSuperAdmin && (
          <>
            <div className="my-2 border-t border-gray-100" />
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Administración
            </p>
            <Link
              href="/users"
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors',
                pathname.startsWith('/users')
                  ? 'bg-purple-50 text-purple-900 font-medium'
                  : 'text-purple-600 hover:bg-purple-50 hover:text-purple-900'
              )}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Usuarios
            </Link>
            <Link
              href="/roles"
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors',
                pathname.startsWith('/roles')
                  ? 'bg-purple-50 text-purple-900 font-medium'
                  : 'text-purple-600 hover:bg-purple-50 hover:text-purple-900'
              )}
            >
              <Tag className="w-4 h-4 shrink-0" />
              Roles
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
