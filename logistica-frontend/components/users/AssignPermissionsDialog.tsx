'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useGroupDetail, usePermissions, useAssignPermissions } from '@/hooks/users/use-users'
import type { Group } from '@/types/users'

interface Props {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
}

const APP_LABELS: Record<string, string> = {
  shipments: 'Envíos',
  customers: 'Clientes',
  products: 'Productos',
  warehouses: 'Bodegas',
  suppliers: 'Proveedores',
  drivers: 'Conductores',
  transport: 'Transporte',
  routes: 'Rutas',
}

const CODENAME_LABELS: Record<string, string> = {
  add: 'Crear',
  change: 'Editar',
  delete: 'Eliminar',
  view: 'Ver',
}

export default function AssignPermissionsDialog({ group, open, onOpenChange }: Props) {
  const { data: groupDetail, isLoading: loadingDetail } = useGroupDetail(open ? group.id : null)
  const { data: allPermissions = [], isLoading: loadingPerms } = usePermissions()
  const assignPermissions = useAssignPermissions()

  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (groupDetail) {
      setSelected(new Set(groupDetail.permissions.map((p) => p.id)))
    }
  }, [groupDetail])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof allPermissions>()
    for (const perm of allPermissions) {
      const existing = map.get(perm.app_label) ?? []
      map.set(perm.app_label, [...existing, perm])
    }
    return map
  }, [allPermissions])

  function toggleAll(appLabel: string, checked: boolean) {
    const ids = (grouped.get(appLabel) ?? []).map((p) => p.id)
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSave() {
    assignPermissions.mutate(
      { id: group.id, body: { permission_ids: Array.from(selected) } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  const isLoading = loadingDetail || loadingPerms

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Permisos — <span className="capitalize">{group.name}</span></DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : grouped.size === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin permisos disponibles</p>
          ) : (
            Array.from(grouped.entries()).map(([appLabel, perms]) => {
              const allSelected = perms.every((p) => selected.has(p.id))
              const someSelected = perms.some((p) => selected.has(p.id))
              return (
                <div key={appLabel} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                      onChange={(e) => toggleAll(appLabel, e.target.checked)}
                      className="w-4 h-4 accent-gray-900"
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      {APP_LABELS[appLabel] ?? appLabel}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {perms.map((perm) => {
                      const action = CODENAME_LABELS[perm.codename.split('_')[0]] ?? perm.codename
                      return (
                        <label
                          key={perm.id}
                          className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(perm.id)}
                            onChange={() => toggle(perm.id)}
                            className="w-3.5 h-3.5 accent-gray-900"
                          />
                          <span className="text-sm text-gray-700">{action}</span>
                          <span className="text-xs text-gray-400 ml-auto capitalize">
                            {perm.model}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignPermissions.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={assignPermissions.isPending || isLoading} className="flex items-center gap-2">
            {assignPermissions.isPending && (
              <LoadingSpinner className="w-4 h-4 border-white border-t-transparent" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
