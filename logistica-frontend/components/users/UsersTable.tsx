'use client'

import { useState, useEffect, useRef } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import AssignGroupsDialog from '@/components/users/AssignGroupsDialog'
import { Badge } from '@/components/ui/badge'
import { useDeleteUser } from '@/hooks/users/use-users'
import type { AppUser, UserListParams } from '@/types/users'
import type { PaginatedResponse } from '@/types/api'

interface Props {
  data: PaginatedResponse<AppUser> | undefined
  isLoading: boolean
  params: UserListParams
  onParamsChange: (p: Partial<UserListParams>) => void
}

export default function UsersTable({ data, isLoading, params, onParamsChange }: Props) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteUsername, setDeleteUsername] = useState('')
  const [assignUser, setAssignUser] = useState<AppUser | null>(null)

  const [searchValue, setSearchValue] = useState(params.search ?? '')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const deleteUser = useDeleteUser()

  useEffect(() => {
    setSearchValue(params.search ?? '')
  }, [params.search])

  function handleSearchChange(value: string) {
    setSearchValue(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      onParamsChange({ search: value, page: 1 })
    }, 300)
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return
    deleteUser.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
  }

  const columns: ColumnDef<AppUser, unknown>[] = [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.username}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const { first_name, last_name } = row.original
        const full = [first_name, last_name].filter(Boolean).join(' ')
        return <span className="text-gray-600">{full || '—'}</span>
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-gray-600">{row.original.email || '—'}</span>
      ),
    },
    {
      id: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.groups.length === 0 ? (
            <span className="text-gray-400 text-xs">—</span>
          ) : (
            row.original.groups.map((g) => (
              <Badge key={g} variant="secondary" className="text-xs capitalize">
                {g}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.is_superuser && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">Superadmin</Badge>
          )}
          <Badge
            variant={row.original.is_active ? 'default' : 'secondary'}
            className={`text-xs ${row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
          >
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAssignUser(row.original)}
            className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
          >
            Roles
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteId(row.original.id)
              setDeleteUsername(row.original.username)
            }}
            className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  const currentPage = params.page ?? 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by username or email…"
          className="px-3 py-2 text-sm border border-gray-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <DataTable
        data={data?.results ?? []}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      {data && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} · {data.count} total user{data.count !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onParamsChange({ page: currentPage - 1 })}
              disabled={data.previous === null}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onParamsChange({ page: currentPage + 1 })}
              disabled={data.next === null}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {assignUser && (
        <AssignGroupsDialog
          user={assignUser}
          open={assignUser !== null}
          onOpenChange={(open) => { if (!open) setAssignUser(null) }}
        />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteUsername}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteUser.isPending}
      />
    </div>
  )
}
