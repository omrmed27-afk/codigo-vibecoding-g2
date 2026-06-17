'use client'

import { useUIStore } from '@/stores/ui.store'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, closeSidebar } = useUIStore()

  return (
    <div className="flex h-dvh bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
