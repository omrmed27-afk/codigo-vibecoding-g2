'use client'

import { useState } from 'react'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import AssignPermissionsDialog from '@/components/users/AssignPermissionsDialog'
import { useGroups, useCreateGroup, useDeleteGroup } from '@/hooks/users/use-users'
import type { Group } from '@/types/users'

export default function RolesPage() {
  const { data: groups = [], isLoading } = useGroups()
  const createGroup = useCreateGroup()
  const deleteGroup = useDeleteGroup()

  const [newName, setNewName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [permGroup, setPermGroup] = useState<Group | null>(null)

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    createGroup.mutate(trimmed, { onSuccess: () => setNewName('') })
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteGroup.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
  }

  return (
    <div className="p-6">
      <PageHeader title="Roles y Grupos" />

      <div className="max-w-lg space-y-6">
        {/* Create */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Nuevo rol</p>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del rol…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              disabled={createGroup.isPending}
            />
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createGroup.isPending}
              className="shrink-0 flex items-center gap-1.5"
            >
              {createGroup.isPending && (
                <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
              )}
              Crear
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Roles existentes</p>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sin roles aún. Crea uno arriba.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium capitalize text-gray-800">
                    {group.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPermGroup(group)}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50 border border-blue-200"
                    >
                      Permisos
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDeleteId(group.id); setDeleteName(group.name) }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar Rol"
        description={`¿Eliminar el rol "${deleteName}"? Los usuarios con este rol lo perderán.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteGroup.isPending}
      />

      {permGroup && (
        <AssignPermissionsDialog
          group={permGroup}
          open={permGroup !== null}
          onOpenChange={(open) => { if (!open) setPermGroup(null) }}
        />
      )}
    </div>
  )
}
