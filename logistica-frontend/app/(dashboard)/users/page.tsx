'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import UsersTable from '@/components/users/UsersTable'
import CreateUserDialog from '@/components/users/CreateUserDialog'
import ManageRolesDialog from '@/components/users/ManageRolesDialog'
import { useUserList } from '@/hooks/users/use-users'
import type { UserListParams } from '@/types/users'

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [rolesOpen, setRolesOpen] = useState(false)

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''

  const params: UserListParams = { page, search }

  const { data, isLoading, isError } = useUserList(params)

  const handleParamsChange = useCallback(
    (updates: Partial<UserListParams>) => {
      const next = new URLSearchParams(searchParams.toString())
      if ('page' in updates) {
        if (updates.page !== undefined) next.set('page', String(updates.page))
        else next.delete('page')
      }
      if ('search' in updates) {
        if (updates.search) next.set('search', updates.search)
        else next.delete('search')
      }
      router.push(`/users?${next.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="p-6">
      <PageHeader
        title="Usuarios"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRolesOpen(true)}>
              Gestionar Roles
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Nuevo Usuario</Button>
          </div>
        }
      />

      {isError ? (
        <div className="py-8 text-center text-red-600">
          Error al cargar los usuarios. Intente nuevamente.
        </div>
      ) : (
        <UsersTable
          data={data}
          isLoading={isLoading}
          params={params}
          onParamsChange={handleParamsChange}
        />
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ManageRolesDialog open={rolesOpen} onOpenChange={setRolesOpen} />
    </div>
  )
}
