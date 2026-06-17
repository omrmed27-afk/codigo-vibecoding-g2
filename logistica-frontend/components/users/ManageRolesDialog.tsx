'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useGroups, useCreateGroup, useDeleteGroup } from '@/hooks/users/use-users'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ManageRolesDialog({ open, onOpenChange }: Props) {
  const { data: groups = [], isLoading } = useGroups()
  const createGroup = useCreateGroup()
  const deleteGroup = useDeleteGroup()

  const [newName, setNewName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteName, setDeleteName] = useState('')

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    createGroup.mutate(trimmed, {
      onSuccess: () => setNewName(''),
    })
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteGroup.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gestionar Roles</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Create new role */}
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

            {/* Existing roles */}
            <div className="space-y-1">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner />
                </div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin roles aún</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md border border-gray-200"
                  >
                    <span className="text-sm font-medium capitalize">{group.name}</span>
                    <button
                      type="button"
                      onClick={() => { setDeleteId(group.id); setDeleteName(group.name) }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar Rol"
        description={`¿Eliminar el rol "${deleteName}"? Los usuarios con este rol lo perderán.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteGroup.isPending}
      />
    </>
  )
}
