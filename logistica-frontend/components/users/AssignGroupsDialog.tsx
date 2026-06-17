'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useGroups, useAssignGroups } from '@/hooks/users/use-users'
import type { AppUser } from '@/types/users'

interface Props {
  user: AppUser
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AssignGroupsDialog({ user, open, onOpenChange }: Props) {
  const { data: groups = [], isLoading } = useGroups()
  const assignGroups = useAssignGroups()

  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open && groups.length > 0) {
      const currentIds = groups
        .filter((g) => user.groups.includes(g.name))
        .map((g) => g.id)
      setSelected(new Set(currentIds))
    }
  }, [open, groups, user.groups])

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    assignGroups.mutate(
      { id: user.id, body: { group_ids: Array.from(selected) } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Roles — {user.username}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No groups found</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(group.id)}
                    onChange={() => toggle(group.id)}
                    className="w-4 h-4 accent-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-800 capitalize">
                    {group.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignGroups.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={assignGroups.isPending || isLoading}
            className="flex items-center gap-2"
          >
            {assignGroups.isPending && (
              <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
