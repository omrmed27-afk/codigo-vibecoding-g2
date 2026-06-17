'use client'

import { create } from 'zustand'

interface UIState {
  modals: Record<string, boolean>
  sidebarOpen: boolean
  openModal: (id: string) => void
  closeModal: (id: string) => void
  isModalOpen: (id: string) => boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  modals: {},
  sidebarOpen: false,

  openModal: (id) =>
    set((state) => ({ modals: { ...state.modals, [id]: true } })),

  closeModal: (id) =>
    set((state) => ({ modals: { ...state.modals, [id]: false } })),

  isModalOpen: (id) => get().modals[id] ?? false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  closeSidebar: () => set({ sidebarOpen: false }),
}))
