export interface AppUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_superuser: boolean
  groups: string[]
}

export interface Group {
  id: number
  name: string
}

export interface UserListParams {
  page?: number
  search?: string
}

export interface CreateUserBody {
  username: string
  password: string
  email?: string
  first_name?: string
  last_name?: string
  group_ids?: number[]
}

export interface UpdateUserBody {
  email?: string
  first_name?: string
  last_name?: string
  is_active?: boolean
}

export interface AssignGroupsBody {
  group_ids: number[]
}

export interface Permission {
  id: number
  name: string
  codename: string
  app_label: string
  model: string
}

export interface GroupWithPermissions {
  id: number
  name: string
  permissions: Permission[]
}

export interface AssignPermissionsBody {
  permission_ids: number[]
}
